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


class RelationshipType(str, Enum):
    """Counselor-client relationship types."""

    PRIMARY = "primary"  # 主責諮商師
    SECONDARY = "secondary"  # 協同諮商師
    CONSULTANT = "consultant"  # 顧問


class RelationshipStatus(str, Enum):
    """Relationship status."""

    ACTIVE = "active"
    PAUSED = "paused"
    TERMINATED = "terminated"


class ClientBase(SQLModel):
    """Base client model."""

    email: str = Field(
        index=True,
        unique=True,
        max_length=255,
        description="Client email (unique identifier)",
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
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    # Relationships
    counselor_relationships: List["CounselorClientRelationship"] = Relationship(
        back_populates="client"
    )
    room_associations: List["RoomClient"] = Relationship(back_populates="client")
    consultation_records: List["ConsultationRecord"] = Relationship(
        back_populates="client"
    )


class CounselorClientRelationship(SQLModel, table=True):
    """Many-to-many relationship between counselors and clients."""

    __tablename__ = "counselor_client_relationships"
    __table_args__ = (
        UniqueConstraint("counselor_id", "client_id", name="unique_counselor_client"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    counselor_id: str = Field(
        max_length=255, index=True, description="Counselor user ID (UUID or demo ID)"
    )
    client_id: UUID = Field(
        foreign_key="clients.id", index=True, description="Client ID"
    )
    relationship_type: RelationshipType = Field(
        default=RelationshipType.PRIMARY, description="Type of relationship"
    )
    status: RelationshipStatus = Field(
        default=RelationshipStatus.ACTIVE, description="Relationship status"
    )
    start_date: date = Field(
        default_factory=date.today, description="Relationship start date"
    )
    end_date: Optional[date] = Field(default=None, description="Relationship end date")
    notes: Optional[str] = Field(default=None, description="Relationship notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    # Note: counselor relationship removed as counselor_id can be demo account (not in users table)
    client: Client = Relationship(back_populates="counselor_relationships")


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
    counselor_id: str = Field(
        max_length=255, index=True, description="Counselor ID (UUID or demo ID)"
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
    # Note: counselor relationship removed as counselor_id can be demo account (not in users table)


# Request/Response models


class ClientCreate(SQLModel):
    """Model for creating a new client."""

    email: str = Field(max_length=255, description="Client email (required)")
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


class ClientResponse(ClientBase):
    """Client response model."""

    id: UUID
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


class CounselorClientRelationshipCreate(SQLModel):
    """Model for creating counselor-client relationship."""

    client_id: UUID
    relationship_type: RelationshipType = Field(default=RelationshipType.PRIMARY)
    notes: Optional[str] = Field(default=None)


class CounselorClientRelationshipResponse(SQLModel):
    """Counselor-client relationship response."""

    id: UUID
    counselor_id: str
    client_id: UUID
    relationship_type: RelationshipType
    status: RelationshipStatus
    start_date: date
    end_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    client: ClientResponse  # Include client details


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
    counselor_id: str
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
from app.models.user import User  # noqa: E402
