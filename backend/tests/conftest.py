"""
Pytest configuration for tests
测试配置
"""

import os
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text

from app.core.config import settings


# Use PostgreSQL for testing instead of SQLite to support ARRAY types
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    str(settings.database_url).replace("/career_creator", "/career_creator_test"),
)


@pytest.fixture(name="engine", scope="session")
def engine_fixture():
    """Create test database engine (session scope)"""
    engine = create_engine(TEST_DATABASE_URL, echo=False)

    # Drop and recreate schema for clean test run
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))

    # Create all tables
    SQLModel.metadata.create_all(engine)

    yield engine

    # Cleanup after all tests
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))

    engine.dispose()


@pytest.fixture(name="session", scope="function")
def session_fixture(engine):
    """Create test database session (function scope - fresh for each test)"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    # Seed demo users for testing using the test session
    from app.core.auth import DEMO_ACCOUNTS, get_password_hash
    from app.models.user import User
    from uuid import UUID

    for demo_data in DEMO_ACCOUNTS:
        user_uuid = UUID(demo_data["id"])
        # Check if user already exists
        existing = session.get(User, user_uuid)
        if not existing:
            user = User(
                id=user_uuid,
                email=demo_data["email"],
                name=demo_data["name"],
                hashed_password=get_password_hash(demo_data["password"]),
                roles=demo_data["roles"],
                is_active=True,
            )
            session.add(user)

    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()
