"""Update rooms table structure

Revision ID: b72388955756
Revises: 026c6315bb69
Create Date: 2025-09-13 15:44:22.533459

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b72388955756'
down_revision: Union[str, None] = '026c6315bb69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old columns that are no longer needed
    op.drop_column('rooms', 'status')
    op.drop_column('rooms', 'expires_at')
    op.drop_column('rooms', 'updated_at')
    
    # Modify share_code length constraint
    op.alter_column('rooms', 'share_code', type_=sa.String(6))


def downgrade() -> None:
    # Add back the removed columns
    op.add_column('rooms', sa.Column('status', sa.String(20), nullable=False, server_default='active'))
    op.add_column('rooms', sa.Column('expires_at', sa.DateTime(), nullable=False))
    op.add_column('rooms', sa.Column('updated_at', sa.DateTime(), nullable=False))
    
    # Revert share_code length
    op.alter_column('rooms', 'share_code', type_=sa.String(20))
