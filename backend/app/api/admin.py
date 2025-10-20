"""
Admin API endpoints for database management
管理員 API 端點 - 資料庫管理
"""

import csv
import io
import re
import secrets
import string
from typing import Any, Dict, List, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, field_validator
from sqlalchemy import inspect, text
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token, get_password_hash
from app.core.database import engine, get_session
from app.core.seeds import run_all_seeds, run_test_seeds
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(
    current_user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
) -> dict:
    """
    Require admin role for access

    Verifies admin role from database (not just JWT token)
    to ensure real-time permission changes are enforced.

    Falls back to demo accounts if user not found in database.
    """
    from uuid import UUID

    from app.core.auth import DEMO_ACCOUNTS

    # Get user from database to verify current roles
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    try:
        # Query database for current user roles
        db_user = session.exec(select(User).where(User.id == UUID(user_id))).first()

        if db_user:
            # User found in database - verify from DB
            if not db_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive",
                )

            # Check admin role from database (not JWT token)
            if "admin" not in db_user.roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin access required",
                )

            # Return verified user info from database
            return {
                "user_id": str(db_user.id),
                "email": db_user.email,
                "roles": db_user.roles,
                "name": db_user.name,
            }
        else:
            # User not in database - check if it's a demo account
            demo_account = next(
                (acc for acc in DEMO_ACCOUNTS if acc["id"] == user_id), None
            )

            if demo_account:
                # Verify admin role for demo account
                if "admin" not in demo_account["roles"]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Admin access required",
                    )

                return {
                    "user_id": demo_account["id"],
                    "email": demo_account["email"],
                    "roles": demo_account["roles"],
                    "name": demo_account["name"],
                }
            else:
                # Neither database user nor demo account
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )


@router.get("/db/status")
def get_database_status(
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Get database connection status and basic info"""
    try:
        # Test connection
        result = db.execute(text("SELECT 1"))
        result.scalar()

        # Get database name
        db_name_result = db.execute(text("SELECT current_database()"))
        db_name = db_name_result.scalar()

        # Get database size
        size_result = db.execute(
            text(
                """
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """
            )
        )
        db_size = size_result.scalar()

        return {
            "status": "connected",
            "database": db_name,
            "size": db_size,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


@router.get("/db/tables")
def list_tables(
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> List[Dict[str, Any]]:
    """List all tables with row counts"""
    try:
        # Get all table names
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        table_info = []
        for table in tables:
            # Get row count for each table
            count_result = db.execute(
                text(f"SELECT COUNT(*) FROM {table}")  # nosec B608
            )
            row_count = count_result.scalar()

            # Get column count
            columns = inspector.get_columns(table)

            table_info.append(
                {
                    "name": table,
                    "row_count": row_count,
                    "column_count": len(columns),
                }
            )

        return sorted(table_info, key=lambda x: x["name"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tables: {str(e)}",
        )


@router.get("/db/table/{table_name}")
def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Get table data with pagination"""
    try:
        # Validate table name to prevent SQL injection
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found",
            )

        # Get total count
        count_result = db.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")  # nosec B608
        )
        total_count = count_result.scalar()

        # Get columns
        columns = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns]

        # Get data with pagination
        data_result = db.execute(
            text(
                f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset"  # nosec B608
            ),
            {"limit": limit, "offset": offset},
        )
        rows = data_result.fetchall()

        # Convert rows to dictionaries
        data = []
        for row in rows:
            data.append(dict(zip(column_names, row)))

        return {
            "table": table_name,
            "columns": column_names,
            "data": data,
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get table data: {str(e)}",
        )


@router.post("/db/seed")
def seed_database(
    include_test: bool = False,
    _: dict = Depends(require_admin),
) -> Dict[str, str]:
    """Seed database with initial data"""
    try:
        if include_test:
            run_all_seeds(include_test_data=True)
            message = "Database seeded with production and test data"
        else:
            run_all_seeds(include_test_data=False)
            message = "Database seeded with production data"

        return {"status": "success", "message": message}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed database: {str(e)}",
        )


@router.post("/db/seed/test")
def seed_test_data(
    _: dict = Depends(require_admin),
) -> Dict[str, str]:
    """Seed database with test data only"""
    try:
        run_test_seeds()
        return {
            "status": "success",
            "message": "Database seeded with test data",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed test data: {str(e)}",
        )


@router.delete("/db/table/{table_name}")
def clear_table(
    table_name: str,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, str]:
    """Clear all data from a specific table"""
    try:
        # Validate table name
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found",
            )

        # Don't allow clearing critical tables
        protected_tables = ["alembic_version"]
        if table_name in protected_tables:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot clear protected table '{table_name}'",
            )

        # Clear the table
        db.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))  # nosec B608
        db.commit()

        return {
            "status": "success",
            "message": f"Table '{table_name}' cleared successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear table: {str(e)}",
        )


