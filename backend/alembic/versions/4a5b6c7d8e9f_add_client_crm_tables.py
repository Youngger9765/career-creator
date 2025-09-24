"""add client crm tables

Revision ID: 4a5b6c7d8e9f
Revises: 3f5f3d3df8f2
Create Date: 2025-09-25 03:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

from alembic import op  # type: ignore

# revision identifiers, used by Alembic.
revision: str = "4a5b6c7d8e9f"
down_revision: Union[str, None] = "3f5f3d3df8f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create clients table
    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_clients_email"), "clients", ["email"], unique=True)

    # Create counselor_client_relationships table
    op.create_table(
        "counselor_client_relationships",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("counselor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "relationship_type", sa.String(), nullable=False, server_default="primary"
        ),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counselor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "counselor_id", "client_id", name="unique_counselor_client"
        ),
    )
    op.create_index(
        op.f("ix_counselor_client_relationships_client_id"),
        "counselor_client_relationships",
        ["client_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_counselor_client_relationships_counselor_id"),
        "counselor_client_relationships",
        ["counselor_id"],
        unique=False,
    )

    # Create room_clients table
    op.create_table(
        "room_clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("room_id", "client_id", name="unique_room_client"),
    )
    op.create_index(
        op.f("ix_room_clients_client_id"), "room_clients", ["client_id"], unique=False
    )
    op.create_index(
        op.f("ix_room_clients_room_id"), "room_clients", ["room_id"], unique=False
    )

    # Create consultation_records table
    op.create_table(
        "consultation_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("counselor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_date", sa.DateTime(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("topics", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "follow_up_required", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counselor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_consultation_records_client_id"),
        "consultation_records",
        ["client_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_consultation_records_counselor_id"),
        "consultation_records",
        ["counselor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_consultation_records_room_id"),
        "consultation_records",
        ["room_id"],
        unique=False,
    )

    # Add new columns to rooms table
    op.add_column("rooms", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.add_column(
        "rooms",
        sa.Column("session_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    # Drop columns from rooms table
    op.drop_column("rooms", "session_count")
    op.drop_column("rooms", "expires_at")

    # Drop consultation_records table
    op.drop_index(
        op.f("ix_consultation_records_room_id"), table_name="consultation_records"
    )
    op.drop_index(
        op.f("ix_consultation_records_counselor_id"), table_name="consultation_records"
    )
    op.drop_index(
        op.f("ix_consultation_records_client_id"), table_name="consultation_records"
    )
    op.drop_table("consultation_records")

    # Drop room_clients table
    op.drop_index(op.f("ix_room_clients_room_id"), table_name="room_clients")
    op.drop_index(op.f("ix_room_clients_client_id"), table_name="room_clients")
    op.drop_table("room_clients")

    # Drop counselor_client_relationships table
    op.drop_index(
        op.f("ix_counselor_client_relationships_counselor_id"),
        table_name="counselor_client_relationships",
    )
    op.drop_index(
        op.f("ix_counselor_client_relationships_client_id"),
        table_name="counselor_client_relationships",
    )
    op.drop_table("counselor_client_relationships")

    # Drop clients table
    op.drop_index(op.f("ix_clients_email"), table_name="clients")
    op.drop_table("clients")
