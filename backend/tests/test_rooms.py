"""
Test suite for Room API endpoints
Following TDD approach: Red -> Green -> Refactor
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.database import get_session
from app.main import app
from app.models.room import Room
from app.models.user import User
from tests.helpers import create_auth_headers

# Test database setup
# Session fixture removed - using PostgreSQL conftest.py fixture instead


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with dependency override"""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create test user (counselor)"""
    user = User(
        id=uuid4(),
        email="counselor@test.com",
        hashed_password="hashed_password_123",
        name="Test Counselor",
        roles=["counselor"],  # Add counselor role
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestCreateRoom:
    """Test Room creation endpoint"""

    def test_create_room_success(self, client: TestClient, test_user: User):
        """Test successful room creation"""
        room_data = {
            "name": "Career Guidance Session",
            "description": "Initial consultation session",
        }

        # This should fail initially (RED phase)
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(test_user),  # JWT authentication
        )

        assert response.status_code == 201
        data = response.json()

        assert data["name"] == room_data["name"]
        assert data["description"] == room_data["description"]
        assert data["counselor_id"] == str(test_user.id)
        assert "share_code" in data
        assert len(data["share_code"]) == 6
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    def test_create_room_without_description(self, client: TestClient, test_user: User):
        """Test room creation without optional description"""
        room_data = {"name": "Quick Session"}

        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(test_user)
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == room_data["name"]
        assert data["description"] is None

    def test_create_room_invalid_data(self, client: TestClient, test_user: User):
        """Test room creation with invalid data"""
        room_data = {"name": ""}  # Empty name should fail

        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(test_user)
        )

        assert response.status_code == 422  # Validation error

    def test_create_room_unauthorized(self, client: TestClient):
        """Test room creation without authentication"""
        room_data = {"name": "Unauthorized Room"}

        response = client.post("/api/rooms", json=room_data)

        assert response.status_code == 401  # Unauthorized


class TestGetRoom:
    """Test Room retrieval endpoints"""

    def test_get_room_by_id(
        self, client: TestClient, session: Session, test_user: User
    ):
        """Test getting room by ID"""
        # Create test room
        room = Room(
            id=uuid4(),
            name="Test Room",
            description="Test Description",
            counselor_id=test_user.id,  # Convert UUID to string
            share_code="ABC123",
            is_active=True,
        )
        session.add(room)
        session.commit()

        response = client.get(f"/api/rooms/{room.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(room.id)
        assert data["name"] == room.name

    def test_get_room_not_found(self, client: TestClient):
        """Test getting non-existent room"""
        fake_id = uuid4()
        response = client.get(f"/api/rooms/{fake_id}")

        assert response.status_code == 404

    def test_get_room_by_share_code(
        self, client: TestClient, session: Session, test_user: User
    ):
        """Test getting room by share code"""
        room = Room(
            id=uuid4(),
            name="Shared Room",
            counselor_id=test_user.id,  # Convert UUID to string
            share_code="XYZ789",
            is_active=True,
        )
        session.add(room)
        session.commit()

        response = client.get(f"/api/rooms/by-code/{room.share_code}")

        assert response.status_code == 200
        data = response.json()
        assert data["share_code"] == room.share_code
