from fastapi import APIRouter, Depends
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/dashboard", tags=["Screen 2: Real-Time Operational Dashboard"])

@router.get("/snapshot", summary="Retrieve real-time KPI cards and highlighted overdue returns for Screen 2")
async def get_dashboard_snapshot(pool: asyncpg.Pool = Depends(get_db)):
    """
    Returns exact KPI cards requested by Screen 2 specification:
    - Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns
    - Overdue returns (past Expected Return Date) highlighted separately from upcoming ones.
    """
    async with pool.acquire() as conn:
        # 1. Core counters
        counters = await conn.fetchrow(
            """
            SELECT 
                COUNT(*) FILTER (WHERE status = 'Available') AS assets_available,
                COUNT(*) FILTER (WHERE status = 'Allocated') AS assets_allocated,
                (SELECT COUNT(*) FROM maintenance_requests WHERE status IN ('pending', 'approved', 'in_progress', 'technician_assigned')) AS maintenance_today,
                (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'Ongoing') AND end_time >= CURRENT_TIMESTAMP) AS active_bookings,
                (SELECT COUNT(*) FROM transfer_requests WHERE status = 'pending') AS pending_transfers
            FROM assets
            WHERE status NOT IN ('Retired', 'Disposed')
            """
        )
        
        # 2. Upcoming Returns (Allocated assets with expected_return_date in the future)
        upcoming_returns = await conn.fetch(
            """
            SELECT a.id, a.asset_tag, a.name, a.expected_return_date, u.first_name, u.last_name, d.name as department_name
            FROM assets a
            LEFT JOIN users u ON u.id = a.current_assignee_id
            LEFT JOIN departments d ON d.id = a.department_id
            WHERE a.status = 'Allocated' 
              AND a.expected_return_date IS NOT NULL 
              AND a.expected_return_date >= CURRENT_TIMESTAMP
            ORDER BY a.expected_return_date ASC
            LIMIT 10
            """
        )
        
        # 3. Overdue Returns (Past expected_return_date highlighted separately)
        overdue_returns = await conn.fetch(
            """
            SELECT a.id, a.asset_tag, a.name, a.expected_return_date, u.first_name, u.last_name, d.name as department_name,
                   ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.expected_return_date)) / 86400.0, 1) AS days_overdue
            FROM assets a
            LEFT JOIN users u ON u.id = a.current_assignee_id
            LEFT JOIN departments d ON d.id = a.department_id
            WHERE a.status = 'Allocated' 
              AND a.expected_return_date IS NOT NULL 
              AND a.expected_return_date < CURRENT_TIMESTAMP
            ORDER BY days_overdue DESC
            """
        )
        
        return {
            "status": "success",
            "kpi_cards": dict(counters) if counters else {},
            "upcoming_returns_count": len(upcoming_returns),
            "upcoming_returns": [dict(r) for r in upcoming_returns],
            "overdue_returns_count": len(overdue_returns),
            "overdue_returns": [dict(r) for r in overdue_returns],
            "quick_actions": [
                {"label": "Register Asset", "endpoint": "POST /api/v1/assets/register"},
                {"label": "Book Resource", "endpoint": "POST /api/v1/bookings"},
                {"label": "Raise Maintenance Request", "endpoint": "POST /api/v1/maintenance"}
            ]
        }
