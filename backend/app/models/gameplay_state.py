"""Gameplay state models for persisting game progress."""

from datetime import datetime
from typing import Any, Dict
from uuid import UUID, uuid4

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class GameplayStateBase(SQLModel):
    """Base gameplay state model."""

    gameplay_id: str = Field(max_length=100, description="Gameplay identifier")
    state: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB),
        description="Game state snapshot (JSONB)",
    )


class GameplayState(GameplayStateBase, table=True):
    """Gameplay state table model."""

    __tablename__ = "gameplay_states"
    __table_args__ = (
        UniqueConstraint("room_id", "gameplay_id", name="unique_room_gameplay"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(
        foreign_key="rooms.id",
        index=True,
        description="Associated room ID",
    )
    last_played_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
        description="Last time this gameplay was played",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp",
    )


class GameplayStateCreate(GameplayStateBase):
    """Schema for creating gameplay state."""

    room_id: UUID


class GameplayStateUpdate(SQLModel):
    """Schema for updating gameplay state."""

    state: Dict[str, Any]


class GameplayStateResponse(GameplayStateBase):
    """Schema for gameplay state response."""

    id: UUID
    room_id: UUID
    last_played_at: datetime
    created_at: datetime
    updated_at: datetime


class RoomGameplayStatesResponse(SQLModel):
    """Schema for room's all gameplay states."""

    states: list[GameplayStateResponse]
    summary: Dict[str, Any]
