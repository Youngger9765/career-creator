"""
Test for N+1 query issue in rooms API
测试房间 API 的 N+1 查询问题

Following TDD approach:
1. RED: Write failing test that exposes N+1 query issue
2. GREEN: Fix the code to make test pass
3. REFACTOR: Clean up if needed
"""

import pytest
from sqlalchemy import event
from sqlmodel import Session

from app.models.client import Client, RoomClient
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
def counselor_with_rooms(session: Session):
    """
    Create test data:
    - 1 counselor
    - 20 rooms (each with a linked client)

    This setup will expose the N+1 query problem in list_user_rooms endpoint.
    """
    # Create counselor
    counselor = UserFactory.create_counselor(session, email="rooms.test@test.com")

    rooms_data = []
    for i in range(20):
        # Create client
        client = Client(
            counselor_id=counselor.id,
            email=f"roomclient{i}@test.com",
            name=f"Room Client {i}",
        )
        session.add(client)
        session.flush()

        # Create room
        room = Room(
            counselor_id=counselor.id,
            name=f"Test Room {i}",
            description=f"Room {i} description",
            is_active=(i % 2 == 0),  # Alternate active/inactive
        )
        session.add(room)
        session.flush()

        # Link room to client
        room_client = RoomClient(
            room_id=room.id,
            client_id=client.id,
        )
        session.add(room_client)

        rooms_data.append(
            {
                "room": room,
                "client": client,
            }
        )

    session.commit()

    return {
        "counselor": counselor,
        "rooms": rooms_data,
    }


def test_list_rooms_should_not_have_n_plus_one_query(
    session: Session,
    counselor_with_rooms,
    query_counter,
):
    """
    RED TEST: This test will FAIL initially because of N+1 queries

    Expected behavior:
    - With 20 rooms, we should have:
      - 1 query to fetch all rooms with client names (using JOIN)
      - 1 query to fetch counselor name (or reuse from context)

    Total: ~2-3 queries MAX (regardless of number of rooms)

    Current behavior (N+1):
    - 1 query to fetch all rooms with LEFT JOIN on clients
    - 20 queries to fetch counselor name (one per room)

    Total: 21 queries (BAD!)
    """
    counselor = counselor_with_rooms["counselor"]

    # Attach query counter to track all queries
    event.listen(session.bind, "before_cursor_execute", query_counter)

    # Import here to avoid circular dependency
    from app.api.rooms import list_user_rooms

    # Mock current_user
    current_user = {
        "id": counselor.id,  # UUID directly
        "email": counselor.email,
        "roles": counselor.roles,
    }

    # Call the endpoint (this will trigger queries)
    result = list_user_rooms(
        session=session,
        current_user=current_user,
        include_inactive=True,
    )

    # Remove event listener
    event.remove(session.bind, "before_cursor_execute", query_counter)

    # Assertions
    print(f"\n\n{'='*60}")
    print(f"QUERY COUNT: {query_counter.count}")
    print(f"{'='*60}\n")

    # This test will FAIL initially with N+1 queries
    # After fixing, it should pass with <= 5 queries
    assert query_counter.count <= 5, (
        f"Too many queries detected: {query_counter.count}. "
        f"Expected <= 5 queries (indicates N+1 problem)"
    )

    # Verify data correctness
    assert len(result) == 20, "Should return 20 rooms"

    for room_response in result:
        assert (
            room_response["counselor_name"] is not None
        ), "Each room should have counselor name"


def test_list_rooms_performance_with_scaling(
    session: Session,
    query_counter,
):
    """
    Additional test: Query count should NOT increase with more rooms

    This verifies that the fix scales properly:
    - 20 rooms = X queries
    - 100 rooms = X queries (same!)
    """
    # Create counselor with 100 rooms
    counselor = UserFactory.create_counselor(session, email="perf.rooms@test.com")

    for i in range(100):
        client = Client(
            counselor_id=counselor.id,
            email=f"perfroom{i}@test.com",
            name=f"Performance Room Client {i}",
        )
        session.add(client)
        session.flush()

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

    from app.api.rooms import list_user_rooms

    current_user = {
        "id": counselor.id,
        "email": counselor.email,
        "roles": counselor.roles,
    }

    result = list_user_rooms(
        session=session,
        current_user=current_user,
        include_inactive=False,
    )

    event.remove(session.bind, "before_cursor_execute", query_counter)

    print(f"\n\n{'='*60}")
    print(f"PERFORMANCE TEST (100 rooms): {query_counter.count} queries")
    print(f"{'='*60}\n")

    # With proper optimization, query count should be independent of room count
    assert query_counter.count <= 5, (
        f"Query count should not scale with room count. "
        f"Got {query_counter.count} queries for 100 rooms."
    )

    assert len(result) == 100, "Should return 100 rooms"
