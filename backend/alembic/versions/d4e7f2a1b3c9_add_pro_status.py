"""add pro_status column to users

Revision ID: d4e7f2a1b3c9
Revises: 63937032660e
Create Date: 2026-05-04

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd4e7f2a1b3c9'
down_revision = 'c661bcccd07d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pro_status column — nullable, no default (NULL means not a pro applicant yet)
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(
            sa.Column('pro_status', sa.String(32), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('pro_status')
