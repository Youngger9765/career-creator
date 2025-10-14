"""add_gameplay_states_table

Revision ID: 2dfe675e9df3
Revises: 056e7aaab4c4
Create Date: 2025-10-14 21:49:08.901455

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2dfe675e9df3"
down_revision: Union[str, None] = "056e7aaab4c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create gameplay_states table
    op.create_table(
        "gameplay_states",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gameplay_id", sa.String(length=100), nullable=False),
        sa.Column("state", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "last_played_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("room_id", "gameplay_id", name="unique_room_gameplay"),
    )

    # Create indexes
    op.create_index("ix_gameplay_states_room_id", "gameplay_states", ["room_id"])
    op.create_index(
        "ix_gameplay_states_gameplay_id", "gameplay_states", ["gameplay_id"]
    )
    op.create_index(
        "ix_gameplay_states_last_played_at", "gameplay_states", ["last_played_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_gameplay_states_last_played_at", table_name="gameplay_states")
    op.drop_index("ix_gameplay_states_gameplay_id", table_name="gameplay_states")
    op.drop_index("ix_gameplay_states_room_id", table_name="gameplay_states")
    op.drop_table("gameplay_states")
