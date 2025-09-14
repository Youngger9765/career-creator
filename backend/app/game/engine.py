"""
Game Engine - 遊戲引擎核心 (Engine Layer)

根據 ARCHITECTURE.md 設計，實現規則無關的核心邏輯
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .config import ActionType, GameRuleConfig


@dataclass
class Card:
    """牌卡"""

    id: str
    name: str
    category: str
    is_flipped: bool = False
    position: Optional[Dict[str, float]] = None


@dataclass
class GameAction:
    """遊戲動作"""

    type: ActionType
    player_id: str
    card_id: Optional[str] = None
    target_zone: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    data: Optional[Dict[str, Any]] = None


@dataclass
class ZoneState:
    """區域狀態"""

    zone_id: str
    cards: List[str] = field(default_factory=list)

    def add_card(self, card_id: str) -> "ZoneState":
        """添加牌卡（不可變操作）"""
        return ZoneState(zone_id=self.zone_id, cards=self.cards + [card_id])

    def remove_card(self, card_id: str) -> "ZoneState":
        """移除牌卡（不可變操作）"""
        new_cards = [c for c in self.cards if c != card_id]
        return ZoneState(zone_id=self.zone_id, cards=new_cards)


@dataclass
class GameState:
    """遊戲狀態（不可變）"""

    room_id: str
    rule_id: str
    zones: Dict[str, ZoneState] = field(default_factory=dict)
    version: int = 1
    deck_remaining: int = 0
    turn_count: int = 0
    current_player: Optional[str] = None

    @classmethod
    def create_initial_state(cls, room_id: str, rule_id: str) -> "GameState":
        """創建初始遊戲狀態"""
        # 根據規則創建初始區域
        zones = {}
        if rule_id == "skill_assessment":
            zones["advantage"] = ZoneState("advantage")
            zones["disadvantage"] = ZoneState("disadvantage")
        elif rule_id == "value_navigation":
            for i in range(9):
                zones[f"rank_{i+1}"] = ZoneState(f"rank_{i+1}")
        elif rule_id == "career_personality":
            zones["like"] = ZoneState("like")
            zones["neutral"] = ZoneState("neutral")
            zones["dislike"] = ZoneState("dislike")

        return cls(room_id=room_id, rule_id=rule_id, zones=zones)

    def place_card_in_zone(self, card_id: str, zone_id: str) -> "GameState":
        """在指定區域放置牌卡（不可變操作）"""
        if zone_id not in self.zones:
            raise ValueError(f"Zone {zone_id} not found")

        new_zones = self.zones.copy()
        new_zones[zone_id] = self.zones[zone_id].add_card(card_id)

        return GameState(
            room_id=self.room_id,
            rule_id=self.rule_id,
            zones=new_zones,
            version=self.version + 1,
            deck_remaining=self.deck_remaining,
            turn_count=self.turn_count,
            current_player=self.current_player,
        )

    def get_zone_card_count(self, zone_id: str) -> int:
        """獲取區域內牌卡數量"""
        if zone_id not in self.zones:
            return 0
        return len(self.zones[zone_id].cards)

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "room_id": self.room_id,
            "rule_id": self.rule_id,
            "zones": {
                zone_id: {"zone_id": zone.zone_id, "cards": zone.cards}
                for zone_id, zone in self.zones.items()
            },
            "version": self.version,
            "deck_remaining": self.deck_remaining,
            "turn_count": self.turn_count,
            "current_player": self.current_player,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GameState":
        """從字典創建"""
        zones = {
            zone_id: ZoneState(
                zone_id=zone_data.get("zone_id", zone_id),
                cards=zone_data.get("cards", []),
            )
            for zone_id, zone_data in data.get("zones", {}).items()
        }
        return cls(
            room_id=data.get("room_id", ""),
            rule_id=data.get("rule_id", ""),
            zones=zones,
            version=data.get("version", 1),
            deck_remaining=data.get("deck_remaining", 0),
            turn_count=data.get("turn_count", 0),
            current_player=data.get("current_player"),
        )


@dataclass
class ActionResult:
    """動作執行結果"""

    success: bool
    new_state: Optional[GameState] = None
    error_message: Optional[str] = None

    @classmethod
    def success_result(cls, new_state: GameState) -> "ActionResult":
        return cls(success=True, new_state=new_state)

    @classmethod
    def error_result(cls, message: str) -> "ActionResult":
        return cls(success=False, error_message=message)


class GameEngine:
    """遊戲引擎核心 - 規則無關的邏輯處理"""

    def __init__(self, config: Optional[GameRuleConfig] = None):
        self.config = config

    def validate_action(self, action: GameAction, state: GameState) -> bool:
        """驗證動作是否符合規則"""
        if action.type == ActionType.PLACE_CARD:
            return self._validate_place_card_action(action, state)

        # 其他動作類型的驗證...
        return True

    def _validate_place_card_action(self, action: GameAction, state: GameState) -> bool:
        """驗證放牌動作"""
        if not action.target_zone or not action.card_id:
            return False

        # 檢查區域是否存在
        if action.target_zone not in state.zones:
            return False

        # 檢查區域牌卡數量限制
        if self.config and self.config.layout:
            zone_config = self.config.layout.get_zone(action.target_zone)
            if zone_config and zone_config.max_cards is not None:
                current_count = state.get_zone_card_count(action.target_zone)
                if current_count >= zone_config.max_cards:
                    return False

        # 檢查牌卡是否已存在於該區域
        zone_state = state.zones[action.target_zone]
        if action.card_id in zone_state.cards:
            return False

        return True

    def execute_action(self, action: GameAction, state: GameState) -> ActionResult:
        """執行動作並返回新狀態"""
        # 先驗證動作
        if not self.validate_action(action, state):
            return ActionResult.error_result("Action validation failed")

        try:
            if action.type == ActionType.PLACE_CARD:
                new_state = state.place_card_in_zone(action.card_id, action.target_zone)
                return ActionResult.success_result(new_state)

            # 其他動作類型的處理...
            return ActionResult.error_result(f"Unsupported action type: {action.type}")

        except Exception as e:
            return ActionResult.error_result(str(e))

    def initialize_game(self, config: GameRuleConfig) -> GameState:
        """初始化遊戲狀態"""
        self.config = config
        # 創建初始遊戲狀態
        zones = {}
        for drop_zone in config.layout.drop_zones:
            zones[drop_zone.id] = ZoneState(zone_id=drop_zone.id)

        # TODO: 計算實際的牌卡數量
        deck_remaining = 100 if config.id == "career_personality" else 52

        return GameState(
            room_id="",  # Will be set when creating game session
            rule_id=config.id,
            zones=zones,
            version=1,
            deck_remaining=deck_remaining,
            turn_count=0,
            current_player=None,
        )

    def execute_action_with_config(
        self, action: GameAction, state: GameState, config: GameRuleConfig
    ) -> GameState:
        """執行動作並返回新狀態（帶配置）"""
        old_config = self.config
        self.config = config
        result = self.execute_action(action, state)
        self.config = old_config
        if result.success:
            return result.new_state
        else:
            raise ValueError(result.error_message)
