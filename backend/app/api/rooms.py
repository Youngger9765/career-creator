"""
Room API endpoints
房間管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_session
from app.core.roles import UserRole, has_permission, Permission
from app.models.room import Room, RoomCreate, RoomResponse
from app.models.user import User

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def get_current_user_id(user_id: Optional[str] = Header(default=None, alias="user-id")) -> UUID:
    """Mock authentication - get user ID from header"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        return UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID")


def verify_user_exists(user_id: UUID, session: Session) -> User:
    """Verify user exists and return user object"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return user


@router.post("/", response_model=RoomResponse, status_code=201)
def create_room(
    room_data: RoomCreate,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Create new room - only counselors can create rooms"""
    
    # Verify user exists and has permission
    user = verify_user_exists(current_user_id, session)
    
    if not has_permission(user.roles, Permission.CREATE_ROOM):
        raise HTTPException(
            status_code=403, 
            detail="Only counselors can create rooms"
        )
    
    # Create room
    room = Room(
        name=room_data.name,
        description=room_data.description,
        counselor_id=current_user_id
    )
    
    session.add(room)
    session.commit()
    session.refresh(room)
    
    return room


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: UUID,
    session: Session = Depends(get_session)
):
    """Get room by ID"""
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return room


@router.get("/by-code/{share_code}", response_model=RoomResponse)
def get_room_by_share_code(
    share_code: str,
    session: Session = Depends(get_session)
):
    """Get room by share code"""
    statement = select(Room).where(Room.share_code == share_code)
    room = session.exec(statement).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return room


@router.get("/", response_model=List[RoomResponse])
def list_user_rooms(
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """List rooms where user is counselor"""
    
    # Verify user exists
    verify_user_exists(current_user_id, session)
    
    statement = select(Room).where(Room.counselor_id == current_user_id)
    rooms = session.exec(statement).all()
    
    return rooms


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: UUID,
    room_data: RoomCreate,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Update room - only room owner can update"""
    
    # Verify user exists
    user = verify_user_exists(current_user_id, session)
    
    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check ownership or admin permission
    if room.counselor_id != current_user_id and not user.has_role(UserRole.ADMIN):
        raise HTTPException(
            status_code=403, 
            detail="Only room owner or admin can update room"
        )
    
    # Update room
    room.name = room_data.name
    room.description = room_data.description
    
    session.add(room)
    session.commit()
    session.refresh(room)
    
    return room


@router.delete("/{room_id}")
def delete_room(
    room_id: UUID,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Delete room - only room owner or admin can delete"""
    
    # Verify user exists
    user = verify_user_exists(current_user_id, session)
    
    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check ownership or admin permission
    if room.counselor_id != current_user_id and not user.has_role(UserRole.ADMIN):
        raise HTTPException(
            status_code=403, 
            detail="Only room owner or admin can delete room"
        )
    
    # Soft delete - mark as inactive
    room.is_active = False
    session.add(room)
    session.commit()
    
    return {"message": "Room deleted successfully"}