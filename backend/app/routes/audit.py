from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.db import get_db
import asyncpg
import json

router = APIRouter(prefix="/audit-cycles", tags=["Asset Audit & Verification Cycle"])

class CreateAuditCycleRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    department_scope: Optional[str] = None
    location_scope: Optional[str] = None
    created_by: str

class UpdateAuditRecordRequest(BaseModel):
    verification_status: str  # 'Pending', 'Verified', 'Missing', 'Damaged'
    notes: Optional[str] = None
    auditor_id: str

@router.post("", summary="Create a new audit cycle and auto-snapshot target assets into audit_records")
async def create_audit_cycle(payload: CreateAuditCycleRequest, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Create audit cycle
            cycle_row = await conn.fetchrow(
                """
                INSERT INTO audit_cycles (title, description, start_date, end_date, department_scope, location_scope, status, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, 'In-Progress', $7)
                RETURNING id, title, status, start_date, end_date
                """,
                payload.title, payload.description, payload.start_date, payload.end_date, payload.department_scope, payload.location_scope, payload.created_by
            )
            
            # 2. Bulk-snapshot target assets
            if payload.department_scope:
                inserted = await conn.execute(
                    """
                    INSERT INTO audit_records (
                        audit_cycle_id, asset_id, verification_status,
                        baseline_status, baseline_location, baseline_department_id, baseline_assignee_id
                    )
                    SELECT 
                        $1, id, 'Pending',
                        status, location, department_id, current_assignee_id
                    FROM assets
                    WHERE department_id = $2 AND status NOT IN ('Retired', 'Disposed')
                    """,
                    cycle_row["id"], payload.department_scope
                )
            else:
                inserted = await conn.execute(
                    """
                    INSERT INTO audit_records (
                        audit_cycle_id, asset_id, verification_status,
                        baseline_status, baseline_location, baseline_department_id, baseline_assignee_id
                    )
                    SELECT 
                        $1, id, 'Pending',
                        status, location, department_id, current_assignee_id
                    FROM assets
                    WHERE status NOT IN ('Retired', 'Disposed')
                    """,
                    cycle_row["id"]
                )
            
            return {
                "status": "success",
                "audit_cycle": dict(cycle_row),
                "assets_snapshotted": inserted
            }

@router.patch("/records/{record_id}", summary="Update individual asset verification record status during active audit")
async def update_audit_record(record_id: str, payload: UpdateAuditRecordRequest, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE audit_records
            SET verification_status = $1,
                notes = $2,
                auditor_id = $3,
                verified_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, asset_id, verification_status, verified_at
            """,
            payload.verification_status, payload.notes, payload.auditor_id, record_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Audit record not found.")
        return {"status": "success", "record": dict(row)}

@router.post("/{cycle_id}/close", summary="Close audit cycle, trigger Missing->Lost updates, create Maintenance tickets, and return Discrepancy Report")
async def close_audit_cycle(cycle_id: str, closing_user_id: str, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Batch-Update Missing assets to Lost (triggers asset_history audit log)
            missing_update = await conn.execute(
                """
                WITH missing_items AS (
                    SELECT ar.asset_id
                    FROM audit_records ar
                    WHERE ar.audit_cycle_id = $1 AND ar.verification_status = 'Missing'
                )
                UPDATE assets a
                SET status = 'Lost'
                FROM missing_items m
                WHERE a.id = m.asset_id AND a.status != 'Lost'
                """,
                cycle_id
            )
            
            # 2. Batch-Generate Maintenance Tickets for Damaged assets
            damaged_insert = await conn.execute(
                """
                INSERT INTO maintenance_requests (asset_id, requested_by, status, priority, issue_title, issue_description)
                SELECT 
                    ar.asset_id, $2, 'pending', 'high',
                    CONCAT('Audit Discrepancy: Damaged Asset during cycle #', $1),
                    COALESCE(ar.notes, 'Flagged as damaged during audit verification cycle.')
                FROM audit_records ar
                WHERE ar.audit_cycle_id = $1 AND ar.verification_status = 'Damaged'
                """,
                cycle_id, closing_user_id
            )
            
            # 3. Mark cycle Closed
            await conn.execute(
                """
                UPDATE audit_cycles
                SET status = 'Closed', closed_by = $2, closed_at = CURRENT_TIMESTAMP
                WHERE id = $1
                """,
                cycle_id, closing_user_id
            )
            
            # 4. Generate summary
            summary_rows = await conn.fetch(
                """
                SELECT 
                    ar.verification_status,
                    COUNT(*) AS count,
                    json_agg(json_build_object(
                        'asset_id', a.id,
                        'asset_tag', a.asset_tag,
                        'name', a.name,
                        'baseline_status', ar.baseline_status,
                        'notes', ar.notes
                    )) AS items
                FROM audit_records ar
                JOIN assets a ON a.id = ar.asset_id
                WHERE ar.audit_cycle_id = $1
                GROUP BY ar.verification_status
                """,
                cycle_id
            )
            
            # 5. Refresh materialized views
            await conn.execute("SELECT refresh_analytics_materialized_views()")
            
            return {
                "status": "success",
                "cycle_id": cycle_id,
                "reconciliation": {
                    "missing_to_lost_updates": missing_update,
                    "damaged_maintenance_tickets_created": damaged_insert
                },
                "discrepancy_report": [
                    {
                        "status": r["verification_status"],
                        "count": r["count"],
                        "items": json.loads(r["items"]) if r["items"] else []
                    }
                    for r in summary_rows
                ]
            }
