"""Add roles column to users table

Revision ID: 3f5f3d3df8f2
Revises: 22be22c070f8
Create Date: 2025-09-15 19:47:36.736370

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3f5f3d3df8f2'
down_revision: Union[str, None] = '22be22c070f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add roles column to users table
    op.add_column('users', sa.Column('roles', 
                                     postgresql.ARRAY(sa.String()), 
                                     nullable=False,
                                     server_default='{}'))
    
    # Update existing users with default roles
    op.execute("""
        UPDATE users 
        SET roles = ARRAY['client']::varchar[]
        WHERE roles IS NULL OR array_length(roles, 1) IS NULL
    """)


def downgrade() -> None:
    # Remove roles column
    op.drop_column('users', 'roles')