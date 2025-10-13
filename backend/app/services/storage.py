"""
GCS Storage Service
Google Cloud Storage 文件上傳服務
"""

import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional
from uuid import UUID, uuid4

from fastapi import UploadFile

# Import settings
from app.core.config import settings

# GCS Configuration
GCS_BUCKET_NAME = settings.gcs_bucket_name
USE_MOCK_STORAGE = settings.use_mock_storage

# Set GOOGLE_APPLICATION_CREDENTIALS if specified
if settings.google_application_credentials:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
        settings.google_application_credentials
    )

# Local storage configuration
LOCAL_STORAGE_DIR = Path("uploads/screenshots")
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


async def upload_screenshot(
    file: UploadFile,
    counselor_id: UUID,
    record_id: UUID,
) -> str:
    """
    Upload screenshot to storage (local filesystem or GCS)

    Args:
        file: File to upload
        counselor_id: Counselor ID for organizing files
        record_id: Consultation record ID

    Returns:
        str: Public URL of uploaded file
    """
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename else "png"
    unique_filename = f"{uuid4()}.{file_extension}"

    # Construct file path
    relative_path = f"{counselor_id}/{record_id}/{unique_filename}"

    # Use local storage for development/testing
    if USE_MOCK_STORAGE:
        # Create directory structure
        local_file_dir = LOCAL_STORAGE_DIR / str(counselor_id) / str(record_id)
        local_file_dir.mkdir(parents=True, exist_ok=True)

        # Save file locally
        local_file_path = local_file_dir / unique_filename
        file.file.seek(0)
        with open(local_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return local URL that will be served by FastAPI
        return f"http://localhost:8000/uploads/screenshots/{relative_path}"

    # Real GCS upload
    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(f"screenshots/{relative_path}")

        # Upload file
        file.file.seek(0)  # Reset file pointer
        blob.upload_from_file(file.file, content_type=file.content_type or "image/png")

        # Note: Bucket has uniform bucket-level access with allUsers objectViewer role
        # Files are automatically public, no need to call make_public()

        return blob.public_url

    except Exception as e:
        # Log error and fall back to local storage in development
        print(f"GCS upload error: {e}")
        if os.getenv("ENV", "development") == "development":
            # Try to save locally as fallback
            local_file_dir = LOCAL_STORAGE_DIR / str(counselor_id) / str(record_id)
            local_file_dir.mkdir(parents=True, exist_ok=True)

            local_file_path = local_file_dir / unique_filename
            file.file.seek(0)
            with open(local_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            return f"http://localhost:8000/uploads/screenshots/{relative_path}"
        raise


async def upload_to_gcs(
    file_content: BinaryIO, file_path: str, content_type: str = "image/png"
) -> str:
    """
    Generic upload to GCS

    Args:
        file_content: File content as binary stream
        file_path: Path in bucket
        content_type: MIME type

    Returns:
        str: Public URL of uploaded file
    """
    # Use mock storage for development/testing
    if USE_MOCK_STORAGE:
        mock_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{file_path}"
        return mock_url

    # Real GCS upload
    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(file_path)

        # Upload file
        file_content.seek(0)  # Reset file pointer
        blob.upload_from_file(file_content, content_type=content_type)

        # Note: Bucket has uniform bucket-level access with allUsers objectViewer role
        # Files are automatically public, no need to call make_public()

        return blob.public_url

    except Exception as e:
        # Log error and fall back to mock URL in development
        print(f"GCS upload error: {e}")
        if os.getenv("ENV", "development") == "development":
            return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{file_path}"
        raise


def init_gcs_bucket() -> Optional[str]:
    """
    Initialize GCS bucket with proper configuration

    Returns:
        str: Bucket name if successful, None otherwise
    """
    if USE_MOCK_STORAGE:
        print("Using mock storage (GCS disabled)")
        return None

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(GCS_BUCKET_NAME)

        # Check if bucket exists
        if not bucket.exists():
            print(f"Warning: GCS bucket '{GCS_BUCKET_NAME}' does not exist")
            return None

        # Set CORS configuration
        bucket.cors = [
            {
                "origin": ["*"],
                "method": ["GET", "POST"],
                "responseHeader": ["Content-Type"],
                "maxAgeSeconds": 3600,
            }
        ]
        bucket.patch()

        print(f"GCS bucket '{GCS_BUCKET_NAME}' initialized successfully")
        return GCS_BUCKET_NAME

    except Exception as e:
        print(f"GCS initialization error: {e}")
        return None
