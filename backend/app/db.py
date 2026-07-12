import os
import asyncpg
from typing import Optional
from fastapi import HTTPException

pool: Optional[asyncpg.Pool] = None

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://assetflow:SecretSecurePass2026!@postgres:5432/assetflow_db"
)

async def connect_to_db():
    global pool
    try:
        pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=1,
            max_size=5,
            command_timeout=10
        )
        print("✅ Connected to PostgreSQL Database Engine.")
    except Exception as e:
        print(f"⚠️ Could not connect to PostgreSQL ({DATABASE_URL}): {e}")
        print("ℹ️ API Server starting in offline mode: Interactive Swagger Documentation (/docs) is fully accessible.")

async def close_db_connection():
    global pool
    if pool:
        await pool.close()
        print("Closed PostgreSQL Database Engine connection pool.")

async def get_db():
    global pool
    if not pool:
        await connect_to_db()
    if not pool:
        raise HTTPException(status_code=503, detail="PostgreSQL Database connection offline. Please start Docker (`docker compose up -d`) or local PostgreSQL server.")
    return pool
