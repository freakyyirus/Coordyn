"""
SQLAlchemy database models for negotiation history.
Uses SQLite for hackathon speed — swap DATABASE_URL to postgres for prod.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    JSON,
    Enum,
    create_engine,
    Boolean,
)
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class DealStatus(str, enum.Enum):
    PENDING = "pending"
    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    status = Column(Enum(DealStatus), default=DealStatus.PENDING)
    scenario = Column(String, default="Rush Delivery")
    strategy = Column(String, default="balanced")
    context = Column(JSON, default=dict)
    final_terms = Column(JSON, nullable=True)
    transcript = Column(JSON, default=list)
    metrics = Column(JSON, nullable=True)
    blockchain_tx = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    company = Column(String, nullable=True)
    use_case = Column(String, nullable=True)
    role = Column(String, default="user")  # "admin" or "user"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ── Engine & session (lazy-loaded) ────────────────────────────────────────────

_engine = None
_session_factory = None


def get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        from app.config import settings

        connect_args = {}
        pool_config = {}
        if "sqlite" in settings.DATABASE_URL:
            connect_args["check_same_thread"] = False
        elif "postgresql" in settings.DATABASE_URL:
            pool_config = {
                "pool_size": settings.DB_POOL_SIZE,
                "max_overflow": settings.DB_MAX_OVERFLOW,
                "pool_timeout": settings.DB_POOL_TIMEOUT,
                "pool_pre_ping": True,
            }

        _engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            **pool_config,
        )
    return _engine


def get_session_factory():
    """Get or create the session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            autocommit=False, autoflush=False, bind=get_engine()
        )
    return _session_factory


def init_db():
    Base.metadata.create_all(bind=get_engine())


def get_db():
    Session = get_session_factory()
    db = Session()
    try:
        yield db
    finally:
        db.close()


# For backwards compatibility - these are module-level attributes
class _LazyEngine:
    """Proxy to lazily return engine."""

    def __call__(self):
        return get_engine()


class _SessionLocalProxy:
    """Proxy to lazily return a new session instance."""

    def __call__(self):
        Session = get_session_factory()
        return Session()


engine = _LazyEngine()
SessionLocal = _SessionLocalProxy()
