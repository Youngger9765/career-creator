"""
File upload API endpoints
Handles file uploads to Google Cloud Storage
"""

import time
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from google.cloud import storage
from pydantic import BaseModel, ConfigDict
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token
from app.core.config import settings
from app.core.database import get_session
from app.models.room import Room
from app.models.user import User
from app.models.visitor import Visitor

router = APIRouter()


def get_current_user(
    current_user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
) -> User:
    """Get current user from JWT token and database"""
    user_id = UUID(current_user["user_id"])
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )
    return user

# File upload constraints
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


class FileUploaderInfo(BaseModel):
    """File uploader information"""

    userId: UUID
    userName: str
    role: str
    model_config = ConfigDict(extra="forbid")


class FileUploadResponse(BaseModel):
    """File upload response"""

    name: str
    url: str
    size: int
    type: str
    uploadedAt: int
    uploadedBy: FileUploaderInfo
    model_config = ConfigDict(extra="forbid")


def get_gcs_client() -> storage.Client:
    """Get Google Cloud Storage client

    Uses Cloud Run default service account if google_application_credentials is None,
    otherwise uses the specified credentials file.
    """
    if settings.google_application_credentials:
        return storage.Client.from_service_account_json(
            settings.google_application_credentials
        )
    # Use default credentials (Cloud Run service account)
    return storage.Client()


def validate_file(file: UploadFile) -> None:
    """Validate file size and type

    Args:
        file: The uploaded file

    Raises:
        HTTPException: If file validation fails
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    # Normalize filename to lowercase for case-insensitive check
    filename_lower = file.filename.lower()

    # Prevent double extensions (e.g., file.pdf.exe)
    if filename_lower.count(".") > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Files with multiple extensions are not allowed",
        )

    # Check file extension (case-insensitive)
    file_ext = next(
        (ext for ext in ALLOWED_EXTENSIONS if filename_lower.endswith(ext)),
        None,
    )
    if not file_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Check MIME type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File MIME type not allowed. Allowed types: {', '.join(ALLOWED_TYPES)}",
        )


@router.post("/api/rooms/{room_id}/upload", response_model=FileUploadResponse)
async def upload_file(
    room_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> FileUploadResponse:
    """Upload file to Google Cloud Storage

    Args:
        room_id: Room ID
        file: Uploaded file
        current_user: Current authenticated user
        session: Database session

    Returns:
        File upload metadata including public URL

    Raises:
        HTTPException: If room not found, file validation fails, or upload fails
    """
    # Verify room exists
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Check authorization: only room counselor can upload
    # (Visitors are anonymous and don't have user accounts)
    if room.counselor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload files to this room",
        )

    # Validate file type FIRST (cheap check before reading file)
    validate_file(file)

    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB",
        )

    # Upload to GCS
    try:
        gcs_client = get_gcs_client()
        bucket = gcs_client.bucket(settings.gcs_bucket_name)

        # Generate unique blob path
        timestamp = int(time.time() * 1000)
        blob_path = f"rooms/{room_id}/{timestamp}_{file.filename}"
        blob = bucket.blob(blob_path)

        # Upload file
        await file.seek(0)  # Reset file pointer
        blob.upload_from_file(file.file, content_type=file.content_type)

        # Get public URL (bucket has allUsers objectViewer for public access)
        public_url = blob.public_url

        # Return file metadata (user must be counselor since we checked above)
        return FileUploadResponse(
            name=file.filename or "unknown",
            url=public_url,
            size=file_size,
            type=file.content_type or "application/octet-stream",
            uploadedAt=timestamp,
            uploadedBy=FileUploaderInfo(
                userId=current_user.id,
                userName=current_user.name,
                role="counselor",
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )
