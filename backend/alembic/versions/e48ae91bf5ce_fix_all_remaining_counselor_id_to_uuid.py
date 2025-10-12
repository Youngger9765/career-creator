"""fix all remaining counselor_id to uuid

Revision ID: e48ae91bf5ce
Revises: aa2a3d5a9926
Create Date: 2025-10-12 15:34:06.312121

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e48ae91bf5ce"
down_revision: Union[str, None] = "aa2a3d5a9926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix rooms.counselor_id: VARCHAR → UUID
    op.execute("ALTER TABLE rooms ALTER COLUMN counselor_id DROP DEFAULT")
    op.execute(
        "ALTER TABLE rooms ALTER COLUMN counselor_id TYPE UUID USING counselor_id::uuid"
    )

    # Fix consultation_records.counselor_id: VARCHAR → UUID
    op.execute(
        "ALTER TABLE consultation_records ALTER COLUMN counselor_id DROP DEFAULT"
    )
    op.execute(
        "ALTER TABLE consultation_records ALTER COLUMN counselor_id TYPE UUID USING counselor_id::uuid"
    )


def downgrade() -> None:
    # Revert rooms.counselor_id: UUID → VARCHAR
    op.execute(
        "ALTER TABLE rooms ALTER COLUMN counselor_id TYPE VARCHAR USING counselor_id::text"
    )

    # Revert consultation_records.counselor_id: UUID → VARCHAR
    op.execute(
        "ALTER TABLE consultation_records ALTER COLUMN counselor_id TYPE VARCHAR USING counselor_id::text"
    )
