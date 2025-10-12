"""
Client management API endpoints
客戶管理 API 端點
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlmodel import Session, func, or_, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.core.roles import Permission, has_permission
from app.models.client import (
    Client,
    ClientCreate,
    ClientEmailBind,
    ClientResponse,
    ClientStatus,
    ClientUpdate,
    ConsultationRecord,
    ConsultationRecordCreate,
    ConsultationRecordResponse,
    RoomClient,
)
from app.models.room import Room

# from app.models.user import User  # Not needed since using dict from JWT

router = APIRouter(prefix="/api/clients", tags=["clients"])


# Helper function to check counselor permission
def check_counselor_permission(current_user: dict):
    if not has_permission(current_user.get("roles", []), Permission.MANAGE_CLIENTS):
        raise HTTPException(
            status_code=403, detail="Only counselors can perform this action"
        )


@router.get("", response_model=List[ClientResponse])
async def get_my_clients(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
    status: Optional[ClientStatus] = Query(None, description="Filter by client status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
) -> List[ClientResponse]:
    """
    Get all clients for the current counselor
    獲取當前諮商師的所有客戶
    """
    check_counselor_permission(current_user)

    # Build base query - get clients directly by counselor_id
    query = select(Client).where(Client.counselor_id == str(current_user["user_id"]))

    # Apply filters
    if status:
        query = query.where(Client.status == status)

    if search:
        search_filter = or_(
            Client.name.ilike(f"%{search}%"),
            Client.email.ilike(f"%{search}%"),  # type: ignore
        )
        query = query.where(search_filter)

    # Execute query
    clients = session.exec(query).all()

    # Convert to response model with additional data
    responses = []
    for client in clients:
        # Get active rooms count (only for current counselor)
        active_rooms_count = (
            session.exec(
                select(func.count(RoomClient.id))
                .join(Room)
                .where(
                    RoomClient.client_id == client.id,
                    Room.is_active,
                    Room.counselor_id
                    == str(current_user["user_id"]),  # 只計算當前諮詢師的活躍諮詢室
                )
            ).first()
            or 0
        )

        # Get total consultations (sum of session_count from all rooms
        # for current counselor)
        total_consultations = (
            session.exec(
                select(func.sum(Room.session_count))
                .join(RoomClient)
                .where(
                    RoomClient.client_id == client.id,
                    Room.counselor_id
                    == str(current_user["user_id"]),  # 只計算當前諮詢師的諮詢次數
                )
            ).first()
            or 0
        )

        # Get last consultation date
        last_consultation = session.exec(
            select(ConsultationRecord)
            .where(ConsultationRecord.client_id == client.id)
            .order_by(ConsultationRecord.session_date.desc())
        ).first()

        # Get rooms associated with this client (only for current counselor)
        rooms = session.exec(
            select(Room)
            .join(RoomClient)
            .where(
                RoomClient.client_id == client.id,
                Room.counselor_id
                == current_user["user_id"],  # 只顯示當前諮詢師的諮詢室
            )
            .order_by(Room.created_at.desc())
        ).all()

        rooms_data = []
        for room in rooms:
            # Get counselor name from database
            from app.models.user import User

            counselor = session.get(User, room.counselor_id)
            counselor_name = counselor.name if counselor else "諮詢師"

            rooms_data.append(
                {
                    "id": str(room.id),
                    "name": room.name,
                    "description": room.description,
                    "share_code": room.share_code,
                    "is_active": room.is_active,
                    "expires_at": (
                        room.expires_at.isoformat() if room.expires_at else None
                    ),
                    "session_count": room.session_count or 0,
                    "created_at": room.created_at.isoformat(),
                    "last_activity": None,  # TODO: Add from card events if needed
                    "counselor_name": counselor_name,
                }
            )

        # Get default room (first room by created_at)
        default_room = rooms[0] if rooms else None

        response = ClientResponse(
            id=client.id,
            email=client.email,
            name=client.name,
            phone=client.phone,
            notes=client.notes,
            tags=client.tags,
            status=client.status,
            counselor_id=client.counselor_id,
            email_verified=client.email_verified,
            verified_at=client.verified_at,
            created_at=client.created_at,
            updated_at=client.updated_at,
            active_rooms_count=active_rooms_count,
            total_consultations=total_consultations,
            last_consultation_date=(
                last_consultation.session_date if last_consultation else None
            ),
            default_room_id=default_room.id if default_room else None,
            default_room_name=default_room.name if default_room else None,
            rooms=rooms_data,
        )
        responses.append(response)

    return responses


@router.post("", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> ClientResponse:
    """
    Create a new client for the current counselor.
    Each counselor has independent client records.
    創建新客戶 - 每個諮商師有獨立的客戶記錄
    """
    check_counselor_permission(current_user)

    # Check if this counselor already has a client with this email (if email provided)
    if client_data.email:
        existing_client = session.exec(
            select(Client).where(
                Client.counselor_id == str(current_user["user_id"]),
                Client.email == client_data.email,
            )
        ).first()

        if existing_client:
            raise HTTPException(
                status_code=400,
                detail="You already have a client with this email address",
            )

    # Create new client for this counselor
    client = Client(
        counselor_id=str(current_user["user_id"]),
        email=client_data.email,
        name=client_data.name,
        phone=client_data.phone,
        notes=client_data.notes,
        tags=client_data.tags,
        status=ClientStatus.ACTIVE,
        email_verified=False,
    )
    session.add(client)
    session.flush()  # Flush to get client.id without committing

    # Auto-create first room for this client
    client_display_name = client.name or "Anonymous"
    default_room = Room(
        counselor_id=str(current_user["user_id"]),
        name=f"{client_display_name} 的諮詢室",
        description="主要諮詢空間",
        is_active=True,
        expires_at=None,  # Permanent room (no expiration)
    )
    session.add(default_room)
    session.flush()  # Flush to get room.id

    # Create room-client association
    room_client = RoomClient(
        room_id=default_room.id,
        client_id=client.id,
    )
    session.add(room_client)

    # Commit all changes
    session.commit()
    session.refresh(client)
    session.refresh(default_room)

    return ClientResponse(
        id=client.id,
        email=client.email,
        name=client.name,
        phone=client.phone,
        notes=client.notes,
        tags=client.tags,
        status=client.status,
        counselor_id=client.counselor_id,
        email_verified=client.email_verified,
        verified_at=client.verified_at,
        created_at=client.created_at,
        updated_at=client.updated_at,
        active_rooms_count=1,
        total_consultations=0,
        last_consultation_date=None,
        default_room_id=default_room.id,
        default_room_name=default_room.name,
        rooms=[],
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> ClientResponse:
    """
    Get a specific client's details
    獲取特定客戶的詳細資料
    """
    # Get client and check ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check if this client belongs to the current counselor
    if client.counselor_id != str(current_user["user_id"]) and not current_user.get(
        "roles", []
    ).count("admin"):
        raise HTTPException(
            status_code=403, detail="You don't have permission to view this client"
        )

    # Get statistics
    active_rooms_count = (
        session.exec(
            select(func.count(RoomClient.id))
            .join(Room)
            .where(RoomClient.client_id == client.id, Room.is_active)
        ).first()
        or 0
    )

    total_consultations = (
        session.exec(
            select(func.count(ConsultationRecord.id)).where(
                ConsultationRecord.client_id == client.id
            )
        ).first()
        or 0
    )

    last_consultation = session.exec(
        select(ConsultationRecord)
        .where(ConsultationRecord.client_id == client.id)
        .order_by(ConsultationRecord.session_date.desc())
    ).first()

    return ClientResponse(
        id=client.id,
        email=client.email,
        name=client.name,
        phone=client.phone,
        notes=client.notes,
        tags=client.tags,
        status=client.status,
        counselor_id=client.counselor_id,
        email_verified=client.email_verified,
        verified_at=client.verified_at,
        created_at=client.created_at,
        updated_at=client.updated_at,
        active_rooms_count=active_rooms_count,
        total_consultations=total_consultations,
        last_consultation_date=(
            last_consultation.session_date if last_consultation else None
        ),
    )


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    client_update: ClientUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> ClientResponse:
    """
    Update client information
    更新客戶資料
    """
    # Get and check client ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check if this client belongs to the current counselor
    if client.counselor_id != str(current_user["user_id"]) and not current_user.get(
        "roles", []
    ).count("admin"):
        raise HTTPException(
            status_code=403, detail="You don't have permission to update this client"
        )

    # Update fields
    update_data = client_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    client.updated_at = datetime.utcnow()
    session.add(client)
    session.commit()
    session.refresh(client)

    # Get statistics for response
    active_rooms_count = (
        session.exec(
            select(func.count(RoomClient.id))
            .join(Room)
            .where(RoomClient.client_id == client.id, Room.is_active)
        ).first()
        or 0
    )

    total_consultations = (
        session.exec(
            select(func.count(ConsultationRecord.id)).where(
                ConsultationRecord.client_id == client.id
            )
        ).first()
        or 0
    )

    last_consultation = session.exec(
        select(ConsultationRecord)
        .where(ConsultationRecord.client_id == client.id)
        .order_by(ConsultationRecord.session_date.desc())
    ).first()

    return ClientResponse(
        id=client.id,
        email=client.email,
        name=client.name,
        phone=client.phone,
        notes=client.notes,
        tags=client.tags,
        status=client.status,
        counselor_id=client.counselor_id,
        email_verified=client.email_verified,
        verified_at=client.verified_at,
        created_at=client.created_at,
        updated_at=client.updated_at,
        active_rooms_count=active_rooms_count,
        total_consultations=total_consultations,
        last_consultation_date=(
            last_consultation.session_date if last_consultation else None
        ),
    )


@router.post("/{client_id}/bind-email", response_model=ClientResponse)
async def bind_email_to_client(
    client_id: UUID,
    bind_data: ClientEmailBind,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> ClientResponse:
    """
    Bind email to a client without email and optionally send verification
    綁定 Email 到沒有email的客戶並可選發送驗證信
    """
    check_counselor_permission(current_user)

    # Get client and check ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check if this client belongs to the current counselor
    if client.counselor_id != str(current_user["user_id"]):
        raise HTTPException(
            status_code=403, detail="You don't have permission to update this client"
        )

    # Check if client already has email
    if client.email:
        raise HTTPException(
            status_code=400, detail="Client already has an email address"
        )

    # Check if this counselor already has a client with this email
    existing_client = session.exec(
        select(Client).where(
            Client.counselor_id == str(current_user["user_id"]),
            Client.email == bind_data.email,
            Client.id != client_id,
        )
    ).first()

    if existing_client:
        raise HTTPException(
            status_code=400,
            detail="You already have another client with this email address",
        )

    # Update client with email
    client.email = bind_data.email
    client.email_verified = False

    # Generate verification token if sending verification
    if bind_data.send_verification:
        import secrets

        client.verification_token = secrets.token_urlsafe(32)
        # TODO: Send verification email here

    client.updated_at = datetime.utcnow()

    session.add(client)
    session.commit()
    session.refresh(client)

    # Get statistics for response
    active_rooms_count = (
        session.exec(
            select(func.count(RoomClient.id))
            .join(Room)
            .where(
                RoomClient.client_id == client.id,
                Room.is_active,
                Room.counselor_id == str(current_user["user_id"]),
            )
        ).first()
        or 0
    )

    total_consultations = (
        session.exec(
            select(func.sum(Room.session_count))
            .join(RoomClient)
            .where(
                RoomClient.client_id == client.id,
                Room.counselor_id == str(current_user["user_id"]),
            )
        ).first()
        or 0
    )

    last_consultation = session.exec(
        select(ConsultationRecord)
        .where(
            ConsultationRecord.client_id == client.id,
            ConsultationRecord.counselor_id == str(current_user["user_id"]),
        )
        .order_by(ConsultationRecord.session_date.desc())
    ).first()

    return ClientResponse(
        id=client.id,
        email=client.email,
        name=client.name,
        phone=client.phone,
        notes=client.notes,
        tags=client.tags,
        status=client.status,
        counselor_id=client.counselor_id,
        email_verified=client.email_verified,
        verified_at=client.verified_at,
        created_at=client.created_at,
        updated_at=client.updated_at,
        active_rooms_count=active_rooms_count,
        total_consultations=total_consultations,
        last_consultation_date=(
            last_consultation.session_date if last_consultation else None
        ),
    )


@router.delete("/{client_id}")
async def archive_client(
    client_id: UUID,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> dict:
    """
    Archive a client (soft delete)
    歸檔客戶（軟刪除）
    """
    # Get and check client ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check if this client belongs to the current counselor
    if client.counselor_id != str(current_user["user_id"]) and not current_user.get(
        "roles", []
    ).count("admin"):
        raise HTTPException(
            status_code=403,
            detail="Only the counselor or admin can archive a client",
        )

    client.status = ClientStatus.ARCHIVED
    client.updated_at = datetime.utcnow()
    session.add(client)
    session.commit()

    return {"message": "Client archived successfully"}


@router.get("/{client_id}/rooms", response_model=List[dict])
async def get_client_rooms(
    client_id: UUID,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> List[dict]:
    """
    Get all rooms associated with a client
    獲取客戶的所有相關諮詢室
    """
    # Check client ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if client.counselor_id != str(current_user["user_id"]) and not current_user.get(
        "roles", []
    ).count("admin"):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this client's rooms",
        )

    # Get rooms
    rooms = session.exec(
        select(Room)
        .join(RoomClient)
        .where(RoomClient.client_id == client_id)
        .order_by(Room.created_at.desc())
    ).all()

    return [
        {
            "id": str(room.id),
            "name": room.name,
            "description": room.description,
            "is_active": room.is_active,
            "expires_at": room.expires_at.isoformat() if room.expires_at else None,
            "session_count": room.session_count,
            "created_at": room.created_at.isoformat(),
        }
        for room in rooms
    ]


@router.post(
    "/{client_id}/consultation-records", response_model=ConsultationRecordResponse
)
async def create_consultation_record(
    client_id: UUID,
    record_data: ConsultationRecordCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> ConsultationRecordResponse:
    """
    Create a consultation record for a client
    為客戶創建諮詢記錄
    """
    # Verify client exists and check ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check if this client belongs to the current counselor
    counselor_id = current_user.get("user_id")
    if isinstance(counselor_id, str):
        counselor_id = UUID(counselor_id)

    if client.counselor_id != counselor_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to add records for this client",
        )

    # Create record
    record = ConsultationRecord(
        **record_data.dict(),
        client_id=client_id,
        counselor_id=counselor_id,
    )
    session.add(record)
    session.commit()
    session.refresh(record)

    return ConsultationRecordResponse(**record.dict())


@router.get(
    "/{client_id}/consultation-records", response_model=List[ConsultationRecordResponse]
)
async def get_consultation_records(
    client_id: UUID,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> List[ConsultationRecordResponse]:
    """
    Get consultation records for a client
    獲取客戶的諮詢記錄
    """
    # Check client ownership
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    counselor_id = current_user.get("user_id")
    if isinstance(counselor_id, str):
        counselor_id = UUID(counselor_id)

    if client.counselor_id != counselor_id and not current_user.get(
        "roles", []
    ).count("admin"):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this client's records",
        )

    # Get records
    records = session.exec(
        select(ConsultationRecord)
        .where(ConsultationRecord.client_id == client_id)
        .order_by(ConsultationRecord.session_date.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return [ConsultationRecordResponse(**record.dict()) for record in records]


@router.post("/consultation-records/{record_id}/screenshots")
async def upload_consultation_screenshot(
    record_id: UUID,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
):
    """
    Upload screenshot for a consultation record
    上傳諮詢記錄的截圖到 GCS
    """
    # Verify record exists and check ownership
    record = session.get(ConsultationRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Consultation record not found")

    # Check if this record belongs to the current counselor
    if record.counselor_id != str(current_user["user_id"]):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to upload screenshots for this record",
        )

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )

    # Upload to GCS
    from app.services.storage import upload_screenshot

    public_url = await upload_screenshot(
        file=file,
        counselor_id=UUID(current_user["user_id"]),
        record_id=record_id
    )

    # Update record with new screenshot URL
    record.screenshots = record.screenshots + [public_url]
    record.updated_at = datetime.utcnow()
    session.add(record)
    session.commit()

    return {
        "url": public_url,
        "record_id": record_id,
        "total_screenshots": len(record.screenshots)
    }
