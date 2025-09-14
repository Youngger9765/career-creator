"""
Authentication schemas
認證相關的 Pydantic 模型
"""

from typing import List

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request schema"""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response schema"""

    access_token: str
    token_type: str
    user: dict


class DemoAccount(BaseModel):
    """Demo account info schema"""

    id: str
    name: str
    email: EmailStr
    roles: List[str]
    description: str


class TokenPayload(BaseModel):
    """JWT token payload"""

    sub: str  # user_id
    email: str
    roles: List[str]
    exp: int
