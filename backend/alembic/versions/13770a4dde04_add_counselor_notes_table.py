"""add counselor notes table

Revision ID: 13770a4dde04
Revises: 2b809c8b2d6f
Create Date: 2025-10-07 01:45:49.825393

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "13770a4dde04"
down_revision: Union[str, None] = "2b809c8b2d6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create counselor_notes table
    op.create_table(
        "counselor_notes",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True
        ),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")
        ),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    # Create index on room_id
    op.create_index("ix_counselor_notes_room_id", "counselor_notes", ["room_id"])

    # Drop card_events table (was disabled)
    op.drop_table("card_events")


def downgrade() -> None:
    # Recreate card_events table
    op.create_table(
        "card_events",
        sa.Column("room_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column(
            "event_type",
            postgresql.ENUM(
                "CARD_DEALT",
                "CARD_FLIPPED",
                "CARD_SELECTED",
                "CARD_MOVED",
                "CARD_ARRANGED",
                "CARD_DISCUSSED",
                "NOTES_ADDED",
                "INSIGHT_RECORDED",
                name="cardeventtype",
            ),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("card_id", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column(
            "event_data",
            postgresql.JSON(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column("notes", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("performer_id", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("performer_type", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("performer_name", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column(
            "created_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=False
        ),
        sa.Column("sequence_number", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ["room_id"], ["rooms.id"], name="card_events_room_id_fkey"
        ),
        sa.PrimaryKeyConstraint("id", name="card_events_pkey"),
    )

    # Drop counselor_notes table
    op.drop_index("ix_counselor_notes_room_id", "counselor_notes")
    op.drop_table("counselor_notes")
