"""audit_fixes

Revision ID: cc8f30160d05
Revises: prod_initial_schema
Create Date: 2026-04-30 19:26:39.295360

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc8f30160d05'
down_revision: Union[str, Sequence[str], None] = 'prod_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('asks', schema=None) as batch_op:
        batch_op.alter_column('title', existing_type=sa.String(), type_=sa.String(length=200), existing_nullable=False)
        batch_op.alter_column('description', existing_type=sa.String(), type_=sa.String(length=5000), existing_nullable=False)
        batch_op.alter_column('category', existing_type=sa.String(), type_=sa.String(length=50), existing_nullable=False)
        batch_op.alter_column('location', existing_type=sa.String(), type_=sa.String(length=120), existing_nullable=False)
        batch_op.alter_column('status', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=True)
        batch_op.add_column(sa.Column('payment_status', sa.String(length=32), server_default=sa.text("'unpaid'"), nullable=False))
        batch_op.add_column(sa.Column('payment_intent_id', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('payment_amount', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('payment_currency', sa.String(length=8), nullable=True))
        batch_op.add_column(sa.Column('paid_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_asks_payment_intent_id'), ['payment_intent_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_asks_payment_status'), ['payment_status'], unique=False)

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.alter_column('content', existing_type=sa.String(), type_=sa.String(length=2000), existing_nullable=False)

    with op.batch_alter_table('moderation_logs', schema=None) as batch_op:
        batch_op.alter_column('content_type', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=False)
        batch_op.alter_column('content_text', existing_type=sa.String(), type_=sa.String(length=5000), existing_nullable=False)
        batch_op.alter_column('flagged_reason', existing_type=sa.String(), type_=sa.String(length=1000), existing_nullable=False)
        batch_op.alter_column('platform', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=True)

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.alter_column('title', existing_type=sa.String(), type_=sa.String(length=200), existing_nullable=False)
        batch_op.alter_column('body', existing_type=sa.String(), type_=sa.String(length=2000), existing_nullable=False)
        batch_op.alter_column('type', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=False)

    with op.batch_alter_table('responses', schema=None) as batch_op:
        batch_op.alter_column('message', existing_type=sa.String(), type_=sa.String(length=2000), existing_nullable=False)

    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.alter_column('comment', existing_type=sa.String(), type_=sa.String(length=1000), existing_nullable=True)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('username', existing_type=sa.String(), type_=sa.String(length=50), existing_nullable=False)
        batch_op.alter_column('email', existing_type=sa.String(), type_=sa.String(length=254), existing_nullable=False)
        batch_op.alter_column('hashed_password', existing_type=sa.String(), type_=sa.String(length=255), existing_nullable=False)
        batch_op.alter_column('phone_number', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=True)
        batch_op.alter_column('location', existing_type=sa.String(), type_=sa.String(length=120), existing_nullable=True)
        batch_op.alter_column('avatar_url', existing_type=sa.String(), type_=sa.String(length=500), existing_nullable=True)
        batch_op.alter_column('bot_role', existing_type=sa.String(), type_=sa.String(length=32), existing_nullable=True)
        batch_op.alter_column('bot_prompt', existing_type=sa.String(), type_=sa.String(length=4000), existing_nullable=True)
        batch_op.alter_column('expo_push_token', existing_type=sa.String(), type_=sa.String(length=200), existing_nullable=True)
        batch_op.alter_column('pro_category', existing_type=sa.String(), type_=sa.String(length=50), existing_nullable=True)
        batch_op.alter_column('pro_bio', existing_type=sa.String(), type_=sa.String(length=500), existing_nullable=True)
        batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_is_deleted'), ['is_deleted'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_is_deleted'))
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('is_deleted')
        batch_op.alter_column('pro_bio', existing_type=sa.String(length=500), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('pro_category', existing_type=sa.String(length=50), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('expo_push_token', existing_type=sa.String(length=200), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('bot_prompt', existing_type=sa.String(length=4000), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('bot_role', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('avatar_url', existing_type=sa.String(length=500), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('location', existing_type=sa.String(length=120), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('phone_number', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('hashed_password', existing_type=sa.String(length=255), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('email', existing_type=sa.String(length=254), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('username', existing_type=sa.String(length=50), type_=sa.String(), existing_nullable=False)

    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.alter_column('comment', existing_type=sa.String(length=1000), type_=sa.String(), existing_nullable=True)

    with op.batch_alter_table('responses', schema=None) as batch_op:
        batch_op.alter_column('message', existing_type=sa.String(length=2000), type_=sa.String(), existing_nullable=False)

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.alter_column('type', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('body', existing_type=sa.String(length=2000), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('title', existing_type=sa.String(length=200), type_=sa.String(), existing_nullable=False)

    with op.batch_alter_table('moderation_logs', schema=None) as batch_op:
        batch_op.alter_column('platform', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('flagged_reason', existing_type=sa.String(length=1000), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('content_text', existing_type=sa.String(length=5000), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('content_type', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=False)

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.alter_column('content', existing_type=sa.String(length=2000), type_=sa.String(), existing_nullable=False)

    with op.batch_alter_table('asks', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_asks_payment_status'))
        batch_op.drop_index(batch_op.f('ix_asks_payment_intent_id'))
        batch_op.drop_column('paid_at')
        batch_op.drop_column('payment_currency')
        batch_op.drop_column('payment_amount')
        batch_op.drop_column('payment_intent_id')
        batch_op.drop_column('payment_status')
        batch_op.alter_column('status', existing_type=sa.String(length=32), type_=sa.String(), existing_nullable=True)
        batch_op.alter_column('location', existing_type=sa.String(length=120), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('category', existing_type=sa.String(length=50), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('description', existing_type=sa.String(length=5000), type_=sa.String(), existing_nullable=False)
        batch_op.alter_column('title', existing_type=sa.String(length=200), type_=sa.String(), existing_nullable=False)
