"""
Room API endpoints
諮詢室管理 API
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.core.roles import Permission, has_permission
from app.models.client import Client, RoomClient
from app.models.room import Room, RoomCreate, RoomResponse
from app.models.user import User

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def get_current_user_id(
    user_id: Optional[str] = Header(default=None, alias="user-id")
) -> UUID:
    """Mock authentication - get user ID from header (fallback for testing)"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        return UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID")


def get_current_user_info(
    current_user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
) -> dict:
    """Get current user information from JWT token"""
    user_id = current_user["user_id"]

    # All users (including demo accounts) are now in the database
    try:
        user_uuid = UUID(user_id)
        user = session.get(User, user_uuid)
        if user:
            return {
                "id": user.id,  # Return UUID directly
                "email": user.email,
                "roles": user.roles,
                "is_active": user.is_active,
            }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

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
    current_user: dict = Depends(get_current_user_info),
):
    """Create new room - only counselors can create rooms"""

    if not has_permission(current_user["roles"], Permission.CREATE_ROOM):
        raise HTTPException(status_code=403, detail="Only counselors can create rooms")

    # 如果指定了遊戲規則，查找對應的模板
    game_rule_id = None
    if hasattr(room_data, "game_rule_slug") and room_data.game_rule_slug:
        from sqlmodel import select

        from app.models.game_rule import GameRuleTemplate

        # 查找遊戲規則模板
        statement = select(GameRuleTemplate).where(
            GameRuleTemplate.slug == room_data.game_rule_slug,
            GameRuleTemplate.is_active.is_(True),
        )
        game_rule = session.exec(statement).first()

        if not game_rule:
            # 如果沒有找到，嘗試使用預設配置
            from app.game.config import GameRuleConfig

            # 根據 slug 創建預設規則
            if room_data.game_rule_slug == "skill_assessment":
                config = GameRuleConfig.get_skill_assessment_config()
            elif room_data.game_rule_slug == "value_navigation":
                config = GameRuleConfig.get_value_navigation_config()
            elif room_data.game_rule_slug == "career_personality":
                config = GameRuleConfig.get_career_personality_config()
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown game rule: {room_data.game_rule_slug}",
                )

            # 創建新的遊戲規則模板
            game_rule = GameRuleTemplate(
                slug=config.id,
                name=config.name,
                description=f"預設{config.name}規則",
                version=config.version,
                layout_config=config.layout.to_dict(),
                constraint_config=config.constraints.to_dict(),
                validation_rules={},
                is_active=True,
            )
            session.add(game_rule)
            session.commit()
            session.refresh(game_rule)

        game_rule_id = game_rule.id

    # Create room (current_user["id"] is now UUID)
    room = Room(
        name=room_data.name,
        description=room_data.description,
        counselor_id=current_user["id"],
        game_rule_id=game_rule_id,
        expires_at=room_data.expires_at,
    )

    session.add(room)
    session.commit()
    session.refresh(room)

    # Link room to client if client_id provided
    client_id_to_return = None
    client_name_to_return = None
    if room_data.client_id:
        from app.models.client import Client, RoomClient

        # Verify client exists
        client = session.get(Client, room_data.client_id)
        if client:
            room_client = RoomClient(room_id=room.id, client_id=room_data.client_id)
            session.add(room_client)
            session.commit()
            client_id_to_return = room_data.client_id
            client_name_to_return = client.name

    # Return room with client information
    room_dict = room.model_dump()
    if client_id_to_return:
        room_dict["client_id"] = client_id_to_return
        room_dict["client_name"] = client_name_to_return

    return room_dict


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: UUID, session: Session = Depends(get_session)):
    """Get room by ID"""
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get associated client_id if exists
    room_dict = room.model_dump()
    statement = select(RoomClient).where(RoomClient.room_id == room_id)
    room_client = session.exec(statement).first()

    if room_client:
        room_dict["client_id"] = room_client.client_id
        # Also fetch client name
        client = session.get(Client, room_client.client_id)
        if client:
            room_dict["client_name"] = client.name

    return room_dict


@router.get("/by-code/{share_code}", response_model=RoomResponse)
def get_room_by_share_code(share_code: str, session: Session = Depends(get_session)):
    """Get room by share code"""
    statement = select(Room).where(Room.share_code == share_code)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get associated client_id if exists
    room_dict = room.model_dump()
    statement = select(RoomClient).where(RoomClient.room_id == room.id)
    room_client = session.exec(statement).first()

    if room_client:
        room_dict["client_id"] = room_client.client_id
        # Also fetch client name
        client = session.get(Client, room_client.client_id)
        if client:
            room_dict["client_name"] = client.name

    return room_dict


@router.get("/", response_model=List[RoomResponse])
def list_user_rooms(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_info),
    include_inactive: Optional[bool] = False,
):
    """List rooms where user is counselor, optionally include inactive rooms"""

    # Get all rooms (active and inactive) with client information
    statement = (
        select(Room, Client.name.label("client_name"))
        .select_from(Room)
        .outerjoin(RoomClient, Room.id == RoomClient.room_id)
        .outerjoin(Client, RoomClient.client_id == Client.id)
        .where(Room.counselor_id == current_user["id"])
    )

    # Filter by active status if requested
    if not include_inactive:
        statement = statement.where(Room.is_active)

    results = session.exec(statement).all()

    # Convert to response format
    rooms = []
    for room, client_name in results:
        room_dict = room.model_dump()
        if client_name:
            room_dict["primary_client_name"] = client_name

        # DEBUG: Print to console
        print(f"DEBUG: Room '{room.name}' - client_name from query: '{client_name}'")

        # Add counselor name by looking up in database
        counselor = session.get(User, room.counselor_id)
        room_dict["counselor_name"] = counselor.name if counselor else "諮詢師"

        rooms.append(room_dict)

    return rooms


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: UUID,
    room_data: RoomCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_info),
):
    """Update room - only room owner can update"""

    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check ownership or admin permission
    if room.counselor_id != current_user["id"] and "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=403, detail="Only room owner or admin can update room"
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
    current_user: dict = Depends(get_current_user_info),
):
    """Delete room - only room owner or admin can delete"""

    # Get room
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check ownership or admin permission
    if room.counselor_id != current_user["id"] and "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=403, detail="Only room owner or admin can delete room"
        )

    # Soft delete - mark as inactive
    room.is_active = False
    session.add(room)
    session.commit()

    return {"message": "Room deleted successfully"}


@router.post("/{room_id}/restore")
def restore_room(
    room_id: UUID,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_info),
):
    """Restore deleted room - only room owner or admin can restore"""

    # Get room (including deleted ones)
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check ownership or admin permission
    if room.counselor_id != current_user["id"] and "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=403, detail="Only room owner or admin can restore room"
        )

    # Check if room is already active
    if room.is_active:
        raise HTTPException(status_code=400, detail="Room is already active")

    # Restore room - mark as active
    room.is_active = True
    session.add(room)
    session.commit()
    session.refresh(room)

    return room
