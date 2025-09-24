"""
Client management API endpoints
客戶管理 API 端點
"""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, or_, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.core.roles import Permission, has_permission
from app.models.client import (
    Client,
    ClientCreate,
    ClientResponse,
    ClientStatus,
    ClientUpdate,
    ConsultationRecord,
    ConsultationRecordCreate,
    ConsultationRecordResponse,
    CounselorClientRelationship,
    CounselorClientRelationshipResponse,
    RelationshipStatus,
    RelationshipType,
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

    # Build base query - get clients through relationships
    query = (
        select(Client)
        .join(CounselorClientRelationship)
        .where(CounselorClientRelationship.counselor_id == current_user["user_id"])
    )

    # Apply filters
    if status:
        query = query.where(Client.status == status)

    if search:
        search_filter = or_(
            Client.name.ilike(f"%{search}%"), Client.email.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    # Execute query
    clients = session.exec(query).all()

    # Convert to response model with additional data
    responses = []
    for client in clients:
        # Get active rooms count
        active_rooms_count = (
            session.exec(
                select(func.count(RoomClient.id))
                .join(Room)
                .where(RoomClient.client_id == client.id, Room.is_active)
            ).first()
            or 0
        )

        # Get total consultations
        total_consultations = (
            session.exec(
                select(func.count(ConsultationRecord.id)).where(
                    ConsultationRecord.client_id == client.id
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

        response = ClientResponse(
            **client.dict(),
            active_rooms_count=active_rooms_count,
            total_consultations=total_consultations,
            last_consultation_date=(
                last_consultation.session_date if last_consultation else None
            ),
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
    Create a new client and establish relationship with counselor
    創建新客戶並建立與諮商師的關係
    """
    check_counselor_permission(current_user)

    # Check if client already exists
    existing_client = session.exec(
        select(Client).where(Client.email == client_data.email)
    ).first()

    if existing_client:
        # Check if relationship already exists
        existing_rel = session.exec(
            select(CounselorClientRelationship).where(
                CounselorClientRelationship.counselor_id == current_user["user_id"],
                CounselorClientRelationship.client_id == existing_client.id,
            )
        ).first()

        if existing_rel:
            raise HTTPException(
                status_code=400,
                detail="You already have a relationship with this client",
            )

        # Create new relationship with existing client
        relationship = CounselorClientRelationship(
            counselor_id=current_user["user_id"],
            client_id=existing_client.id,
            relationship_type=RelationshipType.PRIMARY,
            status=RelationshipStatus.ACTIVE,
            start_date=date.today(),
        )
        session.add(relationship)
        session.commit()

        client = existing_client
    else:
        # Create new client
        client = Client(**client_data.dict())
        session.add(client)
        session.commit()
        session.refresh(client)

        # Create relationship
        relationship = CounselorClientRelationship(
            counselor_id=current_user["user_id"],
            client_id=client.id,
            relationship_type=RelationshipType.PRIMARY,
            status=RelationshipStatus.ACTIVE,
            start_date=date.today(),
        )
        session.add(relationship)
        session.commit()

    return ClientResponse(
        **client.dict(),
        active_rooms_count=0,
        total_consultations=0,
        last_consultation_date=None,
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
    # Check if user has relationship with this client
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
        )
    ).first()

    if not relationship and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=403, detail="You don't have permission to view this client"
        )

    # Get client
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

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
        **client.dict(),
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
    # Check if user has relationship with this client
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
        )
    ).first()

    if not relationship and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=403, detail="You don't have permission to update this client"
        )

    # Get and update client
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

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
        **client.dict(),
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
    # Check if user has relationship with this client
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
            CounselorClientRelationship.relationship_type == RelationshipType.PRIMARY,
        )
    ).first()

    if not relationship and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=403,
            detail="Only primary counselor or admin can archive a client",
        )

    # Get and archive client
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

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
    獲取客戶的所有相關房間
    """
    # Check permission
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
        )
    ).first()

    if not relationship and not current_user.has_role("admin"):
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
    # Verify client exists
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check permission
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
        )
    ).first()

    if not relationship:
        raise HTTPException(
            status_code=403, detail="You don't have a relationship with this client"
        )

    # Create record
    record = ConsultationRecord(
        **record_data.dict(), client_id=client_id, counselor_id=current_user["user_id"]
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
    # Check permission
    relationship = session.exec(
        select(CounselorClientRelationship).where(
            CounselorClientRelationship.counselor_id == current_user["user_id"],
            CounselorClientRelationship.client_id == client_id,
        )
    ).first()

    if not relationship and not current_user.has_role("admin"):
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


# Counselor-Client Relationships endpoints


@router.get("/relationships", response_model=List[CounselorClientRelationshipResponse])
async def get_my_relationships(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
    status: Optional[RelationshipStatus] = Query(None),
) -> List[CounselorClientRelationshipResponse]:
    """
    Get all client relationships for current counselor
    獲取當前諮商師的所有客戶關係
    """
    query = select(CounselorClientRelationship).where(
        CounselorClientRelationship.counselor_id == current_user["user_id"]
    )

    if status:
        query = query.where(CounselorClientRelationship.status == status)

    relationships = session.exec(query).all()

    responses = []
    for rel in relationships:
        client = session.get(Client, rel.client_id)

        # Get client statistics
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

        client_response = ClientResponse(
            **client.dict(),
            active_rooms_count=active_rooms_count,
            total_consultations=total_consultations,
            last_consultation_date=(
                last_consultation.session_date if last_consultation else None
            ),
        )

        response = CounselorClientRelationshipResponse(
            **rel.dict(), client=client_response
        )
        responses.append(response)

    return responses


@router.put("/relationships/{relationship_id}")
async def update_relationship(
    relationship_id: UUID,
    status: RelationshipStatus,
    notes: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
) -> dict:
    """
    Update relationship status
    更新關係狀態
    """
    relationship = session.get(CounselorClientRelationship, relationship_id)

    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")

    if relationship.counselor_id != current_user[
        "user_id"
    ] and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=403, detail="You can only update your own relationships"
        )

    relationship.status = status
    if notes:
        relationship.notes = notes
    if status == RelationshipStatus.TERMINATED:
        relationship.end_date = date.today()

    relationship.updated_at = datetime.utcnow()
    session.add(relationship)
    session.commit()

    return {"message": "Relationship updated successfully"}
