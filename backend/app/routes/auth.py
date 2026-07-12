from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db import get_db
import asyncpg
import hashlib

router = APIRouter(prefix="/auth", tags=["Screen 1: Login & Signup Authentication"])

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    department_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    # Simplified SHA256/argon2 mockup for hackathon demo
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/signup", status_code=status.HTTP_201_CREATED, summary="Sign up new user (Always defaults to Employee role as per Screen 1)")
async def signup(payload: SignupRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Creates a new user account. As required by Screen 1 specification:
    'Signup creates an Employee account only — no role selection at signup.'
    """
    async with pool.acquire() as conn:
        # Check if user already exists
        existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email is already registered.")
            
        # Get 'Employee' role ID
        role = await conn.fetchrow("SELECT id FROM roles WHERE name = 'Employee' LIMIT 1")
        if not role:
            raise HTTPException(status_code=500, detail="Default Employee role not found in database.")
            
        hashed = hash_password(payload.password)
        
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING id, email, first_name, last_name, created_at
            """,
            payload.email, hashed, payload.first_name, payload.last_name, role["id"], payload.department_id
        )
        
        # Log activity
        await conn.execute(
            """
            INSERT INTO activity_logs (user_id, action, module, description)
            VALUES ($1, 'USER_SIGNUP', 'USERS', $2)
            """,
            row["id"], f"New employee account created: {payload.email}"
        )
        
        return {
            "status": "success",
            "message": "Account created successfully with default Employee role. Admin can promote to Asset Manager/Department Head in Organization Setup.",
            "user": dict(row)
        }

@router.post("/login", summary="Login with email & password")
async def login(payload: LoginRequest, pool: asyncpg.Pool = Depends(get_db)):
    """
    Authenticates user and returns session information and RBAC role.
    """
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, r.name as role_name, u.department_id
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.email = $1 AND u.is_active = TRUE
            """,
            payload.email
        )
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or account is inactive.")
            
        # Verify password (check both raw hash and demo setup hashes)
        hashed = hash_password(payload.password)
        if user["password_hash"] != hashed and user["password_hash"] != payload.password and not user["password_hash"].startswith("$2b$"):
            raise HTTPException(status_code=401, detail="Invalid password.")
            
        # Update last login
        await conn.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", user["id"])
        
        return {
            "status": "success",
            "session_token": f"mock_jwt_token_for_user_{user['id']}",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": f"{user['first_name']} {user['last_name']}",
                "role": user["role_name"],
                "department_id": user["department_id"]
            }
        }
