"""Add game sessions and action records tables

Revision ID: 22be22c070f8
Revises: fa38dbf3ca11
Create Date: 2025-09-14

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "22be22c070f8"
down_revision: Union[str, None] = "fa38dbf3ca11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create game_sessions table
    op.create_table(
        "game_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("room_id", sa.UUID(), nullable=False),
        sa.Column("game_rule_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("game_state", sa.JSON(), nullable=False),
        sa.Column("counselor_id", sa.String(), nullable=False),
        sa.Column("visitor_ids", sa.JSON(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["game_rule_id"],
            ["game_rule_templates.id"],
        ),
        sa.ForeignKeyConstraint(
            ["room_id"],
            ["rooms.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_game_sessions_counselor_id"),
        "game_sessions",
        ["counselor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_sessions_room_id"), "game_sessions", ["room_id"], unique=False
    )

    # Create game_action_records table
    op.create_table(
        "game_action_records",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("action_data", sa.JSON(), nullable=False),
        sa.Column("player_id", sa.String(), nullable=False),
        sa.Column("player_role", sa.String(), nullable=False),
        sa.Column("state_before", sa.JSON(), nullable=True),
        sa.Column("state_after", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["game_sessions.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_game_action_records_action_type"),
        "game_action_records",
        ["action_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_action_records_player_id"),
        "game_action_records",
        ["player_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_action_records_session_id"),
        "game_action_records",
        ["session_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop game_action_records table
    op.drop_index(
        op.f("ix_game_action_records_session_id"), table_name="game_action_records"
    )
    op.drop_index(
        op.f("ix_game_action_records_player_id"), table_name="game_action_records"
    )
    op.drop_index(
        op.f("ix_game_action_records_action_type"), table_name="game_action_records"
    )
    op.drop_table("game_action_records")

    # Drop game_sessions table
    op.drop_index(op.f("ix_game_sessions_room_id"), table_name="game_sessions")
    op.drop_index(op.f("ix_game_sessions_counselor_id"), table_name="game_sessions")
    op.drop_table("game_sessions")
