"""
Game State Models
遊戲狀態模型
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.game_rule import GameRuleTemplate
    from app.models.room import Room


class GameStatus(str, Enum):
    """遊戲狀態"""

    WAITING = "waiting"  # 等待開始
    IN_PROGRESS = "in_progress"  # 進行中
    PAUSED = "paused"  # 暫停
    COMPLETED = "completed"  # 已完成


class GameSession(SQLModel, table=True):
    """遊戲會話 - 追蹤一個諮詢室的遊戲狀態"""

    __tablename__ = "game_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    room_id: UUID = Field(foreign_key="rooms.id", index=True)
    game_rule_id: UUID = Field(foreign_key="game_rule_templates.id")
    status: GameStatus = Field(default=GameStatus.WAITING)

    # 遊戲狀態 - 使用 JSON 存儲靈活的狀態數據
    game_state: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    # 參與者
    counselor_id: str = Field(index=True)  # 諮商師 ID
    visitor_ids: List[str] = Field(
        default_factory=list, sa_column=Column(JSON)
    )  # 訪客 ID 列表

    # 時間戳記
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    room: Optional["Room"] = Relationship()
    game_rule: Optional["GameRuleTemplate"] = Relationship()
    actions: List["GameActionRecord"] = Relationship(back_populates="session")


class GameActionRecord(SQLModel, table=True):
    """遊戲動作記錄 - 記錄所有遊戲動作用於回放和分析"""

    __tablename__ = "game_action_records"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="game_sessions.id", index=True)

    # 動作詳情
    action_type: str = Field(index=True)  # flip, move, place_card, etc.
    action_data: Dict[str, Any] = Field(sa_column=Column(JSON))  # 動作參數

    # 執行者
    player_id: str = Field(index=True)  # 執行動作的用戶 ID
    player_role: str = Field()  # counselor 或 visitor

    # 狀態快照 (可選，用於回放)
    state_before: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    state_after: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    # 時間戳記
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    session: Optional[GameSession] = Relationship(back_populates="actions")


# Pydantic schemas for API
class GameSessionCreate(SQLModel):
    """創建遊戲會話請求"""

    room_id: UUID
    visitor_ids: Optional[List[str]] = Field(default_factory=list)


class GameSessionResponse(SQLModel):
    """遊戲會話響應"""

    id: UUID
    room_id: UUID
    game_rule_id: UUID
    status: GameStatus
    game_state: Dict[str, Any]
    counselor_id: str
    visitor_ids: List[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class GameActionRequest(SQLModel):
    """執行遊戲動作請求"""

    action_type: str
    action_data: Dict[str, Any]
    player_id: str
    player_role: str


class GameActionResponse(SQLModel):
    """遊戲動作響應"""

    success: bool
    message: Optional[str] = None
    game_state: Optional[Dict[str, Any]] = None
    action_id: Optional[UUID] = None


class GameStateSnapshot(SQLModel):
    """遊戲狀態快照"""

    session_id: UUID
    status: GameStatus
    game_state: Dict[str, Any]
    last_action: Optional[Dict[str, Any]] = None
    timestamp: datetime
