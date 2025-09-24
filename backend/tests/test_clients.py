"""
Test suite for Client API endpoints
Testing client privacy, consultation count logic, and counselor name display
Following TDD approach: Red -> Green -> Refactor
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.auth import DEMO_ACCOUNTS, create_access_token
from app.core.database import get_session
from app.main import app
from app.models.client import Client, CounselorClientRelationship, RoomClient
from app.models.room import Room


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


@pytest.fixture(name="client_api")
def client_fixture(session: Session):
    """Create test client with dependency override"""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="demo_counselor_1_headers")
def demo_counselor_1_headers():
    """Create auth headers for demo-counselor-001"""
    token_data = {
        "sub": "demo-counselor-001",
        "email": "counselor1@example.com",
        "roles": ["counselor"],
    }
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="demo_counselor_2_headers")
def demo_counselor_2_headers():
    """Create auth headers for demo-counselor-002"""
    token_data = {
        "sub": "demo-counselor-002",
        "email": "counselor2@example.com",
        "roles": ["counselor"],
    }
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="test_clients")
def test_clients_fixture(session: Session):
    """Create test clients and relationships"""
    # Create clients
    client1 = Client(
        id=uuid4(),
        email="client1@example.com",
        name="Client One",
        phone="+1234567890",
        notes="Test client 1",
        tags=["tag1", "tag2"],
        status="active",
    )

    client2 = Client(
        id=uuid4(),
        email="client2@example.com",
        name="Client Two",
        phone="+0987654321",
        notes="Test client 2",
        tags=["tag3"],
        status="active",
    )

    # Add clients to session
    session.add(client1)
    session.add(client2)
    session.commit()
    session.refresh(client1)
    session.refresh(client2)

    # Create counselor-client relationships
    # Client 1 belongs to both counselors (to test privacy)
    rel1_1 = CounselorClientRelationship(
        counselor_id="demo-counselor-001",
        client_id=client1.id,
        relationship_type="primary",
        is_active=True,
    )
    rel1_2 = CounselorClientRelationship(
        counselor_id="demo-counselor-002",
        client_id=client1.id,
        relationship_type="secondary",
        is_active=True,
    )

    # Client 2 belongs only to counselor 001
    rel2_1 = CounselorClientRelationship(
        counselor_id="demo-counselor-001",
        client_id=client2.id,
        relationship_type="primary",
        is_active=True,
    )

    session.add_all([rel1_1, rel1_2, rel2_1])
    session.commit()

    return {"client1": client1, "client2": client2}


@pytest.fixture(name="test_rooms")
def test_rooms_fixture(session: Session, test_clients):
    """Create test rooms associated with clients"""
    client1 = test_clients["client1"]
    client2 = test_clients["client2"]

    # Rooms for counselor 001
    room1_c1 = Room(
        id=uuid4(),
        name="Room 1 for Client 1",
        description="Test room",
        counselor_id="demo-counselor-001",
        is_active=True,
        session_count=3,
    )

    room2_c1 = Room(
        id=uuid4(),
        name="Room 2 for Client 1",
        description="Another test room",
        counselor_id="demo-counselor-001",
        is_active=True,
        session_count=2,
    )

    room1_c2 = Room(
        id=uuid4(),
        name="Room 1 for Client 2",
        description="Test room for client 2",
        counselor_id="demo-counselor-001",
        is_active=True,
        session_count=4,
    )

    # Room for counselor 002 with client 1
    room2_c1_different_counselor = Room(
        id=uuid4(),
        name="Room for Client 1 - Different Counselor",
        description="Room by different counselor",
        counselor_id="demo-counselor-002",
        is_active=True,
        session_count=1,
    )

    session.add_all([room1_c1, room2_c1, room1_c2, room2_c1_different_counselor])
    session.commit()
    session.refresh(room1_c1)
    session.refresh(room2_c1)
    session.refresh(room1_c2)
    session.refresh(room2_c1_different_counselor)

    # Create room-client associations
    associations = [
        RoomClient(room_id=room1_c1.id, client_id=client1.id, is_primary=True),
        RoomClient(room_id=room2_c1.id, client_id=client1.id, is_primary=True),
        RoomClient(room_id=room1_c2.id, client_id=client2.id, is_primary=True),
        RoomClient(
            room_id=room2_c1_different_counselor.id,
            client_id=client1.id,
            is_primary=True,
        ),
    ]

    session.add_all(associations)
    session.commit()

    return {
        "room1_c1": room1_c1,  # Counselor 001, Client 1, 3 sessions
        "room2_c1": room2_c1,  # Counselor 001, Client 1, 2 sessions
        "room1_c2": room1_c2,  # Counselor 001, Client 2, 4 sessions
        "room2_c1_different_counselor": room2_c1_different_counselor,  # Counselor 002, Client 1, 1 session
    }


class TestClientPrivacy:
    """Test client privacy and data isolation between counselors"""

    def test_counselor_can_only_see_own_clients(
        self,
        client_api,
        demo_counselor_1_headers,
        demo_counselor_2_headers,
        test_clients,
    ):
        """Test that counselors can only see clients they have relationships with"""
        # Counselor 001 should see both clients
        response = client_api.get("/api/clients", headers=demo_counselor_1_headers)
        assert response.status_code == 200
        clients_data = response.json()
        assert len(clients_data) == 2
        client_names = [c["name"] for c in clients_data]
        assert "Client One" in client_names
        assert "Client Two" in client_names

        # Counselor 002 should only see client 1
        response = client_api.get("/api/clients", headers=demo_counselor_2_headers)
        assert response.status_code == 200
        clients_data = response.json()
        assert len(clients_data) == 1
        assert clients_data[0]["name"] == "Client One"

    def test_client_rooms_filtered_by_counselor(
        self,
        client_api,
        demo_counselor_1_headers,
        demo_counselor_2_headers,
        test_clients,
        test_rooms,
    ):
        """Test that client room data is filtered by current counselor"""
        client1_id = test_clients["client1"].id

        # Get client 1 data from counselor 001 perspective
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        assert response.status_code == 200
        client_data = response.json()

        # Should see 2 rooms (both owned by counselor 001)
        assert len(client_data["rooms"]) == 2
        room_names = [r["name"] for r in client_data["rooms"]]
        assert "Room 1 for Client 1" in room_names
        assert "Room 2 for Client 1" in room_names
        assert "Room for Client 1 - Different Counselor" not in room_names

        # Get client 1 data from counselor 002 perspective
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_2_headers
        )
        assert response.status_code == 200
        client_data = response.json()

        # Should see 1 room (owned by counselor 002)
        assert len(client_data["rooms"]) == 1
        assert (
            client_data["rooms"][0]["name"] == "Room for Client 1 - Different Counselor"
        )

    def test_cannot_access_other_counselors_client_details(
        self, client_api, demo_counselor_2_headers, test_clients
    ):
        """Test that counselor cannot access client details they don't have relationship with"""
        client2_id = test_clients["client2"].id

        # Counselor 002 trying to access client 2 (which they don't have relationship with)
        response = client_api.get(
            f"/api/clients/{client2_id}", headers=demo_counselor_2_headers
        )
        assert response.status_code == 404
        assert "Client not found" in response.json()["detail"]


