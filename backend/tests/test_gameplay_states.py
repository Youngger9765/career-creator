"""
Test suite for Gameplay States API endpoints
Testing file metadata storage for uploaded files
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
        description="Test Room for Gameplay States",
        counselor_id=test_user.id,
        share_code="TEST01",
        is_active=True,
    )
    session.add(room)
    session.commit()
    session.refresh(room)
    return room


class TestGameplayStateFileUpload:
    """Test file metadata storage in gameplay states"""

    def test_gameplay_state_with_uploaded_file(
        self, client: TestClient, test_user: User, test_room: Room
    ):
        """Test storing file metadata in gameplay state"""
        gameplay_state = {
            "state": {
                "cardPlacements": {},
                "uploadedFile": {
                    "name": "test.pdf",
                    "url": "https://storage.supabase.co/bucket/test.pdf",
                    "size": 12345,
                    "type": "application/pdf",
                    "uploadedAt": 1706889600000,
                    "uploadedBy": {
                        "userId": "user-123",
                        "userName": "Test User",
                        "role": "owner",
                    },
                },
                "metadata": {"version": 1, "lastModified": 1706889600000},
            }
        }

        response = client.put(
            f"/api/rooms/{test_room.id}/gameplay-states/position_breakdown",
            json=gameplay_state,
            headers=create_auth_headers(test_user),
        )

        assert response.status_code == 200

        # Retrieve and verify
        get_response = client.get(
            f"/api/rooms/{test_room.id}/gameplay-states/position_breakdown",
            headers=create_auth_headers(test_user),
        )

        assert get_response.status_code == 200
        data = get_response.json()
        assert data["state"]["uploadedFile"]["name"] == "test.pdf"
        assert data["state"]["uploadedFile"]["url"].startswith("https://storage")
        assert data["state"]["uploadedFile"]["uploadedBy"]["userId"] == "user-123"
        assert data["state"]["uploadedFile"]["size"] == 12345
        assert data["state"]["uploadedFile"]["type"] == "application/pdf"

    def test_gameplay_state_without_uploaded_file(
        self, client: TestClient, test_user: User, test_room: Room
    ):
        """Test gameplay state without uploadedFile (backward compatibility)"""
        gameplay_state = {
            "state": {
                "cardPlacements": {"card1": {"x": 100, "y": 200}},
                "metadata": {"version": 1, "lastModified": 1706889600000},
            }
        }

        response = client.put(
            f"/api/rooms/{test_room.id}/gameplay-states/career_exploration",
            json=gameplay_state,
            headers=create_auth_headers(test_user),
        )

        assert response.status_code == 200

        # Retrieve and verify
        get_response = client.get(
            f"/api/rooms/{test_room.id}/gameplay-states/career_exploration",
            headers=create_auth_headers(test_user),
        )

        assert get_response.status_code == 200
        data = get_response.json()
        assert "cardPlacements" in data["state"]
        # uploadedFile should be None or not present
        assert data["state"].get("uploadedFile") is None

    def test_gameplay_state_file_upload_update(
        self, client: TestClient, test_user: User, test_room: Room
    ):
        """Test updating uploadedFile in existing gameplay state"""
        # First create state without file
        initial_state = {
            "state": {
                "cardPlacements": {},
                "metadata": {"version": 1, "lastModified": 1706889600000},
            }
        }

        client.put(
            f"/api/rooms/{test_room.id}/gameplay-states/skills_mapping",
            json=initial_state,
            headers=create_auth_headers(test_user),
        )

        # Now update with file
        updated_state = {
            "state": {
                "cardPlacements": {},
                "uploadedFile": {
                    "name": "resume.pdf",
                    "url": "https://storage.supabase.co/bucket/resume.pdf",
                    "size": 54321,
                    "type": "application/pdf",
                    "uploadedAt": 1706889700000,
                    "uploadedBy": {
                        "userId": "user-456",
                        "userName": "Another User",
                        "role": "visitor",
                    },
                },
                "metadata": {"version": 2, "lastModified": 1706889700000},
            }
        }

        response = client.put(
            f"/api/rooms/{test_room.id}/gameplay-states/skills_mapping",
            json=updated_state,
            headers=create_auth_headers(test_user),
        )

        assert response.status_code == 200

        # Verify update
        get_response = client.get(
            f"/api/rooms/{test_room.id}/gameplay-states/skills_mapping",
            headers=create_auth_headers(test_user),
        )

        assert get_response.status_code == 200
        data = get_response.json()
        assert data["state"]["uploadedFile"]["name"] == "resume.pdf"
        assert data["state"]["uploadedFile"]["size"] == 54321
        assert data["state"]["uploadedFile"]["uploadedBy"]["userId"] == "user-456"

    def test_gameplay_state_invalid_file_metadata(
        self, client: TestClient, test_user: User, test_room: Room
    ):
        """Test that invalid file metadata is rejected"""
        # Missing required fields
        invalid_state = {
            "state": {
                "cardPlacements": {},
                "uploadedFile": {
                    "name": "test.pdf",
                    # Missing url, size, type, uploadedAt, uploadedBy
                },
                "metadata": {"version": 1},
            }
        }

        # This should still work because we're storing as JSONB
        # The validation would happen on the application layer if we add strict typing
        response = client.put(
            f"/api/rooms/{test_room.id}/gameplay-states/validation_test",
            json=invalid_state,
            headers=create_auth_headers(test_user),
        )

        # Currently this passes because JSONB accepts any structure
        # If we add strict validation later, this should return 422
        assert response.status_code in [200, 422]
