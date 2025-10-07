"""Counselor notes model for room consultations."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class CounselorNote(SQLModel, table=True):
    """Counselor's private notes for a consultation room."""

    __tablename__ = "counselor_notes"

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, description="Note unique ID"
    )
    room_id: UUID = Field(
        foreign_key="rooms.id",
        index=True,
        description="Associated room ID",
    )
    content: str = Field(default="", description="Note content (plain text)")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    # Relationships
    room: "Room" = Relationship(back_populates="counselor_note")


# Request/Response models


class CounselorNoteResponse(SQLModel):
    """Counselor note response."""

    id: UUID
    room_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime


class CounselorNoteUpdate(SQLModel):
    """Model for updating counselor note."""

    content: str = Field(description="Note content")


# Import forward references
from app.models.room import Room  # noqa: E402
