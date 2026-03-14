"""initial schema

Revision ID: 20260314_01
Revises:
Create Date: 2026-03-14
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260314_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    deal_status = sa.Enum('PENDING', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', name='dealstatus')
    deal_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('use_case', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    op.create_table(
        'negotiations',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('status', deal_status, nullable=True),
        sa.Column('scenario', sa.String(), nullable=True),
        sa.Column('strategy', sa.String(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('final_terms', sa.JSON(), nullable=True),
        sa.Column('transcript', sa.JSON(), nullable=True),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('blockchain_tx', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.create_index(op.f('ix_negotiations_id'), 'negotiations', ['id'], unique=False)
    op.create_index(op.f('ix_negotiations_session_id'), 'negotiations', ['session_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_negotiations_session_id'), table_name='negotiations')
    op.drop_index(op.f('ix_negotiations_id'), table_name='negotiations')
    op.drop_table('negotiations')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    deal_status = sa.Enum('PENDING', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', name='dealstatus')
    deal_status.drop(op.get_bind(), checkfirst=True)
