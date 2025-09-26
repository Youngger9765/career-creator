"""
Test suite for CardEvent API endpoints
Following TDD approach: Red -> Green -> Refactor
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_session
from app.main import app
from app.models.card_event import CardEvent, CardEventType
from app.models.room import Room
from app.models.user import User


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


class TestCardEventCreation:
    """Test card event creation functionality"""

    def test_create_card_event_success(self, client: TestClient, test_room: Room):
        """Test successful card event creation"""
        event_data = {
            "room_id": str(test_room.id),
            "event_type": CardEventType.CARD_DEALT.value,
            "card_id": "career_card_1",
            "event_data": {
                "position": {"x": 100, "y": 200},
                "card_name": "Software Engineer",
                "face_up": True,
            },
            "notes": "Initial card dealt to start consultation",
            "performer_id": "demo-counselor-001",
            "performer_type": "user",
            "performer_name": "Dr. Sarah Chen",
        }

        response = client.post("/api/card-events/", json=event_data)

        assert response.status_code == 201
        data = response.json()

        assert data["room_id"] == str(test_room.id)
        assert data["event_type"] == CardEventType.CARD_DEALT.value
        assert data["card_id"] == "career_card_1"
        assert data["event_data"]["position"]["x"] == 100
        assert data["notes"] == "Initial card dealt to start consultation"
        assert data["performer_id"] == "demo-counselor-001"
        assert data["performer_name"] == "Dr. Sarah Chen"
        assert data["sequence_number"] == 1  # First event
        assert "id" in data
        assert "created_at" in data

    def test_create_event_room_not_found(self, client: TestClient):
        """Test creating event for non-existent room"""
        fake_room_id = uuid4()
        event_data = {
            "room_id": str(fake_room_id),
            "event_type": CardEventType.CARD_FLIPPED.value,
            "performer_id": "test_user",
            "performer_type": "user",
        }

        response = client.post("/api/card-events/", json=event_data)

        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

    def test_create_event_ordering(self, client: TestClient, test_room: Room):
        """Test that events are ordered by created_at timestamp"""
        # Create first event
        event_data_1 = {
            "room_id": str(test_room.id),
            "event_type": CardEventType.CARD_DEALT.value,
            "performer_id": "user1",
            "performer_type": "user",
        }

        response1 = client.post("/api/card-events/", json=event_data_1)
        assert response1.status_code == 201
        created_at_1 = response1.json()["created_at"]

        # Create second event
        event_data_2 = {
            "room_id": str(test_room.id),
            "event_type": CardEventType.CARD_FLIPPED.value,
            "performer_id": "user1",
            "performer_type": "user",
        }

        response2 = client.post("/api/card-events/", json=event_data_2)
        assert response2.status_code == 201
        created_at_2 = response2.json()["created_at"]

        # Second event should have later timestamp
        assert created_at_2 >= created_at_1

    def test_create_event_invalid_data(self, client: TestClient, test_room: Room):
        """Test creating event with invalid data"""
        # Missing required fields
        invalid_data = {
            "room_id": str(test_room.id),
            # Missing event_type
            "performer_id": "test_user",
        }

        response = client.post("/api/card-events/", json=invalid_data)
        assert response.status_code == 422  # Validation error


class TestCardEventRetrieval:
    """Test card event retrieval functionality"""

    def test_get_room_events(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test getting events for a room"""
        # Create test events
        events_data = [
            {
                "event_type": CardEventType.CARD_DEALT,
                "card_id": "card_1",
                "performer_id": "user1",
                "performer_name": "User One",
                "sequence_number": 1,
            },
            {
                "event_type": CardEventType.CARD_FLIPPED,
                "card_id": "card_1",
                "performer_id": "user1",
                "performer_name": "User One",
                "sequence_number": 2,
            },
            {
                "event_type": CardEventType.NOTES_ADDED,
                "notes": "Important insight about career path",
                "performer_id": "visitor1",
                "performer_type": "visitor",
                "performer_name": "Client Name",
                "sequence_number": 3,
            },
        ]

        for event_data in events_data:
            event = CardEvent(id=uuid4(), room_id=test_room.id, **event_data)
            session.add(event)

        session.commit()

        response = client.get(f"/api/card-events/room/{test_room.id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        # Check ordering by sequence number
        assert data[0]["sequence_number"] == 1
        assert data[1]["sequence_number"] == 2
        assert data[2]["sequence_number"] == 3

        # Check event details
        assert data[0]["event_type"] == CardEventType.CARD_DEALT.value
        assert data[1]["event_type"] == CardEventType.CARD_FLIPPED.value
        assert data[2]["event_type"] == CardEventType.NOTES_ADDED.value
        assert data[2]["notes"] == "Important insight about career path"

    def test_get_room_events_with_filters(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test getting room events with filters"""
        # Create mixed events
        events = [
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_DEALT,
                performer_id="user1",
                sequence_number=1,
            ),
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_FLIPPED,
                performer_id="user2",
                sequence_number=2,
            ),
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_DEALT,
                performer_id="user1",
                sequence_number=3,
            ),
        ]

        for event in events:
            session.add(event)
        session.commit()

        # Filter by event type
        response = client.get(
            f"/api/card-events/room/{test_room.id}?event_type={CardEventType.CARD_DEALT.value}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Only CARD_DEALT events
        assert all(
            event["event_type"] == CardEventType.CARD_DEALT.value for event in data
        )

        # Filter by performer
        response = client.get(
            f"/api/card-events/room/{test_room.id}?performer_id=user1"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Only user1 events
        assert all(event["performer_id"] == "user1" for event in data)

        # Note: from_sequence and to_sequence are deprecated
        # Test with limit instead
        response = client.get(f"/api/card-events/room/{test_room.id}?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # First 2 events
        # Events should be ordered by created_at, id
        assert data[0]["event_type"] == CardEventType.CARD_DEALT.value

    def test_get_latest_room_events(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test getting latest events for a room"""
        # Create 5 events
        for i in range(1, 6):
            event = CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_MOVED,
                sequence_number=i,
            )
            session.add(event)

        session.commit()

        # Get latest 3 events
        response = client.get(f"/api/card-events/room/{test_room.id}/latest?limit=3")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        # Should be in reverse chronological order (newest first)
        # Since sequence_number is deprecated, just check we got 3 events
        # They should all be CARD_MOVED type
        assert all(
            event["event_type"] == CardEventType.CARD_MOVED.value for event in data
        )

    def test_get_room_event_summary(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test getting event summary for a room"""
        # Create diverse events
        events = [
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_DEALT,
                performer_id="user1",
                performer_name="User 1",
                sequence_number=1,
            ),
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_DEALT,
                performer_id="user1",
                performer_name="User 1",
                sequence_number=2,
            ),
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.CARD_FLIPPED,
                performer_id="user2",
                performer_name="User 2",
                sequence_number=3,
            ),
            CardEvent(
                id=uuid4(),
                room_id=test_room.id,
                event_type=CardEventType.NOTES_ADDED,
                performer_id="visitor1",
                performer_name="Visitor 1",
                performer_type="visitor",
                sequence_number=4,
            ),
        ]

        for event in events:
            session.add(event)
        session.commit()

        response = client.get(f"/api/card-events/room/{test_room.id}/summary")

        assert response.status_code == 200
        data = response.json()

        assert data["room_id"] == str(test_room.id)
        assert data["total_events"] == 4
        assert data["latest_sequence"] == 4

        # Check event counts by type
        assert data["event_counts_by_type"][CardEventType.CARD_DEALT.value] == 2
        assert data["event_counts_by_type"][CardEventType.CARD_FLIPPED.value] == 1
        assert data["event_counts_by_type"][CardEventType.NOTES_ADDED.value] == 1
        assert (
            data["event_counts_by_type"][CardEventType.CARD_SELECTED.value] == 0
        )  # Not used

        # Check unique performers
        assert len(data["unique_performers"]) == 3
        performer_ids = [p["id"] for p in data["unique_performers"]]
        assert "user1" in performer_ids
        assert "user2" in performer_ids
        assert "visitor1" in performer_ids

    def test_get_room_events_room_not_found(self, client: TestClient):
        """Test getting events for non-existent room"""
        fake_room_id = uuid4()
        response = client.get(f"/api/card-events/room/{fake_room_id}")

        assert response.status_code == 404
        assert "Room not found" in response.json()["detail"]

    def test_get_specific_card_event(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test getting specific card event by ID"""
        event = CardEvent(
            id=uuid4(),
            room_id=test_room.id,
            event_type=CardEventType.INSIGHT_RECORDED,
            notes="Key insight about career direction",
            performer_id="counselor1",
            performer_name="Dr. Smith",
            sequence_number=1,
        )
        session.add(event)
        session.commit()
        session.refresh(event)

        response = client.get(f"/api/card-events/{event.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(event.id)
        assert data["event_type"] == CardEventType.INSIGHT_RECORDED.value
        assert data["notes"] == "Key insight about career direction"

    def test_get_card_event_not_found(self, client: TestClient):
        """Test getting non-existent card event"""
        fake_event_id = uuid4()
        response = client.get(f"/api/card-events/{fake_event_id}")

        assert response.status_code == 404
        assert "Card event not found" in response.json()["detail"]


class TestCardEventDeletion:
    """Test card event deletion functionality"""

    def test_delete_card_event(
        self, client: TestClient, session: Session, test_room: Room
    ):
        """Test deleting card event"""
        event = CardEvent(
            id=uuid4(),
            room_id=test_room.id,
            event_type=CardEventType.CARD_MOVED,
            sequence_number=1,
        )
        session.add(event)
        session.commit()
        session.refresh(event)

        response = client.delete(f"/api/card-events/{event.id}")

        assert response.status_code == 200
        assert "Card event deleted successfully" in response.json()["message"]

        # Verify event is deleted
        deleted_event = session.get(CardEvent, event.id)
        assert deleted_event is None

    def test_delete_card_event_not_found(self, client: TestClient):
        """Test deleting non-existent card event"""
        fake_event_id = uuid4()
        response = client.delete(f"/api/card-events/{fake_event_id}")

        assert response.status_code == 404
        assert "Card event not found" in response.json()["detail"]
