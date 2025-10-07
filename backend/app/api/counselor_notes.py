"""Counselor notes API endpoints."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token as get_current_user
from app.core.database import get_session
from app.models.counselor_note import (
    CounselorNote,
    CounselorNoteResponse,
    CounselorNoteUpdate,
)
from app.models.room import Room
from app.models.user import User

router = APIRouter(prefix="/rooms/{room_id}/notes", tags=["counselor-notes"])


@router.get("", response_model=CounselorNoteResponse)
def get_room_note(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session),
):
    """Get counselor note for a room (only for room's counselor)."""

    # Check room exists and user is the counselor
    statement = select(Room).where(Room.id == room_id)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    if room.counselor_id != UUID(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room counselor can access notes",
        )

    # Get or create note
    statement = select(CounselorNote).where(CounselorNote.room_id == room_id)
    note = session.exec(statement).first()

    if not note:
        # Create empty note
        note = CounselorNote(room_id=room_id, content="")
        session.add(note)
        session.commit()
        session.refresh(note)

    return note


@router.put("", response_model=CounselorNoteResponse)
def update_room_note(
    room_id: UUID,
    note_update: CounselorNoteUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session),
):
    """Update counselor note for a room."""

    # Check room exists and user is the counselor
    statement = select(Room).where(Room.id == room_id)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    if room.counselor_id != UUID(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room counselor can update notes",
        )

    # Get or create note
    statement = select(CounselorNote).where(CounselorNote.room_id == room_id)
    note = session.exec(statement).first()

    if not note:
        note = CounselorNote(room_id=room_id, content=note_update.content)
        session.add(note)
    else:
        note.content = note_update.content
        note.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(note)

    return note
