"""Make sequence_number optional in CardEvent model

Revision ID: 002
Revises: 001
Create Date: 2025-09-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make sequence_number nullable and add index on created_at"""
    
    # Make sequence_number nullable
    op.alter_column('card_events', 'sequence_number',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    
    # Add composite index for efficient ordering
    op.create_index(
        'ix_card_events_room_created', 
        'card_events', 
        ['room_id', 'created_at', 'id'],
        unique=False
    )
    
    # Add index for created_at alone for general queries
    op.create_index(
        'ix_card_events_created_at',
        'card_events',
        ['created_at'],
        unique=False
    )


def downgrade() -> None:
    """Revert sequence_number to non-nullable"""
    
    # Drop indexes
    op.drop_index('ix_card_events_created_at', table_name='card_events')
    op.drop_index('ix_card_events_room_created', table_name='card_events')
    
    # Set default value for null sequence_numbers before making non-nullable
    op.execute("""
        UPDATE card_events 
        SET sequence_number = 0 
        WHERE sequence_number IS NULL
    """)
    
    # Make sequence_number non-nullable again
    op.alter_column('card_events', 'sequence_number',
                    existing_type=sa.INTEGER(),
                    nullable=False)