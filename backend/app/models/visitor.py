"""
Visitor model for anonymous users joining rooms
訪客模型 - 匿名用戶加入房間
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional


class VisitorBase(SQLModel):
    """Base visitor model"""
    name: str = Field(max_length=100)
    room_id: UUID = Field(foreign_key="rooms.id")


class Visitor(VisitorBase, table=True):
    """Visitor table model"""
    __tablename__ = "visitors"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: str = Field(max_length=255, unique=True)  # Frontend-generated session ID
    is_active: bool = Field(default=True)
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)


class VisitorCreate(VisitorBase):
    """Schema for creating visitor"""
    session_id: str = Field(max_length=255)


class VisitorResponse(VisitorBase):
    """Schema for visitor response"""
    id: UUID
    session_id: str
    is_active: bool
    joined_at: datetime
    last_seen: datetime


class VisitorUpdate(SQLModel):
    """Schema for updating visitor (e.g., heartbeat)"""
    last_seen: Optional[datetime] = Field(default_factory=datetime.utcnow)