# ========================================
# User Management Endpoints
# ========================================


class UserInput(BaseModel):
    """Single user input with optional password and metadata"""

    email: str
    password: str | None = None
    name: str | None = None
    roles: List[str] | None = None


class BatchCreateRequest(BaseModel):
    """Request model for batch user creation"""

    emails: List[str] | None = None  # Legacy: plain email list
    users: List[UserInput] | None = None  # New: full user data with passwords
    on_duplicate: Literal["skip", "reset_password"] = "skip"

    @field_validator("emails")
    @classmethod
    def validate_emails(cls, v):
        """Validate email format"""
        if v is not None and not isinstance(v, list):
            raise ValueError("emails must be a list")
        return v


class UserCreatedResponse(BaseModel):
    """Response for successfully created user"""

    email: str
    password: str
    created: bool = True


class UserExistingResponse(BaseModel):
    """Response for existing user"""

    email: str
    password: str | None = None
    created_at: str | None = None
    action: Literal["skipped", "password_reset"]


class UserFailedResponse(BaseModel):
    """Response for failed user creation"""

    email: str
    reason: str


class BatchCreateResponse(BaseModel):
    """Response model for batch user creation"""

    success: List[UserCreatedResponse]
    existing: List[UserExistingResponse]
    failed: List[UserFailedResponse]


def is_valid_email(email: str) -> bool:
    """Validate email format using regex"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def generate_random_password(length: int = 12) -> str:
    """
    Generate random password with guaranteed complexity

    Requirements:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    chars = string.ascii_letters + string.digits + "!@#$%^&*"

    while True:
        password = "".join(secrets.choice(chars) for _ in range(length))

        # Check all requirements
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*" for c in password)

        if has_lower and has_upper and has_digit and has_special:
            return password


