import io
from unittest.mock import MagicMock, PropertyMock, patch
from uuid import uuid4

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.database import get_session
from app.main import app
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


class TestFileUploads:
    """Test file upload endpoint"""

    def test_upload_file_success(self, client, session, test_user):
        """Test successful file upload to GCS"""
        # Create a room owned by test user
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        auth_headers = create_auth_headers(test_user)

        # Mock GCS client
        with patch("app.api.file_uploads.get_gcs_client") as mock_get_client:
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_blob = MagicMock()

            # Set public_url as a property that returns a string
            expected_url = (
                f"https://storage.googleapis.com/test-bucket/rooms/{room.id}/test.pdf"
            )
            type(mock_blob).public_url = PropertyMock(return_value=expected_url)

            mock_bucket.blob.return_value = mock_blob
            mock_client.bucket.return_value = mock_bucket
            mock_get_client.return_value = mock_client

            # Create test file
            file_content = b"Test PDF content"
            files = {
                "file": ("test.pdf", io.BytesIO(file_content), "application/pdf")
            }

            # Upload file
            response = client.post(
                f"/api/rooms/{room.id}/upload",
                files=files,
                headers=auth_headers,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()

            # Verify response structure
            assert data["name"] == "test.pdf"
            assert data["url"].startswith("https://storage.googleapis.com")
            assert data["size"] == len(file_content)
            assert data["type"] == "application/pdf"
            assert "uploadedAt" in data
            assert data["uploadedBy"]["userId"] == str(test_user.id)
            assert data["uploadedBy"]["userName"] == test_user.name
            assert data["uploadedBy"]["role"] == "counselor"

            # Verify GCS upload was called
            mock_blob.upload_from_file.assert_called_once()
            mock_blob.make_public.assert_called_once()

    def test_upload_file_size_limit(self, client, session, test_user):
        """Test file size validation (max 5MB)"""
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        auth_headers = create_auth_headers(test_user)

        # Create 6MB file
        large_file = io.BytesIO(b"x" * (6 * 1024 * 1024))
        files = {"file": ("large.pdf", large_file, "application/pdf")}

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "too large" in response.json()["detail"].lower()

    def test_upload_file_invalid_type(self, client, session, test_user):
        """Test file type validation (only PDF/JPG/PNG)"""
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        auth_headers = create_auth_headers(test_user)

        # Try to upload .exe file
        file_content = b"Executable content"
        files = {"file": ("virus.exe", io.BytesIO(file_content), "application/exe")}

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not allowed" in response.json()["detail"].lower()

    def test_upload_file_room_not_found(self, client, test_user):
        """Test uploading to non-existent room"""
        auth_headers = create_auth_headers(test_user)

        files = {"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")}

        # Use a valid UUID that doesn't exist
        non_existent_room_id = uuid4()

        response = client.post(
            f"/api/rooms/{non_existent_room_id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_upload_file_unauthorized(self, client, session, test_user):
        """Test upload without authentication"""
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        files = {"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")}

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_file_forbidden_different_room(self, client, session):
        """Test user cannot upload to room they don't have access to"""
        from app.models.room import Room
        from app.models.visitor import Visitor

        # Create two users
        counselor1 = User(
            id=uuid4(),
            email="counselor1@test.com",
            hashed_password="hashed_password_123",
            name="Counselor 1",
            roles=["counselor"],
            is_active=True,
        )
        counselor2 = User(
            id=uuid4(),
            email="counselor2@test.com",
            hashed_password="hashed_password_123",
            name="Counselor 2",
            roles=["counselor"],
            is_active=True,
        )
        session.add_all([counselor1, counselor2])
        session.commit()

        # Counselor1's room
        room = Room(name="Room 1", counselor_id=counselor1.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        # Counselor2 tries to upload to counselor1's room
        auth_headers = create_auth_headers(counselor2)
        files = {"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")}

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "permission" in response.json()["detail"].lower()

    def test_upload_file_visitor_forbidden(self, client, session):
        """Test visitors cannot upload files (only counselors can)"""
        from app.models.room import Room

        # Create counselor and another user (acting as visitor)
        counselor = User(
            id=uuid4(),
            email="counselor@test.com",
            hashed_password="hashed_password_123",
            name="Counselor",
            roles=["counselor"],
            is_active=True,
        )
        visitor_user = User(
            id=uuid4(),
            email="visitor@test.com",
            hashed_password="hashed_password_123",
            name="Visitor User",
            roles=[],
            is_active=True,
        )
        session.add_all([counselor, visitor_user])
        session.commit()

        # Create room owned by counselor
        room = Room(name="Test Room", counselor_id=counselor.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        # Try to upload as non-counselor (visitor)
        auth_headers = create_auth_headers(visitor_user)
        files = {"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")}

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "permission" in response.json()["detail"].lower()

    def test_upload_file_double_extension_rejected(self, client, session, test_user):
        """Test files with double extensions are rejected (security)"""
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        auth_headers = create_auth_headers(test_user)

        # Try to upload file with double extension
        file_content = b"Malicious content"
        files = {
            "file": (
                "malware.pdf.exe",
                io.BytesIO(file_content),
                "application/pdf",
            )
        }

        response = client.post(
            f"/api/rooms/{room.id}/upload",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "multiple extensions" in response.json()["detail"].lower()

    def test_upload_file_case_insensitive_extension(self, client, session, test_user):
        """Test file extension validation is case-insensitive"""
        from app.models.room import Room

        room = Room(name="Test Room", counselor_id=test_user.id)
        session.add(room)
        session.commit()
        session.refresh(room)

        auth_headers = create_auth_headers(test_user)

        # Mock GCS client
        with patch("app.api.file_uploads.get_gcs_client") as mock_get_client:
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_blob = MagicMock()

            expected_url = f"https://storage.googleapis.com/test-bucket/rooms/{room.id}/test.PDF"
            type(mock_blob).public_url = PropertyMock(return_value=expected_url)

            mock_bucket.blob.return_value = mock_blob
            mock_client.bucket.return_value = mock_bucket
            mock_get_client.return_value = mock_client

            # Upload file with uppercase extension
            file_content = b"Test PDF content"
            files = {
                "file": ("test.PDF", io.BytesIO(file_content), "application/pdf")
            }

            response = client.post(
                f"/api/rooms/{room.id}/upload",
                files=files,
                headers=auth_headers,
            )

            assert response.status_code == status.HTTP_200_OK
