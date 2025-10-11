"""
GCS Storage Service
Google Cloud Storage 文件上傳服務
"""

from typing import BinaryIO
from uuid import UUID, uuid4

from fastapi import UploadFile


async def upload_screenshot(
    file: UploadFile,
    counselor_id: UUID,
    record_id: UUID,
) -> str:
    """
    Upload screenshot to Google Cloud Storage

    Args:
        file: File to upload
        counselor_id: Counselor ID for organizing files
        record_id: Consultation record ID

    Returns:
        str: Public URL of uploaded file

    TODO: Implement actual GCS upload
    Currently returns mock URL for development
    """
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename else "png"
    unique_filename = f"{uuid4()}.{file_extension}"

    # Construct file path in bucket
    file_path = f"screenshots/{counselor_id}/{record_id}/{unique_filename}"

    # TODO: Implement actual GCS upload
    # from google.cloud import storage
    # client = storage.Client()
    # bucket = client.bucket("career-creator-screenshots")
    # blob = bucket.blob(file_path)
    # blob.upload_from_file(file.file, content_type=file.content_type)
    # blob.make_public()
    # return blob.public_url

    # Mock URL for development
    mock_url = f"https://storage.googleapis.com/career-creator-screenshots/{file_path}"

    return mock_url


async def upload_to_gcs(
    file_content: BinaryIO,
    file_path: str,
    content_type: str = "image/png"
) -> str:
    """
    Generic upload to GCS

    Args:
        file_content: File content as binary stream
        file_path: Path in bucket
        content_type: MIME type

    Returns:
        str: Public URL of uploaded file

    TODO: Implement actual GCS upload
    """
    # TODO: Implement actual GCS upload
    # from google.cloud import storage
    # client = storage.Client()
    # bucket = client.bucket("career-creator-screenshots")
    # blob = bucket.blob(file_path)
    # blob.upload_from_file(file_content, content_type=content_type)
    # blob.make_public()
    # return blob.public_url

    # Mock URL for development
    mock_url = f"https://storage.googleapis.com/career-creator-screenshots/{file_path}"

    return mock_url
