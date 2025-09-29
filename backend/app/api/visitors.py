"""
Visitor API endpoints
訪客 API - 匿名用戶加入諮詢室
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.room import Room
from app.models.visitor import (
    Visitor,
    VisitorJoinRequest,
    VisitorResponse,
    VisitorUpdate,
)

router = APIRouter(prefix="/api/visitors", tags=["visitors"])


@router.post("/join-room/{share_code}", response_model=VisitorResponse, status_code=201)
def join_room_as_visitor(
    share_code: str,
    visitor_data: VisitorJoinRequest,
    session: Session = Depends(get_session),
):
    """Join room as anonymous visitor using share code"""

    # Find room by share code
    statement = select(Room).where(Room.share_code == share_code, Room.is_active)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found or inactive")

    # Check if session already exists (rejoin scenario)
    existing_visitor = session.exec(
        select(Visitor).where(
            Visitor.session_id == visitor_data.session_id,
            Visitor.room_id == room.id,
            Visitor.is_active,
        )
    ).first()

    if existing_visitor:
        # Update last seen and return existing visitor
        existing_visitor.last_seen = (
            visitor_data.last_seen
            if hasattr(visitor_data, "last_seen")
            else existing_visitor.last_seen
        )
        session.add(existing_visitor)
        session.commit()
        session.refresh(existing_visitor)
        return existing_visitor

    # Create new visitor
    visitor = Visitor(
        name=visitor_data.name, room_id=room.id, session_id=visitor_data.session_id
    )

    session.add(visitor)
    session.commit()
    session.refresh(visitor)

    return visitor


@router.get("/room/{room_id}", response_model=List[VisitorResponse])
def list_room_visitors(room_id: UUID, session: Session = Depends(get_session)):
    """List all active visitors in a room"""

    # Verify room exists
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get active visitors
    statement = (
        select(Visitor)
        .where(Visitor.room_id == room_id, Visitor.is_active)
        .order_by(Visitor.joined_at)
    )

    visitors = session.exec(statement).all()
    return visitors


@router.put("/{visitor_id}/heartbeat", response_model=VisitorResponse)
def visitor_heartbeat(
    visitor_id: UUID,
    update_data: VisitorUpdate,
    session: Session = Depends(get_session),
):
    """Update visitor's last seen timestamp (heartbeat)"""

    visitor = session.get(Visitor, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    if not visitor.is_active:
        raise HTTPException(status_code=400, detail="Visitor is inactive")

    # Update last seen
    visitor.last_seen = update_data.last_seen

    session.add(visitor)
    session.commit()
    session.refresh(visitor)

    return visitor


@router.delete("/{visitor_id}")
def leave_room(visitor_id: UUID, session: Session = Depends(get_session)):
    """Leave room (mark visitor as inactive)"""

    visitor = session.get(Visitor, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    # Soft delete - mark as inactive
    visitor.is_active = False
    session.add(visitor)
    session.commit()

    return {"message": "Left room successfully"}


@router.get("/{visitor_id}", response_model=VisitorResponse)
def get_visitor(visitor_id: UUID, session: Session = Depends(get_session)):
    """Get visitor information"""

    visitor = session.get(Visitor, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    return visitor
