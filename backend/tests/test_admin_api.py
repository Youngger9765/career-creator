"""
Tests for Admin API endpoints

Following TDD approach:
- Test admin authentication first
- Test batch user creation
- Test duplicate handling
- Test edge cases
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.main import app
from app.models.user import User
from app.core.auth import create_access_token
from app.core.database import engine, get_session


@pytest.fixture(scope="function")
def db_session():
    """
    Database session fixture with transaction rollback
    Each test runs in isolated transaction that gets rolled back
    This ensures tests don't pollute the database
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    # Clean up any existing test users before test runs
    test_emails = [
        "newuser1@example.com",
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
        "duplicate@example.com",
        "unique@example.com",
        "invalid-email",
        "roletest@example.com",
        "complex@example.com",
        "existing@example.com",
        "valid@example.com",
        "another@valid.com",
        "reset@example.com",
    ]
    for email in test_emails:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            session.delete(existing)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Test client fixture with database session override"""
    def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    test_client = TestClient(app)

    yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    """Generate admin JWT token using demo admin account"""
    from app.core.auth import DEMO_ACCOUNT_UUIDS
    return create_access_token(
        data={
            "sub": DEMO_ACCOUNT_UUIDS["demo.admin@example.com"],
            "email": "demo.admin@example.com",
            "roles": ["admin", "counselor"],
            "name": "Test Admin"
        }
    )


@pytest.fixture
def counselor_token():
    """Generate counselor (non-admin) JWT token using demo counselor account"""
    from app.core.auth import DEMO_ACCOUNT_UUIDS
    return create_access_token(
        data={
            "sub": DEMO_ACCOUNT_UUIDS["demo.counselor@example.com"],
            "email": "demo.counselor@example.com",
            "roles": ["counselor"],
            "name": "Test Counselor"
        }
    )


class TestAdminAuthentication:
    """Test admin-only access control"""

    def test_batch_create_requires_authentication(self, client):
        """RED: Test that batch create endpoint requires authentication"""
        response = client.post(
            "/api/admin/users/batch",
            json={"emails": ["test@example.com"], "on_duplicate": "skip"}
        )
        assert response.status_code == 401
        assert "detail" in response.json()

    def test_batch_create_requires_admin_role(self, client, counselor_token):
        """RED: Test that batch create endpoint requires admin role"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {counselor_token}"},
            json={"emails": ["test@example.com"], "on_duplicate": "skip"}
        )
        assert response.status_code == 403
        assert "admin" in response.json()["detail"].lower()

    def test_batch_create_allows_admin(self, client, admin_token):
        """RED: Test that admin can access batch create endpoint"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": ["newuser@example.com"], "on_duplicate": "skip"}
        )
        # Should succeed (200) or return validation error, but not 401/403
        assert response.status_code != 401
        assert response.status_code != 403


class TestBatchUserCreation:
    """Test batch user creation functionality"""

    def test_create_single_user(self, client, admin_token):
        """RED: Test creating a single user"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "emails": ["newuser1@example.com"],
                "on_duplicate": "skip"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert len(data["success"]) == 1
        assert data["success"][0]["email"] == "newuser1@example.com"
        assert "password" in data["success"][0]
        assert len(data["success"][0]["password"]) >= 12

    def test_create_multiple_users(self, client, admin_token):
        """RED: Test creating multiple users"""
        emails = [
            "user1@example.com",
            "user2@example.com",
            "user3@example.com"
        ]
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": emails, "on_duplicate": "skip"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["success"]) == 3
        # Check all passwords are different
        passwords = [user["password"] for user in data["success"]]
        assert len(set(passwords)) == 3

    def test_password_complexity(self, client, admin_token):
        """RED: Test generated passwords meet complexity requirements"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": ["complex@example.com"], "on_duplicate": "skip"}
        )
        password = response.json()["success"][0]["password"]

        # Check length
        assert len(password) >= 12

        # Check has uppercase
        assert any(c.isupper() for c in password)

        # Check has lowercase
        assert any(c.islower() for c in password)

        # Check has digit
        assert any(c.isdigit() for c in password)

        # Check has special char
        assert any(c in "!@#$%^&*" for c in password)


class TestDuplicateHandling:
    """Test duplicate email handling"""

    def test_deduplicate_within_input_list(self, client, admin_token):
        """RED: Test duplicates within input list are auto-deduplicated"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "emails": [
                    "duplicate@example.com",
                    "unique@example.com",
                    "duplicate@example.com"  # Same as first
                ],
                "on_duplicate": "skip"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should only create 2 users, not 3
        assert len(data["success"]) == 2

    def test_skip_existing_users(self, client, admin_token):
        """RED: Test existing users are skipped when on_duplicate='skip'"""
        # First, create a user
        email = "existing@example.com"
        client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [email], "on_duplicate": "skip"}
        )

        # Try to create same user again with skip
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [email], "on_duplicate": "skip"}
        )
        data = response.json()
        assert len(data["existing"]) == 1
        assert data["existing"][0]["email"] == email
        assert data["existing"][0]["action"] == "skipped"

    def test_reset_password_existing_users(self, client, admin_token):
        """Test existing users get new password when on_duplicate='reset_password'"""
        # First, create a user
        email = "reset@example.com"
        first_response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [email], "on_duplicate": "skip"}
        )
        first_password = first_response.json()["success"][0]["password"]

        # Reset password
        second_response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [email], "on_duplicate": "reset_password"}
        )
        data = second_response.json()
        assert len(data["existing"]) == 1
        assert data["existing"][0]["action"] == "password_reset"
        assert "password" in data["existing"][0]
        # Password should be different
        assert data["existing"][0]["password"] != first_password


class TestEdgeCases:
    """Test edge cases and validation"""

    def test_invalid_email_format(self, client, admin_token):
        """RED: Test invalid email formats are rejected"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "emails": ["valid@example.com", "invalid-email", "another@valid.com"],
                "on_duplicate": "skip",
            }
        )
        data = response.json()
        assert len(data["success"]) == 2
        assert len(data["failed"]) == 1
        assert data["failed"][0]["email"] == "invalid-email"
        assert "format" in data["failed"][0]["reason"].lower()

    def test_empty_email_list(self, client, admin_token):
        """RED: Test empty email list returns empty results"""
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [], "on_duplicate": "skip"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["success"]) == 0
        assert len(data["existing"]) == 0
        assert len(data["failed"]) == 0

    def test_users_created_with_counselor_role(self, client, admin_token):
        """RED: Test created users have counselor role by default"""
        email = "roletest@example.com"
        response = client.post(
            "/api/admin/users/batch",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"emails": [email], "on_duplicate": "skip"}
        )

        # Verify from API response
        assert response.status_code == 200
        data = response.json()
        assert len(data["success"]) == 1

        # Get user info to verify role
        from app.core.database import get_session
        session = next(get_session())
        user = session.exec(select(User).where(User.email == email)).first()
        assert user is not None
        assert "counselor" in user.roles
        session.close()
