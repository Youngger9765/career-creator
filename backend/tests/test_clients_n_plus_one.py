"""
Test for N+1 query issue in clients API
测试客户 API 的 N+1 查询问题

Following TDD approach:
1. RED: Write failing test that exposes N+1 query issue
2. GREEN: Fix the code to make test pass
3. REFACTOR: Clean up if needed
"""

import pytest
from sqlalchemy import event
from sqlmodel import Session

from app.models.client import Client, ConsultationRecord, RoomClient
from app.models.room import Room
from tests.factories import UserFactory


class QueryCounter:
    """Helper class to count database queries"""

    def __init__(self):
        self.count = 0

    def __call__(self, conn, cursor, statement, parameters, context, executemany):
        # Only count SELECT queries (ignore transaction control)
        if statement.strip().upper().startswith("SELECT"):
            self.count += 1
            print(f"\n[Query {self.count}]: {statement[:100]}...")


@pytest.fixture
def query_counter():
    """Fixture to track query count"""
    return QueryCounter()


@pytest.fixture
def counselor_with_clients(session: Session):
    """
    Create test data:
    - 1 counselor
    - 10 clients
    - Each client has 3 rooms
    - Each client has 1 consultation record

    This setup will expose the N+1 query problem if it exists.
    """
    # Create counselor
    counselor = UserFactory.create_counselor(session, email="test.counselor@test.com")

    clients_data = []
    for i in range(10):
        # Create client
        client = Client(
            counselor_id=counselor.id,
            email=f"client{i}@test.com",
            name=f"Test Client {i}",
            phone=f"1234567{i:03d}",
        )
        session.add(client)
        session.flush()

        # Create 3 rooms for each client
        rooms = []
        for j in range(3):
            room = Room(
                counselor_id=counselor.id,
                name=f"Client {i} Room {j}",
                is_active=(j == 0),  # First room is active
                session_count=j + 1,
            )
            session.add(room)
            session.flush()

            # Link room to client
            room_client = RoomClient(
                room_id=room.id,
                client_id=client.id,
            )
            session.add(room_client)
            rooms.append(room)

        # Create 1 consultation record for each client
        record = ConsultationRecord(
            room_id=rooms[0].id,
            client_id=client.id,
            counselor_id=counselor.id,
            session_date="2024-01-01T10:00:00",
            topics=["Career guidance"],
            notes="Test consultation",
        )
        session.add(record)

        clients_data.append(
            {
                "client": client,
                "rooms": rooms,
                "record": record,
            }
        )

    session.commit()

    return {
        "counselor": counselor,
        "clients": clients_data,
    }


def test_get_clients_should_not_have_n_plus_one_query(
    session: Session,
    counselor_with_clients,
    query_counter,
):
    """
    RED TEST: This test will FAIL initially because of N+1 queries

    Expected behavior:
    - With 10 clients (each with 3 rooms), we should have:
      - 1 query to fetch all clients
      - 1 query to fetch all room statistics (using JOIN + GROUP BY)
      - 1 query to fetch all consultation records
      - 1 query to fetch all rooms with clients
      - 1 query to fetch all counselors (if needed)

    Total: ~5 queries MAX (regardless of number of clients)

    Current behavior (N+1):
    - 1 query to fetch all clients
    - 10 queries for active_rooms_count (one per client)
    - 10 queries for total_consultations (one per client)
    - 10 queries for last_consultation (one per client)
    - 10 queries for rooms (one per client)
    - ~30 queries for counselor names (one per room, 3 rooms per client)

    Total: 71+ queries (BAD!)
    """
    counselor = counselor_with_clients["counselor"]

    # Attach query counter to track all queries
    event.listen(session.bind, "before_cursor_execute", query_counter)

    # Import here to avoid circular dependency
    from app.api.clients import get_my_clients

    # Mock current_user
    current_user = {
        "user_id": str(counselor.id),
        "email": counselor.email,
        "roles": counselor.roles,
    }

    # Call the endpoint (this will trigger queries)
    # We need to use async wrapper since the endpoint is async
    import asyncio

    result = asyncio.run(
        get_my_clients(
            session=session,
            current_user=current_user,
            status=None,
            search=None,
        )
    )

    # Remove event listener
    event.remove(session.bind, "before_cursor_execute", query_counter)

    # Assertions
    print(f"\n\n{'='*60}")
    print(f"QUERY COUNT: {query_counter.count}")
    print(f"{'='*60}\n")

    # This test will FAIL initially with N+1 queries
    # After fixing, it should pass with <= 10 queries
    assert query_counter.count <= 10, (
        f"Too many queries detected: {query_counter.count}. "
        f"Expected <= 10 queries (indicates N+1 problem)"
    )

    # Verify data correctness
    assert len(result) == 10, "Should return 10 clients"

    for client_response in result:
        assert (
            client_response.active_rooms_count == 1
        ), "Each client should have 1 active room"
        assert (
            client_response.total_consultations > 0
        ), "Each client should have consultations"
        assert (
            client_response.last_consultation_date is not None
        ), "Should have last consultation"
        assert len(client_response.rooms) == 3, "Each client should have 3 rooms"


def test_get_clients_performance_with_scaling(
    session: Session,
    query_counter,
):
    """
    Additional test: Query count should NOT increase with more clients

    This verifies that the fix scales properly:
    - 10 clients = X queries
    - 100 clients = X queries (same!)
    """
    # Create counselor with 100 clients
    counselor = UserFactory.create_counselor(session, email="perf.test@test.com")

    for i in range(100):
        client = Client(
            counselor_id=counselor.id,
            email=f"perfclient{i}@test.com",
            name=f"Performance Test Client {i}",
        )
        session.add(client)
        session.flush()

        # Create 1 room per client
        room = Room(
            counselor_id=counselor.id,
            name=f"Performance Room {i}",
            is_active=True,
        )
        session.add(room)
        session.flush()

        room_client = RoomClient(
            room_id=room.id,
            client_id=client.id,
        )
        session.add(room_client)

    session.commit()

    # Attach query counter
    event.listen(session.bind, "before_cursor_execute", query_counter)

    from app.api.clients import get_my_clients

    current_user = {
        "user_id": str(counselor.id),
        "email": counselor.email,
        "roles": counselor.roles,
    }

    import asyncio

    result = asyncio.run(
        get_my_clients(
            session=session,
            current_user=current_user,
            status=None,
            search=None,
        )
    )

    event.remove(session.bind, "before_cursor_execute", query_counter)

    print(f"\n\n{'='*60}")
    print(f"PERFORMANCE TEST (100 clients): {query_counter.count} queries")
    print(f"{'='*60}\n")

    # With proper optimization, query count should be independent of client count
    assert query_counter.count <= 10, (
        f"Query count should not scale with client count. "
        f"Got {query_counter.count} queries for 100 clients."
    )

    assert len(result) == 100, "Should return 100 clients"
