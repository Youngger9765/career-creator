"""Add roles field to users table

Revision ID: 026c6315bb69
Revises: 9aba4056ba34
Create Date: 2025-09-13 15:41:10.012036

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '026c6315bb69'
down_revision: Union[str, None] = '9aba4056ba34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add roles column to users table
    op.add_column('users', sa.Column('roles', sa.JSON(), nullable=False, server_default='["client"]'))
    
    # Update existing users to have default role
    op.execute("UPDATE users SET roles = '[\"client\"]' WHERE roles IS NULL")


def downgrade() -> None:
    # Remove roles column from users table
    op.drop_column('users', 'roles')