class TestConsultationCountLogic:
    """Test consultation count logic using room session_count"""

    def test_consultation_count_uses_session_count_sum(
        self, client_api, demo_counselor_1_headers, test_clients, test_rooms
    ):
        """Test that consultation count is sum of room session_count values"""
        # Client 1 has 2 rooms with counselor 001: 3 + 2 = 5 total consultations
        response = client_api.get("/api/clients", headers=demo_counselor_1_headers)
        assert response.status_code == 200
        clients_data = response.json()

        client1_data = next(c for c in clients_data if c["name"] == "Client One")
        assert client1_data["total_consultations"] == 5  # 3 + 2 sessions

        client2_data = next(c for c in clients_data if c["name"] == "Client Two")
        assert client2_data["total_consultations"] == 4  # 4 sessions from single room

    def test_consultation_count_filtered_by_counselor(
        self,
        client_api,
        demo_counselor_1_headers,
        demo_counselor_2_headers,
        test_clients,
        test_rooms,
    ):
        """Test that consultation count only includes current counselor's rooms"""
        client1_id = test_clients["client1"].id

        # From counselor 001 perspective: 3 + 2 = 5 sessions
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        assert response.status_code == 200
        client_data = response.json()
        assert client_data["total_consultations"] == 5

        # From counselor 002 perspective: only 1 session
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_2_headers
        )
        assert response.status_code == 200
        client_data = response.json()
        assert client_data["total_consultations"] == 1

    def test_active_rooms_count_accuracy(
        self, client_api, demo_counselor_1_headers, test_clients, test_rooms
    ):
        """Test that active rooms count matches number of active rooms for current counselor"""
        response = client_api.get("/api/clients", headers=demo_counselor_1_headers)
        assert response.status_code == 200
        clients_data = response.json()

        client1_data = next(c for c in clients_data if c["name"] == "Client One")
        assert (
            client1_data["active_rooms_count"] == 2
        )  # 2 active rooms for counselor 001

        client2_data = next(c for c in clients_data if c["name"] == "Client Two")
        assert (
            client2_data["active_rooms_count"] == 1
        )  # 1 active room for counselor 001


