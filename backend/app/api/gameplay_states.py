"""Gameplay states API endpoints."""

from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.models.gameplay_state import (
    GameplayState,
    GameplayStateResponse,
    GameplayStateUpdate,
    RoomGameplayStatesResponse,
)
from app.models.room import Room

router = APIRouter()


def verify_room_access(room_id: UUID, user: dict, session: Session) -> Room:
    """Verify user has access to the room."""
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Only counselor who owns the room can access
    user_id = user.get("user_id")
    if str(room.counselor_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this room",
        )

    return room


@router.get(
    "/rooms/{room_id}/gameplay-states",
    response_model=RoomGameplayStatesResponse,
)
def get_room_gameplay_states(
    room_id: UUID,
    user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
):
    """Get all gameplay states for a room with summary statistics."""
    verify_room_access(room_id, user, session)

    # Get all gameplay states for this room
    statement = (
        select(GameplayState)
        .where(GameplayState.room_id == room_id)
        .order_by(GameplayState.last_played_at.desc())
    )
    states = session.exec(statement).all()

    # Build summary
    summary: Dict[str, Any] = {
        "total_gameplays_played": len(states),
        "most_recent_gameplay": states[0].gameplay_id if states else None,
        "last_played_at": states[0].last_played_at.isoformat() if states else None,
    }

    return RoomGameplayStatesResponse(
        states=[GameplayStateResponse.model_validate(s) for s in states],
        summary=summary,
    )


@router.get(
    "/rooms/{room_id}/gameplay-states/{gameplay_id}",
    response_model=GameplayStateResponse,
)
def get_gameplay_state(
    room_id: UUID,
    gameplay_id: str,
    user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
):
    """Get specific gameplay state."""
    verify_room_access(room_id, user, session)

    statement = select(GameplayState).where(
        GameplayState.room_id == room_id,
        GameplayState.gameplay_id == gameplay_id,
    )
    gameplay_state = session.exec(statement).first()

    if not gameplay_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gameplay state not found for {gameplay_id}",
        )

    return GameplayStateResponse.model_validate(gameplay_state)


@router.put(
    "/rooms/{room_id}/gameplay-states/{gameplay_id}",
    response_model=GameplayStateResponse,
)
def upsert_gameplay_state(
    room_id: UUID,
    gameplay_id: str,
    state_update: GameplayStateUpdate,
    user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
):
    """Create or update gameplay state (upsert)."""
    verify_room_access(room_id, user, session)

    # Try to find existing state
    statement = select(GameplayState).where(
        GameplayState.room_id == room_id,
        GameplayState.gameplay_id == gameplay_id,
    )
    gameplay_state = session.exec(statement).first()

    now = datetime.utcnow()

    if gameplay_state:
        # Update existing
        gameplay_state.state = state_update.state
        gameplay_state.last_played_at = now
        gameplay_state.updated_at = now
    else:
        # Create new
        gameplay_state = GameplayState(
            room_id=room_id,
            gameplay_id=gameplay_id,
            state=state_update.state,
            last_played_at=now,
            created_at=now,
            updated_at=now,
        )
        session.add(gameplay_state)

    try:
        session.commit()
        session.refresh(gameplay_state)
    except IntegrityError as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save gameplay state: {str(e)}",
        )

    return GameplayStateResponse.model_validate(gameplay_state)


@router.delete("/rooms/{room_id}/gameplay-states/{gameplay_id}")
def delete_gameplay_state(
    room_id: UUID,
    gameplay_id: str,
    user: dict = Depends(get_current_user_from_token),
    session: Session = Depends(get_session),
):
    """Delete specific gameplay state."""
    verify_room_access(room_id, user, session)

    statement = select(GameplayState).where(
        GameplayState.room_id == room_id,
        GameplayState.gameplay_id == gameplay_id,
    )
    gameplay_state = session.exec(statement).first()

    if not gameplay_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gameplay state not found for {gameplay_id}",
        )

    session.delete(gameplay_state)
    session.commit()

    return {"success": True, "message": "Gameplay state deleted"}
