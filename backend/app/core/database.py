from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Create engine with connection pool sized for high concurrent visitors
# Supabase transaction pooler (port 6543): supports 200+ connections
# Optimized for 50+ concurrent visitor joins per room
engine: Engine = create_engine(
    settings.database_url,
    echo=settings.environment == "development",  # Log SQL queries in dev
    pool_size=50,  # Increased for high concurrent visitor joins
    max_overflow=50,  # Allow burst up to 100 total connections
    pool_timeout=10,  # Reduced timeout for faster failure detection
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