class TestCounselorNameDisplay:
    """Test counselor name display in room data"""

    def test_demo_counselor_names_displayed(
        self, client_api, demo_counselor_1_headers, test_clients, test_rooms
    ):
        """Test that demo counselor names are displayed in room data"""
        client1_id = test_clients["client1"].id

        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        assert response.status_code == 200
        client_data = response.json()

        # All rooms should have counselor_name field
        for room in client_data["rooms"]:
            assert "counselor_name" in room
            assert room["counselor_name"] is not None
            # Should be the demo counselor name from DEMO_ACCOUNTS
            demo_account = next(
                acc for acc in DEMO_ACCOUNTS if acc["id"] == "demo-counselor-001"
            )
            assert room["counselor_name"] == demo_account["name"]

    def test_different_counselor_names_in_rooms(
        self, client_api, demo_counselor_2_headers, test_clients, test_rooms
    ):
        """Test that different counselors show different names in room data"""
        client1_id = test_clients["client1"].id

        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_2_headers
        )
        assert response.status_code == 200
        client_data = response.json()

        # Should have counselor 002's name
        room = client_data["rooms"][0]
        demo_account = next(
            acc for acc in DEMO_ACCOUNTS if acc["id"] == "demo-counselor-002"
        )
        assert room["counselor_name"] == demo_account["name"]


class TestRoomAPIWithCounselorNames:
    """Test room API counselor name display functionality"""

    def test_room_list_includes_counselor_names(
        self, client_api, demo_counselor_1_headers, test_rooms
    ):
        """Test that room list API includes counselor names"""
        response = client_api.get("/api/rooms/", headers=demo_counselor_1_headers)
        assert response.status_code == 200
        rooms_data = response.json()

        # All rooms should have counselor_name
        for room in rooms_data:
            assert "counselor_name" in room
            assert room["counselor_name"] is not None
            # Should match demo account name
            demo_account = next(
                acc for acc in DEMO_ACCOUNTS if acc["id"] == room["counselor_id"]
            )
            assert room["counselor_name"] == demo_account["name"]

    def test_single_room_includes_counselor_name(
        self, client_api, demo_counselor_1_headers, test_rooms
    ):
        """Test that single room API includes counselor name in response model"""
        room_id = test_rooms["room1_c1"].id

        response = client_api.get(
            f"/api/rooms/{room_id}", headers=demo_counselor_1_headers
        )
        assert response.status_code == 200
        room_data = response.json()

        # Response model should include counselor_name field (even if None for single room endpoint)
        assert "counselor_name" in room_data


class TestIntegrationScenarios:
    """Test end-to-end scenarios combining all features"""

    def test_cross_counselor_client_management_scenario(
        self,
        client_api,
        demo_counselor_1_headers,
        demo_counselor_2_headers,
        test_clients,
        test_rooms,
    ):
        """Test realistic cross-counselor client management scenario"""
        client1_id = test_clients["client1"].id

        # Scenario: Client 1 has worked with both counselors
        # Each counselor should see only their own rooms and consultation counts

        # Counselor 001 perspective
        response_c1 = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        assert response_c1.status_code == 200
        data_c1 = response_c1.json()

        # Counselor 002 perspective
        response_c2 = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_2_headers
        )
        assert response_c2.status_code == 200
        data_c2 = response_c2.json()

        # Both should see the same client basic info
        assert data_c1["name"] == data_c2["name"] == "Client One"
        assert data_c1["email"] == data_c2["email"]

        # But different room counts and consultation totals
        assert data_c1["total_consultations"] == 5  # 3 + 2 sessions
        assert data_c2["total_consultations"] == 1  # 1 session

        assert data_c1["active_rooms_count"] == 2
        assert data_c2["active_rooms_count"] == 1

        # Different room lists
        assert len(data_c1["rooms"]) == 2
        assert len(data_c2["rooms"]) == 1

        # Different counselor names in room data
        c1_counselor_names = {r["counselor_name"] for r in data_c1["rooms"]}
        c2_counselor_names = {r["counselor_name"] for r in data_c2["rooms"]}

        assert len(c1_counselor_names) == 1  # All from same counselor
        assert len(c2_counselor_names) == 1  # All from same counselor
        assert c1_counselor_names != c2_counselor_names  # Different counselor names

    def test_data_consistency_after_room_updates(
        self, client_api, demo_counselor_1_headers, test_clients, test_rooms, session
    ):
        """Test that client data remains consistent after room session_count updates"""
        client1_id = test_clients["client1"].id
        room_id = test_rooms["room1_c1"].id

        # Get initial consultation count
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        initial_count = response.json()["total_consultations"]

        # Update room session_count directly in database (simulating game session completion)
        room = session.get(Room, room_id)
        room.session_count += 2
        session.add(room)
        session.commit()

        # Verify consultation count updated
        response = client_api.get(
            f"/api/clients/{client1_id}", headers=demo_counselor_1_headers
        )
        new_count = response.json()["total_consultations"]
        assert new_count == initial_count + 2
