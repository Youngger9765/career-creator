"""Change counselor_id to string to support demo accounts

Revision ID: d915a079a1fe
Revises: b72388955756
Create Date: 2025-09-13 16:05:31.705632

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd915a079a1fe'
down_revision: Union[str, None] = 'b72388955756'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change counselor_id from UUID to string to support demo account IDs
    op.alter_column('rooms', 'counselor_id', type_=sa.String(255))


def downgrade() -> None:
    # Revert counselor_id back to UUID
    op.alter_column('rooms', 'counselor_id', type_=sa.dialects.postgresql.UUID())
