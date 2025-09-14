import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def generate_share_code() -> str:
    """Generate 6-character random share code"""
    return "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
    )


class RoomBase(SQLModel):
    """Base room model"""

    name: str = Field(min_length=1, max_length=200)  # 至少要有 1 個字元
    description: Optional[str] = Field(default=None, max_length=500)
    # 遊戲規則相關欄位
    game_rule_id: Optional[UUID] = Field(
        default=None, foreign_key="game_rule_templates.id", description="遊戲規則"
    )
    card_deck_id: Optional[UUID] = Field(
        default=None, foreign_key="card_decks.id", description="牌組"
    )


class Room(RoomBase, table=True):
    """Room table model"""

    __tablename__ = "rooms"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    counselor_id: str = Field(max_length=255)  # Support both UUID and demo account IDs
    share_code: str = Field(
        default_factory=generate_share_code, unique=True, max_length=6
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RoomCreate(RoomBase):
    """Schema for creating room"""

    game_rule_slug: Optional[str] = Field(
        default="skill_assessment", description="遊戲規則標識符"
    )


class RoomResponse(RoomBase):
    """Schema for room response"""

    id: UUID
    counselor_id: str  # Support both UUID and demo account IDs
    share_code: str
    is_active: bool
    created_at: datetime
