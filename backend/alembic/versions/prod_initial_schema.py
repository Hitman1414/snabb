"""Production initial schema — creates all tables

Revision ID: prod_initial_schema
Revises: aa61191f036d
Create Date: 2026-04-28
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = 'prod_initial_schema'
down_revision: Union[str, Sequence[str], None] = 'aa61191f036d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── users ──────────────────────────────────────────────────────────────────
    if not _table_exists(conn, 'users'):
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('username', sa.String(), nullable=False, unique=True, index=True),
            sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('phone_number', sa.String(), nullable=True),
            sa.Column('location', sa.String(), nullable=True),
            sa.Column('avatar_url', sa.String(), nullable=True),
            sa.Column('is_bot', sa.Boolean(), default=False),
            sa.Column('bot_role', sa.String(), nullable=True),
            sa.Column('bot_prompt', sa.String(), nullable=True),
            sa.Column('expo_push_token', sa.String(), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True),
            sa.Column('is_admin', sa.Boolean(), default=False),
            sa.Column('is_pro', sa.Boolean(), default=False),
            sa.Column('pro_category', sa.String(), nullable=True),
            sa.Column('pro_bio', sa.String(), nullable=True),
            sa.Column('pro_verified', sa.Boolean(), default=False),
            sa.Column('pro_rating', sa.Float(), default=0.0),
            sa.Column('pro_completed_tasks', sa.Integer(), default=0),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )

    # ── asks ───────────────────────────────────────────────────────────────────
    if not _table_exists(conn, 'asks'):
        op.create_table(
            'asks',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('description', sa.String(), nullable=False),
            sa.Column('category', sa.String(), nullable=False, index=True),
            sa.Column('location', sa.String(), nullable=False, index=True),
            sa.Column('budget_min', sa.Float(), nullable=True),
            sa.Column('budget_max', sa.Float(), nullable=True),
            sa.Column('status', sa.String(), default='open', index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('server_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True, index=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
            sa.Column('images', sa.JSON(), nullable=True),
            sa.Column('latitude', sa.Float(), nullable=True),
            sa.Column('longitude', sa.Float(), nullable=True),
        )

    # ── responses ──────────────────────────────────────────────────────────────
    if not _table_exists(conn, 'responses'):
        op.create_table(
            'responses',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('ask_id', sa.Integer(), sa.ForeignKey('asks.id'), nullable=False, index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('message', sa.String(), nullable=False),
            sa.Column('bid_amount', sa.Float(), nullable=True),
            sa.Column('is_accepted', sa.Boolean(), default=False),
            sa.Column('is_interested', sa.Boolean(), default=False),
            sa.Column('unread_count', sa.Integer(), default=0),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )

    # ── reviews ────────────────────────────────────────────────────────────────
    if not _table_exists(conn, 'reviews'):
        op.create_table(
            'reviews',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('ask_id', sa.Integer(), sa.ForeignKey('asks.id'), nullable=False, index=True),
            sa.Column('reviewer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('reviewee_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('comment', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )

    # ── messages ───────────────────────────────────────────────────────────────
    if not _table_exists(conn, 'messages'):
        op.create_table(
            'messages',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('receiver_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('ask_id', sa.Integer(), sa.ForeignKey('asks.id'), nullable=True, index=True),
            sa.Column('content', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
            sa.Column('is_read', sa.Boolean(), default=False),
        )

    # ── notifications ──────────────────────────────────────────────────────────
    if not _table_exists(conn, 'notifications'):
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('body', sa.String(), nullable=False),
            sa.Column('type', sa.String(), nullable=False),
            sa.Column('data', sa.JSON(), nullable=True),
            sa.Column('is_read', sa.Boolean(), default=False),
            sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
        )

    # ── moderation_logs ────────────────────────────────────────────────────────
    if not _table_exists(conn, 'moderation_logs'):
        op.create_table(
            'moderation_logs',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('content_type', sa.String(), nullable=False),
            sa.Column('content_text', sa.String(), nullable=False),
            sa.Column('flagged_reason', sa.String(), nullable=False),
            sa.Column('platform', sa.String(), default='unknown'),
            sa.Column('created_at', sa.DateTime(), nullable=True, index=True),
        )


def downgrade() -> None:
    for table in ('moderation_logs', 'notifications', 'messages', 'reviews', 'responses', 'asks', 'users'):
        op.drop_table(table)


def _table_exists(conn, table_name: str) -> bool:
    return sa.inspect(conn).has_table(table_name)
