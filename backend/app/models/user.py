from datetime import datetime
from typing import TYPE_CHECKING, List
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import String
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.client import ConsultationRecord, CounselorClientRelationship


class UserBase(SQLModel):
    """Base user model with common fields"""

    email: str = Field(unique=True, index=True)
    name: str = Field(max_length=100)


class User(UserBase, table=True):
    """User table model"""

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    # ["counselor", "client", "observer", "admin"]
    roles: List[str] = Field(default=["client"], sa_column=Column(ARRAY(String)))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Note: CRM relationships removed as counselor_id can be demo account (not in users table)

    def has_role(self, role: str) -> bool:
        """Check if user has specific role"""
        return role in self.roles

    def add_role(self, role: str) -> None:
        """Add role to user"""
        if role not in self.roles:
            # Create new list to trigger SQLAlchemy change tracking
            self.roles = self.roles + [role]

    def remove_role(self, role: str) -> None:
        """Remove role from user"""
        if role in self.roles:
            # Create new list to trigger change tracking
            self.roles = [r for r in self.roles if r != role]


class UserCreate(UserBase):
    """Schema for creating user"""

    password: str = Field(min_length=8)


class UserResponse(UserBase):
    """Schema for user response (no sensitive data)"""

    id: str  # Support both UUID and demo account string IDs
    roles: List[str]
    is_active: bool
    created_at: str  # ISO string format for demo accounts
