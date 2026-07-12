from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/analytics", tags=["Analytics & Operational Reporting"])

@router.get("/dashboard-kpis", summary="Retrieve real-time Dashboard KPI counters from materialized summary view")
async def get_dashboard_kpis(pool: asyncpg.Pool = Depends(get_db)):
    """
    Fetches sub-15ms KPI metrics by directly reading the `mv_asset_status_summary` materialized view.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM mv_asset_status_summary LIMIT 1")
        if not row:
            # Fallback if materialized view hasn't been refreshed yet
            await conn.execute("SELECT refresh_analytics_materialized_views()")
            row = await conn.fetchrow("SELECT * FROM mv_asset_status_summary LIMIT 1")
        
        return {
            "status": "success",
            "data": dict(row) if row else {}
        }

@router.get("/maintenance-insights", summary="Identify assets requiring retirement recommendation due to high repair costs/frequency")
async def get_maintenance_insights(pool: asyncpg.Pool = Depends(get_db)):
    """
    Queries `v_maintenance_retirement_insights` to return assets with high breakdown frequencies or $>50\%$ repair cost ratio.
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM v_maintenance_retirement_insights")
        return {
            "status": "success",
            "total_flagged_for_retirement": sum(1 for r in rows if r["suggest_retirement"]),
            "insights": [dict(r) for r in rows]
        }

@router.get("/utilization-trends", summary="Retrieve 30-day Most-Used vs. Idle asset utilization metrics")
async def get_utilization_trends(pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM v_asset_utilization_30_days")
        return {
            "status": "success",
            "count": len(rows),
            "trends": [dict(r) for r in rows]
        }

@router.get("/booking-heatmap", summary="Retrieve resource booking frequency heatmap by category, day-of-week, and hour")
async def get_booking_heatmap(pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM v_booking_category_heatmap")
        return {
            "status": "success",
            "heatmap": [dict(r) for r in rows]
        }
