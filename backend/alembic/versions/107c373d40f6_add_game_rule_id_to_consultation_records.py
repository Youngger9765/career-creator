"""add_game_rule_id_to_consultation_records

Revision ID: 107c373d40f6
Revises: e48ae91bf5ce
Create Date: 2025-10-13 08:59:45.123456

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "107c373d40f6"
down_revision: Union[str, None] = "e48ae91bf5ce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add game_rule_id column to consultation_records (if not exists)
    # Use IF NOT EXISTS to handle cases where column might already exist
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'consultation_records'
                AND column_name = 'game_rule_id'
            ) THEN
                ALTER TABLE consultation_records
                ADD COLUMN game_rule_id UUID;
            END IF;
        END $$;
    """
    )

    # Add foreign key constraint (if not exists)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_consultation_records_game_rule_id'
            ) THEN
                ALTER TABLE consultation_records
                ADD CONSTRAINT fk_consultation_records_game_rule_id
                FOREIGN KEY (game_rule_id) REFERENCES game_rule_templates(id);
            END IF;
        END $$;
    """
    )

    # Create index (if not exists)
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_consultation_records_game_rule_id
        ON consultation_records(game_rule_id);
    """
    )


def downgrade() -> None:
    # Drop index
    op.drop_index(
        "ix_consultation_records_game_rule_id", "consultation_records", if_exists=True
    )

    # Drop foreign key constraint
    op.execute(
        """
        ALTER TABLE consultation_records
        DROP CONSTRAINT IF EXISTS fk_consultation_records_game_rule_id;
    """
    )

    # Drop column
    op.drop_column("consultation_records", "game_rule_id", if_exists=True)
