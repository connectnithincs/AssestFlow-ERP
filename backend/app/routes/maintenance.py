from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/maintenance", tags=["Screen 7: Maintenance Management Workflow"])

class RaiseMaintenanceRequest(BaseModel):
    asset_id: str
    requested_by: str
    priority: str = "medium"
    issue_title: str
    issue_description: str
    photo_url: Optional[str] = None
    estimated_cost: Optional[float] = 0.0

class WorkflowStepRequest(BaseModel):
    action: str -- 'approve', 'reject', 'assign_technician', 'start_work', 'resolve'
    acting_user_id: str
    resolution_notes: Optional[str] = None
    actual_cost: Optional[float] = None

@router.post("", summary="Screen 7: Raise maintenance request with priority and attached photo")
async def raise_maintenance_request(payload: RaiseMaintenanceRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 7 raise request specification.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO maintenance_requests (asset_id, requested_by, priority, issue_title, issue_description, estimated_cost, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
            """,
            payload.asset_id, payload.requested_by, payload.priority, payload.issue_title, payload.issue_description, payload.estimated_cost
        )
        return {"status": "success", "maintenance_request": dict(row)}

@router.post("/{request_id}/workflow", summary="Screen 7: Execute approval workflow (`Pending -> Approved -> Technician Assigned -> In Progress -> Resolved`)")
async def execute_maintenance_workflow(request_id: str, payload: WorkflowStepRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 7 Workflow:
    - 'Approved / Rejected (by Asset Manager)' -> Auto-flips asset to 'Under Maintenance'.
    - 'Technician Assigned -> In Progress -> Resolved' -> Auto-flips asset back to 'Available'.
    """
    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "assign_technician": "technician_assigned",
        "start_work": "in_progress",
        "resolve": "resolved"
    }
    if payload.action not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action. Must be one of: approve, reject, assign_technician, start_work, resolve.")
        
    target_status = action_map[payload.action]
    
    async with pool.acquire() as conn:
        async with conn.transaction():
            req = await conn.fetchrow("SELECT asset_id, status FROM maintenance_requests WHERE id = $1", request_id)
            if not req:
                raise HTTPException(status_code=404, detail="Maintenance request not found.")
                
            row = await conn.fetchrow(
                """
                UPDATE maintenance_requests
                SET status = $1, acting_user_id = $2, resolution_notes = COALESCE($3, resolution_notes),
                    actual_cost = COALESCE($4, actual_cost), acted_at = CURRENT_TIMESTAMP,
                    completed_at = CASE WHEN $1 IN ('resolved', 'completed') THEN CURRENT_TIMESTAMP ELSE completed_at END
                WHERE id = $5
                RETURNING *
                """,
                target_status, payload.acting_user_id, payload.resolution_notes, payload.actual_cost, request_id
            )
            
            # Note: The database trigger `automate_maintenance_asset_status` automatically updates
            # the asset status to 'Under Maintenance' when target_status is 'approved',
            # and back to 'Available' when target_status is 'resolved'/'completed'!
            
            asset_row = await conn.fetchrow("SELECT id, asset_tag, status FROM assets WHERE id = $1", req["asset_id"])
            
            return {
                "status": "success",
                "workflow_transition": f"{req['status']} -> {target_status}",
                "maintenance_request": dict(row),
                "asset_status_auto_updated": dict(asset_row) if asset_row else {}
            }
