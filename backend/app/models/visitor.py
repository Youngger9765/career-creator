from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4


class VisitorBase(SQLModel):
    """Base visitor model"""
    nickname: str = Field(max_length=100)


class Visitor(VisitorBase, table=True):
    """Visitor table model"""
    __tablename__ = "visitors"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(foreign_key="rooms.id")
    joined_at: datetime = Field(default_factory=datetime.utcnow)


class VisitorCreate(VisitorBase):
    """Schema for creating visitor"""
    pass


class VisitorResponse(VisitorBase):
    """Schema for visitor response"""
    id: UUID
    room_id: UUID
    joined_at: datetime