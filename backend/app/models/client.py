"""Client management models for CRM system."""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import JSON, Column, Field, Relationship, SQLModel


class ClientStatus(str, Enum):
    """Client account status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class ClientBase(SQLModel):
    """Base client model."""

    email: Optional[str] = Field(
        default=None,
        index=True,
        max_length=255,
        description="Client email (optional for anonymous clients)",
    )
    name: Optional[str] = Field(
        default=None, max_length=100, description="Client full name"
    )
    phone: Optional[str] = Field(
        default=None, max_length=50, description="Contact phone number"
    )
    notes: Optional[str] = Field(
        default=None, description="Internal notes about the client"
    )
    tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON),
        description="Client tags for categorization",
    )
    status: ClientStatus = Field(
        default=ClientStatus.ACTIVE, description="Client account status"
    )


class Client(ClientBase, table=True):
    """Client database model."""

    __tablename__ = "clients"

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, description="Client unique ID"
    )

    # Simplified ownership model - each counselor has independent client records
    counselor_id: UUID = Field(
        foreign_key="users.id",
        index=True,
        description="Counselor who owns this client record",
    )

    # Email verification for customer portal access
    email_verified: bool = Field(
        default=False, description="Whether email has been verified"
    )
    verification_token: Optional[str] = Field(
        default=None, max_length=255, description="Email verification token"
    )
    verified_at: Optional[datetime] = Field(
        default=None, description="Email verification timestamp"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    # Relationships
    room_associations: List["RoomClient"] = Relationship(back_populates="client")
    consultation_records: List["ConsultationRecord"] = Relationship(
        back_populates="client"
    )


class RoomClient(SQLModel, table=True):
    """Association between rooms and clients."""

    __tablename__ = "room_clients"
    __table_args__ = (
        UniqueConstraint("room_id", "client_id", name="unique_room_client"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(foreign_key="rooms.id", index=True, description="Room ID")
    client_id: UUID = Field(
        foreign_key="clients.id", index=True, description="Client ID"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    room: "Room" = Relationship(back_populates="client_associations")
    client: Client = Relationship(back_populates="room_associations")


class ConsultationRecord(SQLModel, table=True):
    """Consultation session records."""

    __tablename__ = "consultation_records"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(
        foreign_key="rooms.id", index=True, description="Associated room ID"
    )
    client_id: UUID = Field(
        foreign_key="clients.id", index=True, description="Client ID"
    )
    counselor_id: UUID = Field(
        foreign_key="users.id", index=True, description="Counselor ID"
    )
    session_date: datetime = Field(description="Consultation session date and time")
    duration_minutes: Optional[int] = Field(
        default=None, description="Session duration in minutes"
    )
    topics: List[str] = Field(
        default_factory=list, sa_column=Column(JSON), description="Topics discussed"
    )
    notes: Optional[str] = Field(default=None, description="Session notes")
    follow_up_required: bool = Field(
        default=False, description="Whether follow-up is needed"
    )
    follow_up_date: Optional[date] = Field(
        default=None, description="Scheduled follow-up date"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    room: "Room" = Relationship(back_populates="consultation_records")
    client: Client = Relationship(back_populates="consultation_records")


# Request/Response models


class ClientCreate(SQLModel):
    """Model for creating a new client."""

    email: Optional[str] = Field(
        default=None, max_length=255, description="Client email (optional)"
    )
    name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None)
    tags: List[str] = Field(default_factory=list)


class ClientUpdate(SQLModel):
    """Model for updating client information."""

    name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None)
    tags: Optional[List[str]] = Field(default=None)
    status: Optional[ClientStatus] = Field(default=None)


class ClientEmailBind(SQLModel):
    """Model for binding email to anonymous client."""

    client_id: UUID = Field(description="Anonymous client ID to bind email to")
    email: str = Field(max_length=255, description="Email to bind")
    send_verification: bool = Field(default=True, description="Send verification email")


class ClientResponse(ClientBase):
    """Client response model."""

    id: UUID
    counselor_id: UUID
    email_verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    active_rooms_count: Optional[int] = Field(
        default=0, description="Number of active rooms"
    )
    total_consultations: Optional[int] = Field(
        default=0, description="Total consultation count"
    )
    last_consultation_date: Optional[datetime] = Field(
        default=None, description="Last consultation date"
    )
    rooms: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, description="Rooms associated with this client"
    )


class ConsultationRecordCreate(SQLModel):
    """Model for creating consultation record."""

    room_id: UUID
    client_id: UUID
    session_date: datetime
    duration_minutes: Optional[int] = Field(default=None)
    topics: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None)
    follow_up_required: bool = Field(default=False)
    follow_up_date: Optional[date] = Field(default=None)


class ConsultationRecordResponse(SQLModel):
    """Consultation record response."""

    id: UUID
    room_id: UUID
    client_id: UUID
    counselor_id: UUID
    session_date: datetime
    duration_minutes: Optional[int]
    topics: List[str]
    notes: Optional[str]
    follow_up_required: bool
    follow_up_date: Optional[date]
    created_at: datetime
    updated_at: datetime


# Import forward references
from app.models.room import Room  # noqa: E402
