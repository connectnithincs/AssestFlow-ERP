from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/assets", tags=["Screen 4 & 5: Asset Registration, Allocation, Transfer & Return"])

# ============================================================================
# SCREEN 4: Asset Registration & Directory
# ============================================================================
class RegisterAssetRequest(BaseModel):
    name: str
    category: str
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = 0.0
    condition: str = "Good"
    location: Optional[str] = "Main Warehouse"
    is_bookable: bool = False
    department_id: Optional[str] = None

@router.post("/register", summary="Screen 4: Register new asset with auto-generated Asset Tag (e.g. AF-XXXX)")
async def register_asset(payload: RegisterAssetRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Registers a new asset into the system in 'Available' state with auto-generated tag (`AF-XXXX`).
    """
    async with pool.acquire() as conn:
        # Auto-generate asset tag sequence
        count = await conn.fetchval("SELECT COUNT(*) FROM assets")
        asset_tag = f"AF-{(count + 1):04d}"
        
        # Resolve category_id if possible
        cat = await conn.fetchrow("SELECT id FROM asset_categories WHERE name = $1 LIMIT 1", payload.category)
        category_id = cat["id"] if cat else None
        
        row = await conn.fetchrow(
            """
            INSERT INTO assets (
                asset_tag, name, category, category_id, status, department_id, condition,
                serial_number, manufacturer, model, purchase_cost, location, is_bookable
            )
            VALUES ($1, $2, $3, $4, 'Available', $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            """,
            asset_tag, payload.name, payload.category, category_id, payload.department_id, payload.condition,
            payload.serial_number, payload.manufacturer, payload.model, payload.purchase_cost, payload.location, payload.is_bookable
        )
        return {"status": "success", "asset": dict(row)}

@router.get("", summary="Screen 4: Search/filter master asset directory by Tag, Serial, Category, Status, Dept, or Location")
async def list_assets(
    tag: Optional[str] = None,
    serial: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    location: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_db)
):
    query = """
        SELECT a.*, u.first_name as assignee_first_name, u.last_name as assignee_last_name, d.name as department_name
        FROM assets a
        LEFT JOIN users u ON u.id = a.current_assignee_id
        LEFT JOIN departments d ON d.id = a.department_id
        WHERE 1=1
    """
    params = []
    
    if tag:
        params.append(f"%{tag}%")
        query += f" AND a.asset_tag ILIKE ${len(params)}"
    if serial:
        params.append(f"%{serial}%")
        query += f" AND a.serial_number ILIKE ${len(params)}"
    if category:
        params.append(category)
        query += f" AND a.category = ${len(params)}"
    if status:
        params.append(status)
        query += f" AND a.status = ${len(params)}"
    if department_id:
        params.append(department_id)
        query += f" AND a.department_id = ${len(params)}"
    if location:
        params.append(f"%{location}%")
        query += f" AND a.location ILIKE ${len(params)}"
        
    query += " ORDER BY a.created_at DESC"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return {"status": "success", "count": len(rows), "assets": [dict(r) for r in rows]}

@router.get("/{asset_id}/history", summary="Screen 4: Retrieve per-asset allocation + maintenance history")
async def get_asset_history(asset_id: str, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        allocations = await conn.fetch("SELECT * FROM asset_allocations WHERE asset_id = $1 ORDER BY allocated_at DESC", asset_id)
        maintenance = await conn.fetch("SELECT * FROM maintenance_requests WHERE asset_id = $1 ORDER BY created_at DESC", asset_id)
        history_audit = await conn.fetch("SELECT * FROM asset_history WHERE asset_id = $1 ORDER BY created_at DESC", asset_id)
        return {
            "status": "success",
            "allocation_history": [dict(r) for r in allocations],
            "maintenance_history": [dict(r) for r in maintenance],
            "audit_trail": [dict(r) for r in history_audit]
        }

# ============================================================================
# SCREEN 5: Asset Allocation, Conflict Handling, Transfer & Return
# ============================================================================
class AllocateAssetRequest(BaseModel):
    allocated_to_user_id: Optional[str] = None
    allocated_to_department_id: Optional[str] = None
    allocated_by_user_id: str
    expected_return_date: Optional[str] = None

class TransferRequestPayload(BaseModel):
    requested_by_user_id: str
    target_user_id: Optional[str] = None
    target_department_id: str
    transfer_reason: str

class ReturnAssetRequest(BaseModel):
    received_by_user_id: str
    returned_condition: str = "Good"
    return_checkin_notes: Optional[str] = None

@router.post("/{asset_id}/allocate", summary="Screen 5: Allocate asset with Conflict Prevention Rule")
async def allocate_asset(asset_id: str, payload: AllocateAssetRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 5 conflict rule:
    'You can't allocate an asset that's already taken. If Raj tries to allocate it too, system blocks it, shows currently held by Priya, and offers a Transfer Request button instead.'
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            asset = await conn.fetchrow(
                """
                SELECT a.*, u.first_name, u.last_name
                FROM assets a
                LEFT JOIN users u ON u.id = a.current_assignee_id
                WHERE a.id = $1
                """,
                asset_id
            )
            if not asset:
                raise HTTPException(status_code=404, detail="Asset not found.")
                
            # Conflict Check: Is it already allocated or reserved?
            if asset["status"] in ["Allocated", "Reserved"] and asset["current_assignee_id"]:
                holder_name = f"{asset['first_name']} {asset['last_name']}" if asset["first_name"] else "another department"
                return {
                    "status": "conflict",
                    "conflict_rule_triggered": True,
                    "message": f"Allocation Blocked: Asset {asset['asset_tag']} is currently held by {holder_name}.",
                    "current_holder": holder_name,
                    "action_required": "Initiate Transfer Request (`POST /api/v1/assets/transfer-requests`) instead of direct allocation."
                }
            elif asset["status"] != "Available":
                raise HTTPException(status_code=400, detail=f"Asset cannot be allocated. Current status: {asset['status']}")
                
            # Perform allocation
            expected_date = datetime.fromisoformat(payload.expected_return_date) if payload.expected_return_date else None
            await conn.execute(
                """
                UPDATE assets
                SET status = 'Allocated', current_assignee_id = $1, department_id = COALESCE($2, department_id), expected_return_date = $3
                WHERE id = $4
                """,
                payload.allocated_to_user_id, payload.allocated_to_department_id, expected_date, asset_id
            )
            
            # Record in allocation history
            alloc = await conn.fetchrow(
                """
                INSERT INTO asset_allocations (asset_id, allocated_to_user_id, allocated_to_department_id, allocated_by_user_id, expected_return_date)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                asset_id, payload.allocated_to_user_id, payload.allocated_to_department_id, payload.allocated_by_user_id, expected_date
            )
            
            return {"status": "success", "message": "Asset successfully allocated.", "allocation": dict(alloc)}

@router.post("/{asset_id}/transfer-requests", summary="Screen 5: Raise Transfer Request when asset is already held")
async def create_transfer_request(asset_id: str, payload: TransferRequestPayload, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        asset = await conn.fetchrow("SELECT department_id, current_assignee_id FROM assets WHERE id = $1", asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found.")
            
        row = await conn.fetchrow(
            """
            INSERT INTO transfer_requests (
                asset_id, requested_by, source_department_id, target_department_id,
                source_assignee_id, target_assignee_id, transfer_reason, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *
            """,
            asset_id, payload.requested_by_user_id, asset["department_id"], payload.target_department_id,
            asset["current_assignee_id"], payload.target_user_id, payload.transfer_reason
        )
        return {"status": "success", "transfer_request": dict(row)}

@router.post("/{asset_id}/return", summary="Screen 5: Return flow with condition check-in notes (Status reverts to Available)")
async def return_asset(asset_id: str, payload: ReturnAssetRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 5 Return Flow:
    'Return flow: mark returned, capture condition check-in notes, asset status reverts to Available.'
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Update asset status back to Available and clear assignee
            await conn.execute(
                """
                UPDATE assets
                SET status = 'Available', current_assignee_id = NULL, expected_return_date = NULL, condition = $1
                WHERE id = $2
                """,
                payload.returned_condition, asset_id
            )
            
            # Close active allocation record
            alloc = await conn.fetchrow(
                """
                UPDATE asset_allocations
                SET returned_at = CURRENT_TIMESTAMP, returned_condition = $1, return_checkin_notes = $2, received_by_user_id = $3, is_active = FALSE
                WHERE asset_id = $4 AND is_active = TRUE
                RETURNING *
                """,
                payload.returned_condition, payload.return_checkin_notes, payload.received_by_user_id, asset_id
            )
            
            return {
                "status": "success",
                "message": f"Asset successfully returned and verified in {payload.returned_condition} condition. Status reverted to Available.",
                "allocation_closed": dict(alloc) if alloc else {}
            }
