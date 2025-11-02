from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Create engine with connection pool sized for Supabase pooler limits
# Supabase session pooler: max 15 connections in session mode
engine: Engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",  # Log SQL queries in dev
    pool_size=10,  # Base pool (was 20, reduced for Supabase limits)
    max_overflow=5,  # Allow burst up to 15 total (was 30)
    pool_timeout=30,  # Wait up to 30s for a connection
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True,  # Verify connections before using
)


def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for getting database session"""
    with Session(engine) as session:
        yield session
