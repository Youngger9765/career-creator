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
from app.core.auth import get_current_user_from_token, DEMO_ACCOUNTS
from app.models.room import Room, RoomCreate, RoomResponse
from app.models.user import User

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def get_current_user_id(user_id: Optional[str] = Header(default=None, alias="user-id")) -> UUID:
    """Mock authentication - get user ID from header (fallback for testing)"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        return UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID")


def get_current_user_info(
    current_user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session)
) -> dict:
    """Get current user information from JWT token or fallback to header"""
    user_id = current_user["user_id"]
    
    # Handle demo accounts
    if user_id.startswith("demo-"):
        demo_account = next((acc for acc in DEMO_ACCOUNTS if acc["id"] == user_id), None)
        if demo_account:
            return {
                "id": user_id,
                "email": demo_account["email"],
                "roles": demo_account["roles"],
                "is_active": True
            }
    
    # Regular database user
    try:
        user_uuid = UUID(user_id)
        user = session.get(User, user_uuid)
        if user:
            return {
                "id": str(user.id),
                "email": user.email,
                "roles": user.roles,
                "is_active": user.is_active
            }
    except ValueError:
        pass
    
    raise HTTPException(status_code=404, detail="User not found")


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
    current_user: dict = Depends(get_current_user_info)
):
    """Create new room - only counselors can create rooms"""
    
    if not has_permission(current_user["roles"], Permission.CREATE_ROOM):
        raise HTTPException(
            status_code=403, 
            detail="Only counselors can create rooms"
        )
    
    # Create room
    room = Room(
        name=room_data.name,
        description=room_data.description,
        counselor_id=current_user["id"]
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
    current_user: dict = Depends(get_current_user_info)
):
    """List rooms where user is counselor"""
    
    statement = select(Room).where(Room.counselor_id == current_user["id"])
    rooms = session.exec(statement).all()
    
    return rooms


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: UUID,
    room_data: RoomCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_info)
):
    """Update room - only room owner can update"""
    
    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check ownership or admin permission
    if room.counselor_id != current_user["id"] and "admin" not in current_user["roles"]:
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
    current_user: dict = Depends(get_current_user_info)
):
    """Delete room - only room owner or admin can delete"""
    
    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check ownership or admin permission
    if room.counselor_id != current_user["id"] and "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=403, 
            detail="Only room owner or admin can delete room"
        )
    
    # Soft delete - mark as inactive
    room.is_active = False
    session.add(room)
    session.commit()
    
    return {"message": "Room deleted successfully"}