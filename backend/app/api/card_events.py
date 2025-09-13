"""
CardEvent API endpoints
卡牌事件 API - 追蹤和管理卡牌操作事件
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, and_, desc
from uuid import UUID
from typing import List, Optional

from app.core.database import get_session
from app.models.card_event import (
    CardEvent, CardEventCreate, CardEventResponse, CardEventType, CardEventQuery
)
from app.models.room import Room

router = APIRouter(prefix="/api/card-events", tags=["card-events"])


@router.post("/", response_model=CardEventResponse, status_code=201)
def create_card_event(
    event_data: CardEventCreate,
    session: Session = Depends(get_session)
):
    """Create new card event"""
    
    # Verify room exists
    room = session.get(Room, event_data.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if not room.is_active:
        raise HTTPException(status_code=400, detail="Room is inactive")
    
    # Get next sequence number for this room
    last_event = session.exec(
        select(CardEvent)
        .where(CardEvent.room_id == event_data.room_id)
        .order_by(desc(CardEvent.sequence_number))
    ).first()
    
    next_sequence = (last_event.sequence_number + 1) if last_event else 1
    
    # Create event
    card_event = CardEvent(
        room_id=event_data.room_id,
        event_type=event_data.event_type,
        card_id=event_data.card_id,
        event_data=event_data.event_data,
        notes=event_data.notes,
        performer_id=event_data.performer_id,
        performer_type=event_data.performer_type,
        performer_name=event_data.performer_name,
        sequence_number=next_sequence
    )
    
    session.add(card_event)
    session.commit()
    session.refresh(card_event)
    
    return card_event


@router.get("/room/{room_id}", response_model=List[CardEventResponse])
def get_room_events(
    room_id: UUID,
    event_type: Optional[CardEventType] = Query(None),
    performer_id: Optional[str] = Query(None),
    from_sequence: Optional[int] = Query(None),
    to_sequence: Optional[int] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """Get card events for a room with optional filtering"""
    
    # Verify room exists
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Build query
    query = select(CardEvent).where(CardEvent.room_id == room_id)
    
    # Apply filters
    if event_type:
        query = query.where(CardEvent.event_type == event_type)
    
    if performer_id:
        query = query.where(CardEvent.performer_id == performer_id)
    
    # Note: from_sequence and to_sequence are deprecated
    # TODO: Remove these parameters in future version
    
    # Order by created_at and id for consistent ordering
    query = query.order_by(CardEvent.created_at, CardEvent.id).offset(offset).limit(limit)
    
    events = session.exec(query).all()
    return events


@router.get("/room/{room_id}/latest", response_model=List[CardEventResponse])
def get_latest_room_events(
    room_id: UUID,
    limit: int = Query(50, le=100),
    session: Session = Depends(get_session)
):
    """Get latest card events for a room"""
    
    # Verify room exists
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Get latest events
    query = (
        select(CardEvent)
        .where(CardEvent.room_id == room_id)
        .order_by(desc(CardEvent.created_at), desc(CardEvent.id))
        .limit(limit)
    )
    
    events = session.exec(query).all()
    
    # Reverse to get chronological order (oldest first)
    return list(reversed(events))


@router.get("/room/{room_id}/summary")
def get_room_event_summary(
    room_id: UUID,
    session: Session = Depends(get_session)
):
    """Get summary statistics of events for a room"""
    
    # Verify room exists
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Count events by type
    event_counts = {}
    for event_type in CardEventType:
        count = session.exec(
            select(CardEvent)
            .where(and_(
                CardEvent.room_id == room_id,
                CardEvent.event_type == event_type
            ))
        ).all()
        event_counts[event_type.value] = len(count)
    
    # Get total event count
    total_events = session.exec(
        select(CardEvent).where(CardEvent.room_id == room_id)
    ).all()
    
    # Get unique performers
    performers = session.exec(
        select(CardEvent.performer_id, CardEvent.performer_name, CardEvent.performer_type)
        .where(CardEvent.room_id == room_id)
        .distinct()
    ).all()
    
    unique_performers = []
    seen = set()
    for performer_id, performer_name, performer_type in performers:
        if performer_id and performer_id not in seen:
            unique_performers.append({
                "id": performer_id,
                "name": performer_name,
                "type": performer_type
            })
            seen.add(performer_id)
    
    return {
        "room_id": str(room_id),
        "total_events": len(total_events),
        "event_counts_by_type": event_counts,
        "unique_performers": unique_performers,
        "latest_sequence": max([e.sequence_number for e in total_events]) if total_events else 0
    }


@router.get("/{event_id}", response_model=CardEventResponse)
def get_card_event(
    event_id: UUID,
    session: Session = Depends(get_session)
):
    """Get specific card event by ID"""
    
    event = session.get(CardEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Card event not found")
    
    return event


@router.delete("/{event_id}")
def delete_card_event(
    event_id: UUID,
    session: Session = Depends(get_session)
):
    """Delete card event (admin only)"""
    
    event = session.get(CardEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Card event not found")
    
    session.delete(event)
    session.commit()
    
    return {"message": "Card event deleted successfully"}