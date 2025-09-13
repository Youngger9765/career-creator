from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List


class UserBase(SQLModel):
    """Base user model with common fields"""
    email: str = Field(unique=True, index=True)
    name: str = Field(max_length=100)


class User(UserBase, table=True):
    """User table model"""
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    roles: List[str] = Field(default=["client"], sa_column=Column(JSON))  # ["counselor", "client", "observer", "admin"]
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def has_role(self, role: str) -> bool:
        """Check if user has specific role"""
        return role in self.roles
    
    def add_role(self, role: str) -> None:
        """Add role to user"""
        if role not in self.roles:
            self.roles = self.roles + [role]  # Create new list to trigger SQLAlchemy change tracking
    
    def remove_role(self, role: str) -> None:
        """Remove role from user"""
        if role in self.roles:
            self.roles = [r for r in self.roles if r != role]  # Create new list to trigger change tracking


class UserCreate(UserBase):
    """Schema for creating user"""
    password: str = Field(min_length=8)


class UserResponse(UserBase):
    """Schema for user response (no sensitive data)"""
    id: str  # Support both UUID and demo account string IDs
    roles: List[str]
    is_active: bool
    created_at: str  # ISO string format for demo accounts