"""
CardEvent model for tracking card operations in consultation sessions
卡牌事件模型 - 追蹤諮詢會話中的卡牌操作
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import Text
from sqlmodel import JSON, Column, Field, SQLModel


class CardEventType(str, Enum):
    """Types of card events"""

    CARD_DEALT = "card_dealt"  # 發牌
    CARD_FLIPPED = "card_flipped"  # 翻牌
    CARD_SELECTED = "card_selected"  # 選牌
    CARD_MOVED = "card_moved"  # 移動卡片
    CARD_ARRANGED = "card_arranged"  # 排列卡片
    CARD_DISCUSSED = "card_discussed"  # 討論卡片
    NOTES_ADDED = "notes_added"  # 添加筆記
    INSIGHT_RECORDED = "insight_recorded"  # 記錄洞察


class CardEventBase(SQLModel):
    """Base card event model"""

    room_id: UUID = Field(foreign_key="rooms.id")
    event_type: CardEventType
    card_id: Optional[str] = None  # Card identifier (could be position, name, etc.)
    event_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class CardEvent(CardEventBase, table=True):
    """CardEvent table model"""

    __tablename__ = "card_events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    performer_id: Optional[str] = None  # User ID or visitor session_id
    performer_type: str = Field(default="user")  # "user" or "visitor"
    performer_name: Optional[str] = None  # Display name for UI
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Deprecated, kept for backwards compatibility
    sequence_number: Optional[int] = Field(default=None)


class CardEventCreate(CardEventBase):
    """Schema for creating card event"""

    performer_id: Optional[str] = None
    performer_type: str = "user"
    performer_name: Optional[str] = None
    sequence_number: Optional[int] = None  # Deprecated field


class CardEventResponse(CardEventBase):
    """Schema for card event response"""

    id: UUID
    performer_id: Optional[str]
    performer_type: str
    performer_name: Optional[str]
    created_at: datetime
    sequence_number: int


class CardEventQuery(SQLModel):
    """Schema for querying card events"""

    room_id: Optional[UUID] = None
    event_type: Optional[CardEventType] = None
    performer_id: Optional[str] = None
    from_datetime: Optional[datetime] = None
    to_datetime: Optional[datetime] = None
    limit: Optional[int] = Field(default=100, le=1000)
    offset: Optional[int] = Field(default=0, ge=0)
