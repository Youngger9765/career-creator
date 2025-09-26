"""
Authentication API endpoints
認證 API - Demo 帳號登入系統
"""

from datetime import timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.auth import (
    DEMO_ACCOUNTS,
    create_access_token,
    find_demo_account_by_email,
    get_current_user_from_token,
    get_demo_accounts_list,
    get_password_hash,
    verify_password,
)
from app.core.config import settings
from app.core.database import get_session
from app.models.auth import DemoAccount, LoginRequest, LoginResponse
from app.models.user import User, UserResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.get("/demo-accounts", response_model=List[DemoAccount])
def get_demo_accounts():
    """Get list of demo accounts for quick login"""
    return get_demo_accounts_list()


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, session: Session = Depends(get_session)):
    """Login with email and password (supports demo accounts)"""

    # First check regular database users
    statement = select(User).where(User.email == login_data.email)
    user = session.exec(statement).first()

    # If user exists in database, use database user (even for demo accounts)
    if user:
        # Verify password (for demo accounts, allow both hashed and plain "demo123")
        is_valid_password = verify_password(login_data.password, user.hashed_password)
        if not is_valid_password and login_data.password == "demo123":
            # For demo accounts, also allow plain "demo123" password
            demo_account = find_demo_account_by_email(login_data.email)
            is_valid_password = demo_account is not None

        if not is_valid_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        # Create access token using database user UUID
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "roles": user.roles},
            expires_delta=access_token_expires,
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "roles": user.roles,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
            },
        )

    # Fallback to demo account if not found in database
    demo_account = find_demo_account_by_email(login_data.email)
    if demo_account and login_data.password == "demo123":
        # Demo account login
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={
                "sub": demo_account["id"],
                "email": demo_account["email"],
                "roles": demo_account["roles"],
            },
            expires_delta=access_token_expires,
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": demo_account["id"],
                "name": demo_account["name"],
                "email": demo_account["email"],
                "roles": demo_account["roles"],
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",  # Mock timestamp for demo
            },
        )

    # No valid user found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(
    current_user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
):
    """Get current user information"""

    # Check if it's a demo account
    if current_user["user_id"].startswith("demo-"):
        demo_account = next(
            (acc for acc in DEMO_ACCOUNTS if acc["id"] == current_user["user_id"]), None
        )
        if demo_account:
            return UserResponse(
                id=demo_account["id"],
                name=demo_account["name"],
                email=demo_account["email"],
                roles=demo_account["roles"],
                is_active=True,
                created_at="2024-01-01T00:00:00",
            )

    # Regular database user
    user = session.get(User, current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


@router.post("/init-demo-accounts")
def initialize_demo_accounts(session: Session = Depends(get_session)):
    """Initialize demo accounts in database (for development)"""

    created_accounts = []

    for demo_data in DEMO_ACCOUNTS:
        # Check if account already exists
        existing_user = session.exec(
            select(User).where(User.email == demo_data["email"])
        ).first()

        if not existing_user:
            # Create new demo user
            user = User(
                email=demo_data["email"],
                name=demo_data["name"],
                hashed_password=get_password_hash(str(demo_data["password"])),
                roles=demo_data["roles"],
                is_active=True,
            )
            session.add(user)
            created_accounts.append(demo_data["email"])

    session.commit()

    return {
        "message": "Demo accounts initialized",
        "created": created_accounts,
        "total_demo_accounts": len(DEMO_ACCOUNTS),
    }
