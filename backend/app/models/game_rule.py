"""
Game Rules Models - 遊戲規則模型 (Configuration Layer)

根據 ARCHITECTURE.md 三層架構設計
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class GameRuleTemplate(SQLModel, table=True):
    """遊戲規則模板 - 定義遊戲的基本規則"""

    __tablename__ = "game_rule_templates"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100, description="規則名稱")
    slug: str = Field(max_length=50, unique=True, description="規則標識符")
    description: Optional[str] = Field(default=None, description="規則描述")
    version: str = Field(default="1.0", max_length=20)

    # 配置數據 (JSONB)
    layout_config: Dict[str, Any] = Field(
        sa_column=Column(JSON), description="布局配置"
    )
    constraint_config: Dict[str, Any] = Field(
        sa_column=Column(JSON), description="約束配置"
    )
    validation_rules: Dict[str, Any] = Field(
        sa_column=Column(JSON), description="驗證規則"
    )
    ui_config: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="UI配置"
    )

    is_active: bool = Field(default=True, description="是否啟用")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class CardDeck(SQLModel, table=True):
    """牌組 - 管理牌卡內容"""

    __tablename__ = "card_decks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    game_rule_id: UUID = Field(
        foreign_key="game_rule_templates.id", description="所屬遊戲規則"
    )
    name: str = Field(max_length=100, description="牌組名稱")
    description: Optional[str] = Field(default=None, description="牌組描述")
    version: str = Field(default="1.0", max_length=20)

    is_official: bool = Field(default=False, description="是否為官方牌組")
    is_default: bool = Field(default=False, description="是否為該規則的預設牌組")

    created_by: Optional[UUID] = Field(
        default=None, foreign_key="users.id", description="創建者"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Card(SQLModel, table=True):
    """牌卡 - 具體的牌卡內容"""

    __tablename__ = "cards"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    deck_id: UUID = Field(foreign_key="card_decks.id", description="所屬牌組")
    card_key: str = Field(max_length=100, description="牌卡唯一標識")
    title: str = Field(max_length=200, description="牌卡標題")
    description: Optional[str] = Field(default=None, description="牌卡描述")
    category: Optional[str] = Field(default=None, max_length=50, description="分類")
    subcategory: Optional[str] = Field(
        default=None, max_length=50, description="子分類"
    )
    display_order: int = Field(default=0, description="顯示順序")

    # 擴展屬性
    card_metadata: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="元數據"
    )
    assets: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="資源文件"
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # 在同一牌組內，card_key 必須唯一
        indexes = [{"fields": ["deck_id", "card_key"], "unique": True}]
