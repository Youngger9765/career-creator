#!/usr/bin/env python3
"""
Seed script to create test data for development
"""

import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select  # noqa: E402

from app.core.database import engine  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.room import Room  # noqa: E402
from app.models.user import User  # noqa: E402


def create_test_users():
    """Create test users for development"""
    with Session(engine) as session:
        # Check if test user already exists
        existing_user = session.exec(
            select(User).where(User.email == "test@example.com")
        ).first()

        if existing_user:
            print("Test user already exists")
            return

        # Create test counselor
        test_user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            name="測試諮詢師",
            hashed_password=get_password_hash("password123"),
            roles=["counselor"],
            is_active=True,
            created_at=datetime.utcnow(),
        )

        session.add(test_user)

        # Create another test counselor
        test_user2 = User(
            id=uuid.uuid4(),
            email="counselor@example.com",
            name="王諮詢師",
            hashed_password=get_password_hash("test1234"),
            roles=["counselor"],
            is_active=True,
            created_at=datetime.utcnow(),
        )

        session.add(test_user2)

        # Create admin user
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@example.com",
            name="系統管理員",
            hashed_password=get_password_hash("admin123"),
            roles=["admin", "counselor"],
            is_active=True,
            created_at=datetime.utcnow(),
        )

        session.add(admin_user)

        session.commit()
        print("Test users created successfully:")
        print("- test@example.com / password123 (諮詢師)")
        print("- counselor@example.com / test1234 (諮詢師)")
        print("- admin@example.com / admin123 (管理員)")


def create_test_rooms():
    """Create test rooms for development"""
    with Session(engine) as session:
        # Get test user
        test_user = session.exec(
            select(User).where(User.email == "test@example.com")
        ).first()

        if not test_user:
            print("Test user not found, please run create_test_users first")
            return

        # Check if test room already exists
        existing_room = session.exec(
            select(Room).where(Room.name == "測試諮詢房間")
        ).first()

        if existing_room:
            print("Test room already exists")
            return

        # Create active test room
        test_room = Room(
            id=uuid.uuid4(),
            name="測試諮詢房間",
            description="這是一個測試用的諮詢房間",
            counselor_id=test_user.id,
            status="active",
            share_code="TEST123",
            expires_at=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
        )

        session.add(test_room)

        # Create expired test room
        expired_room = Room(
            id=uuid.uuid4(),
            name="已過期的房間",
            description="這個房間已經過期了",
            counselor_id=test_user.id,
            status="expired",
            share_code="EXPIRED1",
            expires_at=datetime.utcnow() - timedelta(days=1),
            created_at=datetime.utcnow() - timedelta(days=8),
        )

        session.add(expired_room)

        session.commit()
        print("\nTest rooms created successfully:")
        print("- 測試諮詢房間 (Share code: TEST123)")
        print("- 已過期的房間 (Share code: EXPIRED1)")


def main():
    """Run all seed functions"""
    print("Starting seed process...")

    create_test_users()
    create_test_rooms()

    print("\nSeed process completed!")
    print("\nYou can now login with:")
    print("Email: test@example.com")
    print("Password: password123")


if __name__ == "__main__":
    main()
