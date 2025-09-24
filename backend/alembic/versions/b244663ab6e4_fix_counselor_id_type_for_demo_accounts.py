"""fix counselor_id type for demo accounts

Revision ID: b244663ab6e4
Revises: 4a5b6c7d8e9f
Create Date: 2025-09-25 03:58:45.001553

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b244663ab6e4"
down_revision: Union[str, None] = "4a5b6c7d8e9f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix counselor_id types for demo accounts

    # Drop foreign key constraints first
    op.drop_constraint(
        "counselor_client_relationships_counselor_id_fkey",
        "counselor_client_relationships",
        type_="foreignkey",
    )
    op.drop_constraint(
        "consultation_records_counselor_id_fkey",
        "consultation_records",
        type_="foreignkey",
    )

    # Change counselor_client_relationships.counselor_id from UUID to VARCHAR
    op.alter_column(
        "counselor_client_relationships",
        "counselor_id",
        existing_type=sa.UUID(),
        type_=sa.String(length=255),
        existing_nullable=False,
    )

    # Change consultation_records.counselor_id from UUID to VARCHAR
    op.alter_column(
        "consultation_records",
        "counselor_id",
        existing_type=sa.UUID(),
        type_=sa.String(length=255),
        existing_nullable=False,
    )

    # Note: We don't recreate foreign keys to users table since demo accounts are not in users table


def downgrade() -> None:
    # Reverse the changes
    # Revert consultation_records.counselor_id back to UUID
    op.alter_column(
        "consultation_records",
        "counselor_id",
        existing_type=sa.String(length=255),
        type_=sa.UUID(),
        existing_nullable=False,
    )

    # Revert counselor_client_relationships.counselor_id back to UUID
    op.alter_column(
        "counselor_client_relationships",
        "counselor_id",
        existing_type=sa.String(length=255),
        type_=sa.UUID(),
        existing_nullable=False,
    )
