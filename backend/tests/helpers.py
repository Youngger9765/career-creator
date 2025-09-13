"""
Test helpers and utilities
測試輔助工具
"""
from app.core.auth import create_access_token
from app.models.user import User


def create_auth_headers(user: User) -> dict:
    """Create JWT token and authorization headers for testing"""
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "roles": user.roles
    }
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}