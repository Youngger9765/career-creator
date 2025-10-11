"""add_screenshots_game_state_to_consultation_records

Revision ID: e172d56da2b6
Revises: 13770a4dde04
Create Date: 2025-10-11 22:46:23.404997

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e172d56da2b6'
down_revision: Union[str, None] = '13770a4dde04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add screenshots column (TEXT array for GCS URLs)
    op.add_column(
        'consultation_records',
        sa.Column('screenshots', postgresql.ARRAY(sa.TEXT()), nullable=False, server_default='{}')
    )

    # Add game_state column (JSON for game state snapshot)
    op.add_column(
        'consultation_records',
        sa.Column('game_state', postgresql.JSONB(), nullable=True)
    )

    # Add ai_summary column (TEXT for AI-generated summary)
    op.add_column(
        'consultation_records',
        sa.Column('ai_summary', sa.TEXT(), nullable=True)
    )


def downgrade() -> None:
    # Remove added columns in reverse order
    op.drop_column('consultation_records', 'ai_summary')
    op.drop_column('consultation_records', 'game_state')
    op.drop_column('consultation_records', 'screenshots')
