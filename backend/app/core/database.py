from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Create engine with connection pool sized for 50+ concurrent users
# Supabase transaction pooler (port 6543): supports 200+ connections
# Previous limit (15) was for session pooler (port 5432), now using transaction pooler
engine: Engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",  # Log SQL queries in dev
    pool_size=50,  # Base pool sized for 50 concurrent users
    max_overflow=25,  # Allow burst up to 75 total connections
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
