"""
Test room deletion functionality
測試諮詢室刪除功能
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


def create_test_user(session: Session, email: str, roles: list) -> User:
    """Create test user helper"""
    from app.core.auth import get_password_hash

    user = User(
        id=uuid4(),
        email=email,
        name=f"Test User ({email})",
        hashed_password=get_password_hash("test123"),
        roles=roles,  # PostgreSQL supports ARRAY directly
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestRoomDeletion:
    """諮詢室刪除功能測試"""

    def test_delete_room_soft_delete(self, session: Session, client: TestClient):
        """測試諮詢室軟刪除功能"""
        # Create test user and room
        user = create_test_user(session, "counselor@test.com", ["counselor"])

        # Create room
        room_data = {"name": "Test Room", "description": "Test description"}

        response = client.post(
            "/api/rooms/", json=room_data, headers=create_auth_headers(user)
        )
        assert response.status_code == 201
        room_id = response.json()["id"]

        # Verify room exists and is active
        room = session.get(Room, room_id)
        assert room is not None
        assert room.is_active is True

        # Delete room
        response = client.delete(
            f"/api/rooms/{room_id}", headers=create_auth_headers(user)
        )
        assert response.status_code == 200

        # Verify room is soft deleted (still exists but inactive)
        session.refresh(room)
        assert room is not None  # Room still exists in DB
        assert room.is_active is False  # But marked as inactive

    def test_list_rooms_excludes_deleted(self, session: Session, client: TestClient):
        """測試諮詢室列表不包含已刪除的諮詢室"""
        # Create test user
        user = create_test_user(session, "counselor@test.com", ["counselor"])

        # Create two rooms
        room_data_1 = {"name": "Active Room", "description": "Active"}
        room_data_2 = {"name": "To Delete Room", "description": "Will be deleted"}

        # Create first room
        response = client.post(
            "/api/rooms/", json=room_data_1, headers=create_auth_headers(user)
        )
        assert response.status_code == 201
        active_room_id = response.json()["id"]

        # Create second room
        response = client.post(
            "/api/rooms/", json=room_data_2, headers=create_auth_headers(user)
        )
        assert response.status_code == 201
        to_delete_room_id = response.json()["id"]

        # List rooms - should see both
        response = client.get("/api/rooms/", headers=create_auth_headers(user))
        assert response.status_code == 200
        rooms = response.json()
        assert len(rooms) == 2

        # Delete second room
        response = client.delete(
            f"/api/rooms/{to_delete_room_id}", headers=create_auth_headers(user)
        )
        assert response.status_code == 200

        # List rooms again - should only see active room
        response = client.get("/api/rooms/", headers=create_auth_headers(user))
        assert response.status_code == 200
        rooms = response.json()
        assert len(rooms) == 1
        assert rooms[0]["id"] == active_room_id
        assert rooms[0]["name"] == "Active Room"

        # Verify deleted room is not in the list
        room_ids = [room["id"] for room in rooms]
        assert to_delete_room_id not in room_ids

    def test_delete_nonexistent_room(self, session: Session, client: TestClient):
        """測試刪除不存在的諮詢室"""
        user = create_test_user(session, "counselor@test.com", ["counselor"])

        # Try to delete non-existent room
        fake_room_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(
            f"/api/rooms/{fake_room_id}", headers=create_auth_headers(user)
        )
        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

    def test_delete_other_user_room_unauthorized(
        self, session: Session, client: TestClient
    ):
        """測試刪除其他用戶的諮詢室（應該被拒絕）"""
        # Create two users
        user1 = create_test_user(session, "counselor1@test.com", ["counselor"])
        user2 = create_test_user(session, "counselor2@test.com", ["counselor"])

        # User1 creates room
        room_data = {"name": "User1 Room", "description": "Owned by user1"}
        response = client.post(
            "/api/rooms/", json=room_data, headers=create_auth_headers(user1)
        )
        assert response.status_code == 201
        room_id = response.json()["id"]

        # User2 tries to delete user1's room
        response = client.delete(
            f"/api/rooms/{room_id}", headers=create_auth_headers(user2)
        )
        assert response.status_code == 403
        assert "Only room owner or admin can delete room" in response.json()["detail"]

        # Verify room is still active
        room = session.get(Room, room_id)
        assert room.is_active is True
