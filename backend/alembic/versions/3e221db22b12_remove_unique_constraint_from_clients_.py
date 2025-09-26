"""Remove unique constraint from clients email

Revision ID: 3e221db22b12
Revises: ad73d5183987
Create Date: 2025-09-26 09:33:40.974273

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3e221db22b12"
down_revision: Union[str, None] = "ad73d5183987"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the unique index on email if it exists
    # This allows multiple counselors to have clients with the same email
    op.execute("DROP INDEX IF EXISTS ix_clients_email")

    # Create a non-unique index for email queries if needed
    op.create_index("ix_clients_email_non_unique", "clients", ["email"], unique=False)


def downgrade() -> None:
    # Remove the non-unique index
    op.drop_index("ix_clients_email_non_unique", table_name="clients")

    # Recreate the unique index (though this might fail if there are duplicates)
    op.create_index("ix_clients_email", "clients", ["email"], unique=True)
