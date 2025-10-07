import secrets
import string
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.client import ConsultationRecord, RoomClient
    from app.models.counselor_note import CounselorNote


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
    counselor_id: UUID = Field(
        foreign_key="users.id", index=True, description="Counselor who owns this room"
    )
    share_code: str = Field(
        default_factory=generate_share_code, unique=True, max_length=6
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(
        default=None, description="Room expiration date"
    )
    session_count: int = Field(
        default=0, description="Number of sessions held in this room"
    )

    # Relationships for CRM
    client_associations: List["RoomClient"] = Relationship(back_populates="room")
    consultation_records: List["ConsultationRecord"] = Relationship(
        back_populates="room"
    )
    counselor_note: Optional["CounselorNote"] = Relationship(back_populates="room")


class RoomCreate(RoomBase):
    """Schema for creating room"""

    game_rule_slug: Optional[str] = Field(
        default="skill_assessment", description="遊戲規則標識符"
    )
    client_id: Optional[UUID] = Field(default=None, description="Associated client ID")
    expires_at: Optional[datetime] = Field(
        default=None, description="Room expiration date"
    )


class RoomResponse(RoomBase):
    """Schema for room response"""

    id: UUID
    counselor_id: UUID
    share_code: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    session_count: int = 0
    client_name: Optional[str] = None  # Associated client name
    counselor_name: Optional[str] = None  # Associated counselor name
