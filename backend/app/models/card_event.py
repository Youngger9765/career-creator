from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from datetime import datetime
from uuid import UUID, uuid4
from typing import Dict, Any


class CardEventBase(SQLModel):
    """Base card event model"""
    event_type: str = Field(max_length=50)  # flip, move, drop, annotate
    card_id: str = Field(max_length=50)


class CardEvent(CardEventBase, table=True):
    """Card event table model (Event Sourcing)"""
    __tablename__ = "card_events"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(foreign_key="rooms.id")
    user_id: UUID  # Could be counselor or visitor
    user_type: str = Field(max_length=20)  # counselor, visitor
    payload: Dict[str, Any] = Field(sa_column=Column(JSON))  # Event data
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CardEventCreate(CardEventBase):
    """Schema for creating card event"""
    user_type: str
    payload: Dict[str, Any]


class CardEventResponse(CardEventBase):
    """Schema for card event response"""
    id: UUID
    room_id: UUID
    user_id: UUID
    user_type: str
    payload: Dict[str, Any]
    created_at: datetime