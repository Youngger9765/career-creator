"""
Integration tests - cross-endpoint functionality
整合測試 - 跨 endpoint 功能測試
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.database import get_session
from app.main import app
from app.models.user import User
from tests.helpers import create_auth_headers


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


@pytest.fixture(name="counselor")
def counselor_fixture(session: Session):
    """Create test counselor"""
    user = User(
        id=uuid4(),
        email="counselor@test.com",
        hashed_password="hashed_password_123",
        name="Test Counselor",
        roles=["counselor"],
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="client_user")
def client_user_fixture(session: Session):
    """Create test client user"""
    user = User(
        id=uuid4(),
        email="client@test.com",
        hashed_password="hashed_password_456",
        name="Test Client",
        roles=["client"],
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="observer")
def observer_fixture(session: Session):
    """Create test observer"""
    user = User(
        id=uuid4(),
        email="observer@test.com",
        hashed_password="hashed_password_789",
        name="Test Observer",
        roles=["observer"],
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestRoomWorkflow:
    """Test complete room workflow"""

    def test_room_creation_and_access_workflow(
        self, client: TestClient, counselor: User, client_user: User, observer: User
    ):
        """Test complete workflow: create room -> access by different users"""

        # 1. Counselor creates room
        room_data = {
            "name": "Integration Test Room",
            "description": "Testing complete workflow",
        }

        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(counselor)
        )

        assert response.status_code == 201
        room = response.json()
        room_id = room["id"]
        share_code = room["share_code"]

        # 2. Different users access the room

        # Counselor can access own room
        response = client.get(
            f"/api/rooms/{room_id}", headers=create_auth_headers(counselor)
        )
        assert response.status_code == 200
        assert response.json()["id"] == room_id

        # Client can access room by share code
        response = client.get(f"/api/rooms/by-code/{share_code}")
        assert response.status_code == 200
        assert response.json()["share_code"] == share_code

        # Observer can also access room by share code
        response = client.get(f"/api/rooms/by-code/{share_code}")
        assert response.status_code == 200

        # 3. Counselor can update room
        update_data = {
            "name": "Updated Room Name",
            "description": "Updated description",
        }

        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(counselor),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Room Name"

        # 4. Non-owner cannot update room
        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(client_user),
        )
        assert response.status_code == 403

        # 5. Counselor can list their rooms
        response = client.get("/api/rooms", headers=create_auth_headers(counselor))
        assert response.status_code == 200
        rooms = response.json()
        assert len(rooms) == 1
        assert rooms[0]["id"] == room_id

        # 6. Client user lists rooms (should be empty - they don't own any)
        response = client.get("/api/rooms", headers=create_auth_headers(client_user))
        assert response.status_code == 200
        assert len(response.json()) == 0


class TestPermissionMatrix:
    """Test permission matrix across different roles"""

    def test_role_based_room_permissions(
        self, client: TestClient, counselor: User, client_user: User, observer: User
    ):
        """Test room permissions for different user roles"""

        # Test room creation permissions
        room_data = {"name": "Permission Test Room"}

        # Counselor can create room
        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(counselor)
        )
        assert response.status_code == 201

        # Client user cannot create room
        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(client_user)
        )
        assert response.status_code == 403

        # Observer cannot create room
        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(observer)
        )
        assert response.status_code == 403

    def test_multi_role_user_permissions(self, client: TestClient, session: Session):
        """Test user with multiple roles"""

        # Create user with multiple roles
        multi_role_user = User(
            id=uuid4(),
            email="multi@test.com",
            hashed_password="password",
            name="Multi Role User",
            roles=["counselor", "client"],  # Both counselor and client
            is_active=True,
        )
        session.add(multi_role_user)
        session.commit()
        session.refresh(multi_role_user)

        # Should be able to create room (has counselor role)
        room_data = {"name": "Multi Role Test Room"}
        response = client.post(
            "/api/rooms", json=room_data, headers=create_auth_headers(multi_role_user)
        )
        assert response.status_code == 201


class TestErrorHandling:
    """Test error handling across endpoints"""

    def test_invalid_user_id_across_endpoints(self, client: TestClient):
        """Test invalid user ID handling across different endpoints"""
        from app.core.auth import create_access_token

        invalid_user_id = str(uuid4())  # Non-existent user

        # Create a token with invalid user ID
        token_data = {
            "sub": invalid_user_id,
            "email": "invalid@test.com",
            "roles": ["counselor"],
        }
        token = create_access_token(token_data)
        headers = {"Authorization": f"Bearer {token}"}

        # Test create room with invalid user
        response = client.post(
            "/api/rooms", json={"name": "Test Room"}, headers=headers
        )
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

        # Test list rooms with invalid user
        response = client.get("/api/rooms", headers=headers)
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_malformed_uuid_handling(self, client: TestClient):
        """Test malformed UUID handling"""

        # Invalid token format
        response = client.post(
            "/api/rooms",
            json={"name": "Test Room"},
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

        # Test room access with invalid UUID
        response = client.get("/api/rooms/invalid-uuid")
        assert response.status_code == 422  # FastAPI validation error
