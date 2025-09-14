"""
Game Session API endpoints
遊戲會話 API
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.game.config import GameRuleConfig
from app.game.engine import ActionType, GameAction, GameEngine, GameState
from app.models.game_rule import GameRuleTemplate
from app.models.game_state import (
    GameActionRecord,
    GameActionRequest,
    GameActionResponse,
    GameSession,
    GameSessionCreate,
    GameSessionResponse,
    GameStatus,
)
from app.models.room import Room

router = APIRouter(prefix="/api/game-sessions", tags=["game-sessions"])


@router.post("/", response_model=GameSessionResponse, status_code=201)
def create_game_session(
    session_data: GameSessionCreate,
    db_session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
):
    """創建新的遊戲會話"""

    # 獲取房間
    room = db_session.get(Room, session_data.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # 檢查是否為房主
    if str(room.counselor_id) != current_user["user_id"]:
        raise HTTPException(
            status_code=403, detail="Only room owner can create game session"
        )

    # 檢查是否已有進行中的遊戲
    existing_session = db_session.exec(
        select(GameSession).where(
            GameSession.room_id == session_data.room_id,
            GameSession.status.in_([GameStatus.WAITING.value, GameStatus.IN_PROGRESS.value]),
        )
    ).first()

    if existing_session:
        raise HTTPException(
            status_code=400, detail="Room already has an active game session"
        )

    # 獲取遊戲規則
    if not room.game_rule_id:
        raise HTTPException(
            status_code=400, detail="Room must have a game rule selected"
        )

    game_rule = db_session.get(GameRuleTemplate, room.game_rule_id)
    if not game_rule:
        raise HTTPException(status_code=404, detail="Game rule not found")

    # 初始化遊戲引擎和狀態
    engine = GameEngine()

    # 根據遊戲規則 slug 獲取配置
    if game_rule.slug == "skill_assessment":
        config = GameRuleConfig.get_skill_assessment_config()
    elif game_rule.slug == "value_navigation":
        config = GameRuleConfig.get_value_navigation_config()
    elif game_rule.slug == "career_personality":
        config = GameRuleConfig.get_career_personality_config()
    else:
        raise HTTPException(
            status_code=400, detail=f"Unknown game rule: {game_rule.slug}"
        )

    # 初始化遊戲狀態
    initial_state = engine.initialize_game(config)

    # 創建遊戲會話
    game_session = GameSession(
        room_id=session_data.room_id,
        game_rule_id=room.game_rule_id,
        status=GameStatus.WAITING,
        game_state=initial_state.to_dict(),
        counselor_id=current_user["user_id"],
        visitor_ids=session_data.visitor_ids or [],
    )

    db_session.add(game_session)
    db_session.commit()
    db_session.refresh(game_session)

    return game_session


@router.get("/{session_id}", response_model=GameSessionResponse)
def get_game_session(session_id: UUID, db_session: Session = Depends(get_session)):
    """獲取遊戲會話狀態"""

    game_session = db_session.get(GameSession, session_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    return game_session


@router.get("/room/{room_id}/active", response_model=Optional[GameSessionResponse])
def get_active_game_session(room_id: UUID, db_session: Session = Depends(get_session)):
    """獲取房間的活躍遊戲會話"""

    game_session = db_session.exec(
        select(GameSession).where(
            GameSession.room_id == room_id,
            GameSession.status.in_([GameStatus.WAITING.value, GameStatus.IN_PROGRESS.value]),
        )
    ).first()

    return game_session


@router.post("/{session_id}/start", response_model=GameSessionResponse)
def start_game_session(
    session_id: UUID,
    db_session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
):
    """開始遊戲會話"""

    game_session = db_session.get(GameSession, session_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # 檢查權限
    if game_session.counselor_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only counselor can start the game")

    # 檢查狀態
    if game_session.status != GameStatus.WAITING:
        raise HTTPException(
            status_code=400, detail=f"Cannot start game in {game_session.status} status"
        )

    # 更新狀態
    game_session.status = GameStatus.IN_PROGRESS
    game_session.started_at = datetime.utcnow()
    game_session.updated_at = datetime.utcnow()

    db_session.add(game_session)
    db_session.commit()
    db_session.refresh(game_session)

    return game_session


@router.post("/{session_id}/actions", response_model=GameActionResponse)
def execute_game_action(
    session_id: UUID,
    action_request: GameActionRequest,
    db_session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
):
    """執行遊戲動作"""

    # 獲取遊戲會話
    game_session = db_session.get(GameSession, session_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # 檢查遊戲狀態
    if game_session.status != GameStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute action in {game_session.status} status",
        )

    # 驗證玩家權限
    if action_request.player_role == "counselor":
        if action_request.player_id != game_session.counselor_id:
            raise HTTPException(status_code=403, detail="Invalid counselor ID")
    elif action_request.player_role == "visitor":
        if action_request.player_id not in game_session.visitor_ids:
            raise HTTPException(status_code=403, detail="Visitor not in session")
    else:
        raise HTTPException(status_code=400, detail="Invalid player role")

    # 獲取遊戲規則
    game_rule = db_session.get(GameRuleTemplate, game_session.game_rule_id)
    if not game_rule:
        raise HTTPException(status_code=404, detail="Game rule not found")

    # 初始化遊戲引擎
    engine = GameEngine()

    # 根據遊戲規則 slug 獲取配置
    if game_rule.slug == "skill_assessment":
        config = GameRuleConfig.get_skill_assessment_config()
    elif game_rule.slug == "value_navigation":
        config = GameRuleConfig.get_value_navigation_config()
    elif game_rule.slug == "career_personality":
        config = GameRuleConfig.get_career_personality_config()
    else:
        raise HTTPException(
            status_code=400, detail=f"Unknown game rule: {game_rule.slug}"
        )

    # 從 JSON 重建遊戲狀態
    current_state = GameState.from_dict(game_session.game_state)

    # 創建遊戲動作
    try:
        action_type = ActionType(action_request.action_type)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid action type: {action_request.action_type}"
        )

    action = GameAction(
        type=action_type,
        player_id=action_request.player_id,
        **action_request.action_data,
    )

    # 驗證動作
    if not engine.validate_action(action, current_state):
        return GameActionResponse(success=False, message="Invalid action")

    # 記錄動作前的狀態
    state_before = current_state.to_dict()

    # 執行動作
    new_state = engine.execute_action_with_config(action, current_state, config)

    # 更新遊戲會話狀態
    game_session.game_state = new_state.to_dict()
    game_session.updated_at = datetime.utcnow()

    # 記錄動作
    action_record = GameActionRecord(
        session_id=session_id,
        action_type=action_request.action_type,
        action_data=action_request.action_data,
        player_id=action_request.player_id,
        player_role=action_request.player_role,
        state_before=state_before,
        state_after=new_state.to_dict(),
    )

    db_session.add(action_record)
    db_session.add(game_session)
    db_session.commit()
    db_session.refresh(game_session)

    return GameActionResponse(
        success=True,
        message="Action executed successfully",
        game_state=new_state.to_dict(),
        action_id=action_record.id,
    )


@router.post("/{session_id}/complete", response_model=GameSessionResponse)
def complete_game_session(
    session_id: UUID,
    db_session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user_from_token),
):
    """完成遊戲會話"""

    game_session = db_session.get(GameSession, session_id)
    if not game_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # 檢查權限
    if game_session.counselor_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403, detail="Only counselor can complete the game"
        )

    # 檢查狀態
    if game_session.status != GameStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete game in {game_session.status} status",
        )

    # 更新狀態
    game_session.status = GameStatus.COMPLETED
    game_session.completed_at = datetime.utcnow()
    game_session.updated_at = datetime.utcnow()

    db_session.add(game_session)
    db_session.commit()
    db_session.refresh(game_session)

    return game_session


@router.get("/{session_id}/actions", response_model=List[GameActionRecord])
def get_game_actions(
    session_id: UUID,
    db_session: Session = Depends(get_session),
    limit: int = 100,
    offset: int = 0,
):
    """獲取遊戲動作記錄"""

    actions = db_session.exec(
        select(GameActionRecord)
        .where(GameActionRecord.session_id == session_id)
        .order_by(GameActionRecord.created_at)
        .offset(offset)
        .limit(limit)
    ).all()

    return actions
