#!/usr/bin/env python3
"""
Rehash all test user passwords with bcrypt 10 rounds
"""
import os

from sqlmodel import select

from app.core.auth import get_password_hash
from app.core.database import get_session
from app.models.user import User

os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql://localhost/test")


def rehash_test_users():
    """Rehash test.user* passwords"""
    with next(get_session()) as session:
        # Get all test users
        statement = select(User).where(User.email.like("test.user%@example.com"))
        users = session.exec(statement).all()

        print(f"Found {len(users)} test users")

        for user in users:
            # Rehash password with new bcrypt 10 rounds
            new_hash = get_password_hash("TestPassword123!")
            user.hashed_password = new_hash
            session.add(user)
            print(f"✅ Rehashed: {user.email}")

        session.commit()
        print(f"\n✅ All {len(users)} test users rehashed successfully")


if __name__ == "__main__":
    rehash_test_users()
