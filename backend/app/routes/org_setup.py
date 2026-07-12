from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/org-setup", tags=["Screen 3: Organization Setup (Admin Only - 3 Tabs)"])

# ============================================================================
# TAB A: Department Management
# ============================================================================
class DepartmentRequest(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: bool = True

@router.get("/departments", summary="Tab A: List all departments and parent-child hierarchy")
async def list_departments(pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT d.id, d.code, d.name, d.description, d.is_active, d.parent_department_id,
                   p.name as parent_name, u.first_name as manager_first_name, u.last_name as manager_last_name
            FROM departments d
            LEFT JOIN departments p ON p.id = d.parent_department_id
            LEFT JOIN users u ON u.id = d.manager_id
            ORDER BY d.code ASC
            """
        )
        return {"status": "success", "departments": [dict(r) for r in rows]}

@router.post("/departments", summary="Tab A: Create new department")
async def create_department(payload: DepartmentRequest, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO departments (code, name, description, parent_department_id, manager_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            """,
            payload.code, payload.name, payload.description, payload.parent_department_id, payload.manager_id, payload.is_active
        )
        return {"status": "success", "department": dict(row)}

# ============================================================================
# TAB B: Asset Category Management
# ============================================================================
class AssetCategoryRequest(BaseModel):
    name: str
    description: Optional[str] = None
    warranty_period_months: int = 12
    is_active: bool = True

@router.get("/asset-categories", summary="Tab B: List asset categories and category-specific fields")
async def list_asset_categories(pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM asset_categories ORDER BY name ASC")
        return {"status": "success", "categories": [dict(r) for r in rows]}

@router.post("/asset-categories", summary="Tab B: Create or edit asset category with custom fields schema")
async def create_asset_category(payload: AssetCategoryRequest, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO asset_categories (name, description, warranty_period_months, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            payload.name, payload.description, payload.warranty_period_months, payload.is_active
        )
        return {"status": "success", "category": dict(row)}

# ============================================================================
# TAB C: Employee Directory & Role Promotion
# ============================================================================
class PromoteEmployeeRequest(BaseModel):
    target_role_name: str # 'Department Head' or 'Asset Manager'

@router.get("/employees", summary="Tab C: Employee Directory with current role, department, and status")
async def list_employees(pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, r.name as role_name, d.name as department_name
            FROM users u
            JOIN roles r ON r.id = u.role_id
            LEFT JOIN departments d ON d.id = u.department_id
            ORDER BY u.last_name ASC
            """
        )
        return {"status": "success", "employees": [dict(r) for r in rows]}

@router.post("/employees/{user_id}/promote", summary="Tab C: Promote Employee to Department Head or Asset Manager (Only place roles are assigned)")
async def promote_employee(user_id: str, payload: PromoteEmployeeRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 3 Tab C specification:
    'Admin promotes an Employee to Department Head or Asset Manager here — this is the only place roles are assigned.'
    """
    if payload.target_role_name not in ['Department Head', 'Asset Manager', 'Admin']:
        raise HTTPException(status_code=400, detail="Can only promote to Department Head, Asset Manager, or Admin.")
        
    async with pool.acquire() as conn:
        role = await conn.fetchrow("SELECT id FROM roles WHERE name = $1 LIMIT 1", payload.target_role_name)
        if not role:
            raise HTTPException(status_code=404, detail="Target role not found.")
            
        row = await conn.fetchrow(
            "UPDATE users SET role_id = $1 WHERE id = $2 RETURNING id, email, first_name, last_name",
            role["id"], user_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Employee not found.")
            
        # Log promotion
        await conn.execute(
            """
            INSERT INTO activity_logs (user_id, action, module, description)
            VALUES ($1, 'PROMOTE_USER', 'USERS', $2)
            """,
            user_id, f"User promoted to {payload.target_role_name}"
        )
        
        return {
            "status": "success",
            "message": f"Employee {row['first_name']} {row['last_name']} successfully promoted to {payload.target_role_name}.",
            "user": dict(row)
        }
