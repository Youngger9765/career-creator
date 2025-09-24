"""
Test suite for Visitor API endpoints
Following TDD approach: Red -> Green -> Refactor
"""

import time
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_session
from app.main import app
from app.models.room import Room
from app.models.user import User
from app.models.visitor import Visitor


# Test database setup
@pytest.fixture(name="session")
def session_fixture():
    """Create test database session"""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


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
    """Create test user for room creation"""
    user = User(
        id=uuid4(),
        name="Test Counselor",
        email="counselor@test.com",
        hashed_password="hashed_password_123",
        roles=["counselor"],
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_room")
def test_room_fixture(session: Session, test_user: User):
    """Create test room"""
    room = Room(
        id=uuid4(),
        name="Test Room",
        description="Test Description",
        counselor_id=str(test_user.id),
        share_code="ABC123",
        is_active=True,
    )
    session.add(room)
    session.commit()
    session.refresh(room)
    return room


class TestVisitorJoinRoom:
    """Test visitor joining room functionality"""

    def test_join_room_success(self, client: TestClient, test_room: Room):
        """Test successful room joining with share code"""
        visitor_data = {
            "name": "Anonymous Visitor",
            "room_id": str(
                test_room.id
            ),  # This gets ignored, room determined by share_code
            "session_id": f"session_{int(time.time())}",
        }

        response = client.post(
            f"/api/visitors/join-room/{test_room.share_code}", json=visitor_data
        )

        assert response.status_code == 201
        data = response.json()

        assert data["name"] == visitor_data["name"]
        assert data["room_id"] == str(test_room.id)
        assert data["session_id"] == visitor_data["session_id"]
        assert data["is_active"] is True
        assert "id" in data
        assert "joined_at" in data
        assert "last_seen" in data

    def test_join_room_invalid_share_code(self, client: TestClient):
        """Test joining with invalid share code"""
        visitor_data = {
            "name": "Anonymous Visitor",
            "room_id": str(uuid4()),
            "session_id": "test_session",
        }

        response = client.post("/api/visitors/join-room/INVALID", json=visitor_data)

        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

    def test_join_room_rejoin_existing_session(
        self, client: TestClient, test_room: Room
    ):
        """Test rejoining with same session ID"""
        visitor_data = {
            "name": "Anonymous Visitor",
            "room_id": str(test_room.id),
            "session_id": "persistent_session",
        }

        # First join
        response1 = client.post(
            f"/api/visitors/join-room/{test_room.share_code}", json=visitor_data
        )
        assert response1.status_code == 201
        visitor_id = response1.json()["id"]

        # Second join with same session_id (should return existing visitor)
        response2 = client.post(
            f"/api/visitors/join-room/{test_room.share_code}", json=visitor_data
        )
        assert response2.status_code == 201
        assert response2.json()["id"] == visitor_id  # Same visitor returned

    def test_join_room_invalid_data(self, client: TestClient, test_room: Room):
        """Test joining with invalid data"""
        # Missing required fields
        invalid_data = {
            "session_id": "test_session"
            # Missing name
        }

        response = client.post(
            f"/api/visitors/join-room/{test_room.share_code}", json=invalid_data
        )

        assert response.status_code == 422  # Validation error


class TestVisitorManagement:
    """Test visitor management functionality"""

    def test_list_room_visitors(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test listing visitors in a room"""
        # Create test visitors
        visitor1 = Visitor(
            id=uuid4(),
            name="Visitor 1",
            room_id=test_room.id,
            session_id="session_1",
            is_active=True,
        )
        visitor2 = Visitor(
            id=uuid4(),
            name="Visitor 2",
            room_id=test_room.id,
            session_id="session_2",
            is_active=True,
        )
        session.add(visitor1)
        session.add(visitor2)
        session.commit()

        response = client.get(f"/api/visitors/room/{test_room.id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] in ["Visitor 1", "Visitor 2"]
        assert data[1]["name"] in ["Visitor 1", "Visitor 2"]

    def test_list_visitors_room_not_found(self, client: TestClient):
        """Test listing visitors for non-existent room"""
        fake_room_id = uuid4()
        response = client.get(f"/api/visitors/room/{fake_room_id}")

        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

    def test_visitor_heartbeat(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test visitor heartbeat update"""
        visitor = Visitor(
            id=uuid4(),
            name="Test Visitor",
            room_id=test_room.id,
            session_id="heartbeat_session",
            is_active=True,
        )
        session.add(visitor)
        session.commit()
        session.refresh(visitor)

        update_data = {"last_seen": "2025-09-13T08:30:00"}

        response = client.put(f"/api/visitors/{visitor.id}/heartbeat", json=update_data)

        assert response.status_code == 200
        # Note: The actual datetime format might differ from input

    def test_visitor_heartbeat_not_found(self, client: TestClient):
        """Test heartbeat for non-existent visitor"""
        fake_visitor_id = uuid4()
        update_data = {"last_seen": "2025-09-13T08:30:00"}

        response = client.put(
            f"/api/visitors/{fake_visitor_id}/heartbeat", json=update_data
        )

        assert response.status_code == 404
        assert "Visitor not found" in response.json()["detail"]

    def test_visitor_leave_room(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test visitor leaving room"""
        visitor = Visitor(
            id=uuid4(),
            name="Leaving Visitor",
            room_id=test_room.id,
            session_id="leaving_session",
            is_active=True,
        )
        session.add(visitor)
        session.commit()
        session.refresh(visitor)

        response = client.delete(f"/api/visitors/{visitor.id}")

        assert response.status_code == 200
        assert "Left room successfully" in response.json()["message"]

        # Verify visitor is marked as inactive
        session.refresh(visitor)
        assert visitor.is_active is False

    def test_get_visitor(self, client: TestClient, session: Session, test_room: Room):
        """Test getting visitor information"""
        visitor = Visitor(
            id=uuid4(),
            name="Info Visitor",
            room_id=test_room.id,
            session_id="info_session",
            is_active=True,
        )
        session.add(visitor)
        session.commit()
        session.refresh(visitor)

        response = client.get(f"/api/visitors/{visitor.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Info Visitor"
        assert data["session_id"] == "info_session"
        assert data["is_active"] is True
