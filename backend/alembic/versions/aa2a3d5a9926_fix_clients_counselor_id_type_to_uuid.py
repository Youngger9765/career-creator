"""fix clients counselor_id type to uuid

Revision ID: aa2a3d5a9926
Revises: e172d56da2b6
Create Date: 2025-10-12 15:30:26.348761

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa2a3d5a9926"
down_revision: Union[str, None] = "e172d56da2b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert clients.counselor_id from VARCHAR to UUID
    # Step 1: Drop default if exists
    op.execute("ALTER TABLE clients ALTER COLUMN counselor_id DROP DEFAULT")
    # Step 2: Convert type
    op.execute(
        "ALTER TABLE clients ALTER COLUMN counselor_id TYPE UUID USING counselor_id::uuid"
    )


def downgrade() -> None:
    # Revert clients.counselor_id from UUID to VARCHAR
    op.execute(
        "ALTER TABLE clients ALTER COLUMN counselor_id TYPE VARCHAR USING counselor_id::text"
    )
