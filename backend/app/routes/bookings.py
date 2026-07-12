from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db import get_db
import asyncpg

router = APIRouter(prefix="/bookings", tags=["Screen 6: Resource Booking & Overlap Validation"])

class CreateBookingRequest(BaseModel):
    resource_id: str
    user_id: str
    start_time: str
    end_time: str
    purpose: str

@router.get("/resource/{resource_id}/calendar", summary="Screen 6: Calendar view of a shared resource's existing bookings")
async def get_resource_calendar(resource_id: str, pool: asyncpg.Pool = Depends(get_db)):
    """
    Returns calendar view of a resource's bookings as requested by Screen 6.
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT b.*, u.first_name, u.last_name, u.email
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.resource_id = $1 AND b.status != 'cancelled'
            ORDER BY b.start_time ASC
            """,
            resource_id
        )
        return {"status": "success", "count": len(rows), "calendar_bookings": [dict(r) for r in rows]}

@router.post("", summary="Screen 6: Book shared resource with strict Overlap Validation (`btree_gist` check)")
async def create_booking(payload: CreateBookingRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Implements Screen 6 overlap validation:
    'Two people can't book the same room at overlapping times. Example: Room B2 is booked 9:00-10:00. Request for 9:30-10:30 gets rejected since it overlaps; request for 10:00-11:00 is fine since it starts right after.'
    """
    start = datetime.fromisoformat(payload.start_time)
    end = datetime.fromisoformat(payload.end_time)
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be strictly after start time.")
        
    async with pool.acquire() as conn:
        # Pre-check check for clear error message before Postgres raises exclusion violation
        overlap = await conn.fetchrow(
            """
            SELECT id, start_time, end_time, purpose
            FROM bookings
            WHERE resource_id = $1
              AND status IN ('confirmed', 'Upcoming', 'Ongoing')
              AND tstzrange(start_time, end_time, '[)') && tstzrange($2, $3, '[)')
            LIMIT 1
            """,
            payload.resource_id, start, end
        )
        if overlap:
            raise HTTPException(
                status_code=409,
                detail=f"Overlap Validation Rejected: Resource is already booked from {overlap['start_time']} to {overlap['end_time']} ({overlap['purpose']})."
            )
            
        row = await conn.fetchrow(
            """
            INSERT INTO bookings (resource_id, user_id, start_time, end_time, status, purpose)
            VALUES ($1, $2, $3, $4, 'confirmed', $5)
            RETURNING *
            """,
            payload.resource_id, payload.user_id, start, end, payload.purpose
        )
        return {"status": "success", "booking": dict(row)}

@router.patch("/{booking_id}/reschedule-or-cancel", summary="Screen 6: Cancel or reschedule booking before time slot starts")
async def update_booking(booking_id: str, status: Optional[str] = None, start_time: Optional[str] = None, end_time: Optional[str] = None, pool: asyncpg.Pool = Depends(get_db)):
    async with pool.acquire() as conn:
        booking = await conn.fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
            
        new_status = status or booking["status"]
        new_start = datetime.fromisoformat(start_time) if start_time else booking["start_time"]
        new_end = datetime.fromisoformat(end_time) if end_time else booking["end_time"]
        
        row = await conn.fetchrow(
            """
            UPDATE bookings
            SET status = $1, start_time = $2, end_time = $3
            WHERE id = $4
            RETURNING *
            """,
            new_status, new_start, new_end, booking_id
        )
        return {"status": "success", "booking": dict(row)}
