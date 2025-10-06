"""
Authentication utilities
認證相關工具 - JWT token, password hashing, demo accounts
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token security
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None


def get_current_user_from_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """Extract user info from JWT token"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "roles": payload.get("roles", []),
    }


# Fixed UUIDs for demo accounts (for consistency across environments)
DEMO_ACCOUNT_UUIDS = {
    "demo.counselor@example.com": "00000000-0000-0000-0001-000000000001",
    "demo.counselor2@example.com": "00000000-0000-0000-0001-000000000002",
    "demo.admin@example.com": "00000000-0000-0000-0001-000000000003",
    "demo.client@example.com": "00000000-0000-0000-0001-000000000004",
}

# Demo accounts configuration
DEMO_ACCOUNTS = [
    {
        "id": DEMO_ACCOUNT_UUIDS["demo.counselor@example.com"],
        "name": "Dr. Sarah Chen",
        "email": "demo.counselor@example.com",
        "roles": ["counselor"],
        "description": "Senior career counselor with 10+ years experience",
        "password": "demo123",  # This will be hashed
    },
    {
        "id": DEMO_ACCOUNT_UUIDS["demo.counselor2@example.com"],
        "name": "Prof. Michael Wang",
        "email": "demo.counselor2@example.com",
        "roles": ["counselor"],
        "description": "Vocational psychology professor and counselor",
        "password": "demo123",
    },
    {
        "id": DEMO_ACCOUNT_UUIDS["demo.admin@example.com"],
        "name": "Admin User",
        "email": "demo.admin@example.com",
        "roles": ["admin", "counselor"],
        "description": "System administrator with full access",
        "password": "demo123",
    },
    {
        "id": DEMO_ACCOUNT_UUIDS["demo.client@example.com"],
        "name": "Alex Johnson",
        "email": "demo.client@example.com",
        "roles": ["client"],
        "description": "Demo client for testing client experience",
        "password": "demo123",
    },
]


def get_demo_accounts_list():
    """Get demo accounts list (without passwords)"""
    return [
        {
            "id": account["id"],
            "name": account["name"],
            "email": account["email"],
            "roles": account["roles"],
            "description": account["description"],
        }
        for account in DEMO_ACCOUNTS
    ]


def find_demo_account_by_email(email: str) -> Optional[dict]:
    """Find demo account by email"""
    return next(
        (account for account in DEMO_ACCOUNTS if account["email"] == email), None
    )
