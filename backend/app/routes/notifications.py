from fastapi import APIRouter, Depends
from app.db import get_db
import asyncpg
from typing import Optional

router = APIRouter(prefix="/notifications", tags=["Screen 10: Notifications & Activity Audit Logs"])

@router.get("", summary="Screen 10: Retrieve user notifications (Asset Assigned, Maintenance Approved/Rejected, Overdue Alert, etc.)")
async def get_notifications(user_id: str, unread_only: bool = False, pool: asyncpg.Pool = Depends(get_db)):
    query = "SELECT * FROM notifications WHERE user_id = $1"
    if unread_only:
        query += " AND is_read = FALSE"
    query += " ORDER BY created_at DESC LIMIT 50"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, user_id)
        unread_count = await conn.fetchval("SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE", user_id)
        return {
            "status": "success",
            "unread_count": unread_count,
            "notifications": [dict(r) for r in rows]
        }

@router.patch("/{notification_id}/read", summary="Screen 10: Mark notification as read")
async def mark_notification_read(notification_id: str, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        await conn.execute("UPDATE notifications SET is_read = TRUE WHERE id = $1", notification_id)
        return {"status": "success", "message": "Notification marked as read."}

@router.get("/activity-logs", summary="Screen 10: Full audit log of admin/manager/employee actions (`who did what, when`)")
async def get_activity_logs(module: Optional[str] = None, user_id: Optional[str] = None, pool: asyncpg.Pool = Depends(get_db)):
    query = """
        SELECT l.*, u.first_name, u.last_name, u.email, r.name as role_name
        FROM activity_logs l
        LEFT JOIN users u ON u.id = l.user_id
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE 1=1
    """
    params = []
    if module:
        params.append(module)
        query += f" AND l.module = ${len(params)}"
    if user_id:
        params.append(user_id)
        query += f" AND l.user_id = ${len(params)}"
        
    query += " ORDER BY l.created_at DESC LIMIT 100"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return {"status": "success", "count": len(rows), "activity_logs": [dict(r) for r in rows]}