@router.post("/users/batch", response_model=BatchCreateResponse)
def batch_create_users(
    request: BatchCreateRequest,
    _: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    Batch create users from email list or full user data (Admin only)

    Supports two input formats:
    1. emails: List of email strings (legacy, auto-generates passwords)
    2. users: List of {email, password, name, roles} objects (new format)

    Creates users with:
    - counselor role by default (if not specified)
    - randomly generated secure passwords (if not provided)
    - email prefix as username (if name not provided)

    Handles duplicates according to on_duplicate setting:
    - skip: Ignore existing users
    - reset_password: Update password for existing users
    """
    results = {"success": [], "existing": [], "failed": []}

    # Normalize input: convert emails list to users list
    user_inputs = []
    if request.users:
        user_inputs = request.users
    elif request.emails:
        user_inputs = [UserInput(email=email) for email in request.emails]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'emails' or 'users' must be provided",
        )

    # Deduplicate by email
    seen = set()
    unique_users = []
    for user_input in user_inputs:
        email = user_input.email.strip().lower()
        if email not in seen:
            seen.add(email)
            unique_users.append(user_input)

    for user_input in unique_users:
        email = user_input.email.strip().lower()

        # Validate email format
        if not is_valid_email(email):
            results["failed"].append({"email": email, "reason": "Invalid email format"})
            continue

        # Extract user data
        provided_password = user_input.password
        user_name = user_input.name or email.split("@")[0]
        user_roles = user_input.roles or ["counselor"]

        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == email)).first()

        if existing_user:
            if request.on_duplicate == "skip":
                # Skip existing user
                results["existing"].append(
                    {
                        "email": email,
                        "created_at": (
                            existing_user.created_at.isoformat()
                            if existing_user.created_at
                            else None
                        ),
                        "action": "skipped",
                    }
                )
                continue

            elif request.on_duplicate == "reset_password":
                # Update existing user's password and metadata
                new_password = provided_password or generate_random_password()
                existing_user.hashed_password = get_password_hash(new_password)
                existing_user.name = user_name
                existing_user.roles = user_roles
                existing_user.must_change_password = (
                    False if provided_password else True
                )  # Don't force change if password provided
                session.add(existing_user)

                results["existing"].append(
                    {
                        "email": email,
                        "password": new_password,
                        "action": "password_reset",
                    }
                )
                continue

        # Create new user
        try:
            new_password = provided_password or generate_random_password()
            new_user = User(
                email=email,
                name=user_name,
                hashed_password=get_password_hash(new_password),
                roles=user_roles,
                is_active=True,
                must_change_password=(
                    False if provided_password else True
                ),  # Only force change if auto-generated
            )
            session.add(new_user)

            results["success"].append(
                {"email": email, "password": new_password, "created": True}
            )
        except Exception as e:
            results["failed"].append(
                {"email": email, "reason": f"Database error: {str(e)}"}
            )

    # Commit all changes
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to commit changes: {str(e)}",
        )

    return results


@router.get("/users")
def list_all_users(
    _: dict = Depends(require_admin),
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Dict[str, Any]:
    """
    List all users (Admin only)

    Returns paginated list of users with basic info.
    """
    users = session.exec(select(User).offset(skip).limit(limit)).all()

    return {
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "roles": user.roles,
                "is_active": user.is_active,
                "created_at": (
                    user.created_at.isoformat() if user.created_at else None
                ),
            }
            for user in users
        ],
        "total": len(users),
    }


@router.put("/users/{user_id}/password")
def reset_user_password(
    user_id: str,
    _: dict = Depends(require_admin),
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Reset user password (Admin only)

    Generates new random password for specified user.
    """
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    user = session.exec(select(User).where(User.id == user_uuid)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    new_password = generate_random_password()
    user.hashed_password = get_password_hash(new_password)
    session.add(user)
    session.commit()

    return {
        "email": user.email,
        "password": new_password,
        "reset_at": user.updated_at.isoformat() if user.updated_at else None,
    }


class WhitelistImportResult(BaseModel):
    """Result of whitelist import operation"""

    total_rows: int
    created: int
    skipped: int
    errors: List[str]
    created_users: List[Dict[str, str]]  # email, password pairs


@router.post("/import-whitelist", response_model=WhitelistImportResult)
def import_whitelist(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    Import whitelist users from CSV file

    CSV format:
    - Column 1: Email (required)
    - Column 2: Password (optional, auto-generates if empty)
    - Column 3: Name (optional, defaults to email prefix)
    - Column 4: Roles (optional, defaults to "counselor", comma-separated)

    First row can be a header (email,password,...) which will be skipped.

    Returns:
    - List of created/updated users with their passwords
    - Users with provided passwords: no forced change
    - Users with auto-generated passwords: must change on first login
    - Automatically overwrites existing users (updates password + metadata)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    try:
        # Read CSV content
        contents = file.file.read().decode("utf-8-sig")  # Handle BOM
        csv_reader = csv.reader(io.StringIO(contents))

        total_rows = 0
        created = 0
        skipped = 0
        errors = []
        created_users = []

        for row_num, row in enumerate(csv_reader, start=1):
            # Skip header row
            if row_num == 1 and row and row[0].strip().lower() == 'email':
                continue

            # Skip empty rows
            if not row or not row[0].strip():
                continue

            total_rows += 1

            try:
                # Parse row: email, password, name (optional), roles (optional)
                email = row[0].strip().lower()
                password = row[1].strip() if len(row) > 1 and row[1].strip() else None
                name = (
                    row[2].strip() if len(row) > 2 and row[2].strip()
                    else email.split("@")[0]
                )
                roles_str = (
                    row[3].strip() if len(row) > 3 and row[3].strip()
                    else "counselor"
                )
                roles = [r.strip() for r in roles_str.split(",")]

                # Validate email format
                if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                    errors.append(f"Row {row_num}: Invalid email format '{email}'")
                    continue

                # Check if user exists
                existing_user = session.exec(
                    select(User).where(User.email == email)
                ).first()

                if existing_user:
                    # Update existing user's password and metadata
                    new_password = password or generate_random_password()
                    existing_user.hashed_password = get_password_hash(new_password)
                    existing_user.name = name
                    existing_user.roles = roles
                    existing_user.must_change_password = (
                        False if password else True
                    )  # Don't force change if password provided
                    session.add(existing_user)
                    session.flush()

                    created += 1  # Count as "created" (updated)
                    created_users.append({
                        "email": email,
                        "password": new_password,
                    })
                    continue

                # Use provided password or generate random one
                new_password = password or generate_random_password()
                new_user = User(
                    email=email,
                    name=name,
                    hashed_password=get_password_hash(new_password),
                    roles=roles,
                    is_active=True,
                    must_change_password=(
                        False if password else True
                    ),  # Don't force change if password provided
                )
                session.add(new_user)
                session.flush()  # Get user ID without committing

                created += 1
                created_users.append({
                    "email": email,
                    "password": new_password,
                })

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue

        # Commit all changes
        session.commit()

        return WhitelistImportResult(
            total_rows=total_rows,
            created=created,
            skipped=skipped,
            errors=errors,
            created_users=created_users,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process CSV file: {str(e)}",
        )
    finally:
        file.file.close()
