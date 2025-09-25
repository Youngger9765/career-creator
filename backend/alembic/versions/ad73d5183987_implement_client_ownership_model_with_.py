"""implement client ownership model with simplified design

Revision ID: ad73d5183987
Revises: b244663ab6e4
Create Date: 2025-09-25 16:17:41.475113

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ad73d5183987"
down_revision: Union[str, None] = "b244663ab6e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add counselor_id directly to clients table (removing need for relationship table)
    op.add_column(
        "clients",
        sa.Column("counselor_id", sa.String(), nullable=False, server_default=""),
    )

    # 2. Add email verification fields
    op.add_column(
        "clients",
        sa.Column(
            "email_verified", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "clients", sa.Column("verification_token", sa.String(), nullable=True)
    )
    op.add_column("clients", sa.Column("verified_at", sa.DateTime(), nullable=True))

    # 3. Make email optional (can be added later)
    op.alter_column("clients", "email", existing_type=sa.VARCHAR(), nullable=True)

    # 4. Create indexes for better query performance
    op.create_index("ix_clients_counselor_id", "clients", ["counselor_id"])
    op.create_index("ix_clients_counselor_email", "clients", ["counselor_id", "email"])

    # 5. Drop the counselor_client_relationships table if it exists
    op.execute("DROP TABLE IF EXISTS counselor_client_relationships CASCADE")

    # 6. Clean up unused game tables if they exist
    op.execute("DROP TABLE IF EXISTS action_records CASCADE")
    op.execute("DROP TABLE IF EXISTS game_sessions CASCADE")

    # 7. Drop unused columns from rooms if they exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("rooms")]

    if "game_play" in columns:
        op.drop_column("rooms", "game_play")
    if "game_mode" in columns:
        op.drop_column("rooms", "game_mode")


def downgrade() -> None:
    # Recreate counselor_client_relationships table
    op.create_table(
        "counselor_client_relationships",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("counselor_id", sa.String(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("relationship_type", sa.VARCHAR(), nullable=False),
        sa.Column("status", sa.VARCHAR(), nullable=False),
        sa.Column("start_date", sa.DATE(), nullable=False),
        sa.Column("end_date", sa.DATE(), nullable=True),
        sa.Column("notes", sa.TEXT(), nullable=True),
        sa.Column("temp_name", sa.VARCHAR(), nullable=True),
        sa.Column("temp_phone", sa.VARCHAR(), nullable=True),
        sa.Column("counselor_notes", sa.TEXT(), nullable=True),
        sa.Column("first_contact_date", sa.TIMESTAMP(), nullable=True),
        sa.Column("last_contact_date", sa.TIMESTAMP(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Remove new columns and indexes
    op.execute("DROP INDEX IF EXISTS ix_clients_counselor_email")
    op.execute("DROP INDEX IF EXISTS ix_clients_counselor_id")

    op.drop_column("clients", "verified_at")
    op.drop_column("clients", "verification_token")
    op.drop_column("clients", "email_verified")
    op.drop_column("clients", "counselor_id")

    # Make email required again
    op.alter_column("clients", "email", existing_type=sa.VARCHAR(), nullable=False)

    # Add back unique constraint
    op.create_unique_constraint("uq_clients_email", "clients", ["email"])
