"""
Game Configuration - 遊戲規則配置 (Configuration Layer)

根據 ARCHITECTURE.md 設計，實現配置驅動的遊戲規則系統
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class ActionType(Enum):
    """動作類型"""

    FLIP = "flip"
    MOVE = "move"
    ARRANGE = "arrange"
    ANNOTATE = "annotate"
    PLACE_CARD = "place_card"


@dataclass
class Position:
    """位置"""

    x: float
    y: float


@dataclass
class DropZoneConfig:
    """放置區域配置"""

    id: str
    name: str
    position: Position
    max_cards: Optional[int] = None
    min_cards: Optional[int] = None
    show_counter: bool = False
    bg_color: Optional[str] = None

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "position": {"x": self.position.x, "y": self.position.y},
            "max_cards": self.max_cards,
            "min_cards": self.min_cards,
            "show_counter": self.show_counter,
            "bg_color": self.bg_color,
        }


@dataclass
class LayoutConfig:
    """布局配置"""

    deck_area: Dict[str, Any]
    drop_zones: List[DropZoneConfig]

    def get_zone(self, zone_id: str) -> Optional[DropZoneConfig]:
        """獲取指定區域配置"""
        for zone in self.drop_zones:
            if zone.id == zone_id:
                return zone
        return None

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "deck_area": self.deck_area,
            "drop_zones": [zone.to_dict() for zone in self.drop_zones],
        }


@dataclass
class ConstraintConfig:
    """約束配置"""

    max_per_zone: Dict[str, int]
    min_per_zone: Dict[str, int]
    total_limit: Optional[int] = None
    unique_positions: bool = False

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "max_per_zone": self.max_per_zone,
            "min_per_zone": self.min_per_zone,
            "total_limit": self.total_limit,
            "unique_positions": self.unique_positions,
        }


@dataclass
class GameRuleConfig:
    """遊戲規則配置"""

    id: str
    name: str
    version: str
    layout: LayoutConfig
    constraints: ConstraintConfig

    @classmethod
    def get_skill_assessment_config(cls) -> "GameRuleConfig":
        """獲取職能盤點卡規則配置"""
        return cls(
            id="skill_assessment",
            name="職能盤點卡",
            version="1.0",
            layout=LayoutConfig(
                deck_area={"position": {"x": 0, "y": 0}, "style": "stack"},
                drop_zones=[
                    DropZoneConfig(
                        id="advantage",
                        name="優勢",
                        position=Position(x=60, y=20),
                        max_cards=5,
                        show_counter=True,
                    ),
                    DropZoneConfig(
                        id="disadvantage",
                        name="劣勢",
                        position=Position(x=60, y=60),
                        max_cards=5,
                        show_counter=True,
                    ),
                ],
            ),
            constraints=ConstraintConfig(
                max_per_zone={"advantage": 5, "disadvantage": 5},
                min_per_zone={},
                total_limit=10,
            ),
        )

    @classmethod
    def get_value_navigation_config(cls) -> "GameRuleConfig":
        """獲取價值導航卡規則配置"""
        drop_zones = []
        for i in range(9):
            row = i // 3
            col = i % 3
            drop_zones.append(
                DropZoneConfig(
                    id=f"rank_{i + 1}",
                    name=f"第{i + 1}名",
                    position=Position(x=60 + col * 20, y=20 + row * 20),
                    max_cards=1,
                    show_counter=False,
                )
            )

        return cls(
            id="value_navigation",
            name="價值導航卡",
            version="1.0",
            layout=LayoutConfig(
                deck_area={"position": {"x": 0, "y": 0}, "style": "categorized"},
                drop_zones=drop_zones,
            ),
            constraints=ConstraintConfig(
                max_per_zone={f"rank_{i + 1}": 1 for i in range(9)},
                min_per_zone={},
                total_limit=9,
                unique_positions=True,
            ),
        )

    @classmethod
    def get_career_personality_config(cls) -> "GameRuleConfig":
        """獲取職游旅人卡規則配置"""
        return cls(
            id="career_personality",
            name="職游旅人卡",
            version="1.0",
            layout=LayoutConfig(
                deck_area={
                    "position": {"x": 0, "y": 0},
                    "style": "dual_layer",
                    "layers": [
                        {
                            "id": "explanation",
                            "card_count": 6,
                            "category": "explanation",
                        },
                        {"id": "career", "card_count": 100, "category": "career"},
                    ],
                },
                drop_zones=[
                    DropZoneConfig(
                        id="like",
                        name="喜歡",
                        position=Position(x=20, y=20),
                        max_cards=20,
                        show_counter=True,
                        bg_color="#e8f5e8",
                    ),
                    DropZoneConfig(
                        id="neutral",
                        name="中立",
                        position=Position(x=50, y=20),
                        max_cards=None,  # 無限制
                        show_counter=False,
                    ),
                    DropZoneConfig(
                        id="dislike",
                        name="討厭",
                        position=Position(x=80, y=20),
                        max_cards=20,
                        show_counter=True,
                        bg_color="#ffeaea",
                    ),
                ],
            ),
            constraints=ConstraintConfig(
                max_per_zone={"like": 20, "dislike": 20},
                min_per_zone={"like": 1, "dislike": 1},
                total_limit=None,
            ),
        )
