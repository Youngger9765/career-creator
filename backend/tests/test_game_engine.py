"""
Test Game Rules Engine - 三層架構核心測試

根據 CLAUDE.md TDD 原則編寫，測試期望行為：

1. GameRuleConfig 可以定義三種遊戲規則
2. GameEngine 可以驗證動作是否符合規則
3. GameEngine 可以執行有效動作並更新狀態
4. 支援職能盤點卡、價值導航卡、職游旅人卡三種規則
"""

from sqlmodel import Session

from tests.factories import TestDataBuilder, UserFactory

# Session fixture removed - using PostgreSQL conftest.py fixture instead


class TestGameRuleConfig:
    """測試遊戲規則配置 (Configuration Layer)"""

    def test_skill_assessment_rule_config(self):
        """職能盤點卡規則配置"""
        # 期望行為：職能盤點卡有2個區域，每區最多5張
        from app.game.config import GameRuleConfig

        config = GameRuleConfig.get_skill_assessment_config()

        assert config.id == "skill_assessment"
        assert config.name == "職能盤點卡"
        assert len(config.layout.drop_zones) == 2

        advantage_zone = config.layout.get_zone("advantage")
        assert advantage_zone.max_cards == 5

        disadvantage_zone = config.layout.get_zone("disadvantage")
        assert disadvantage_zone.max_cards == 5

    def test_value_navigation_rule_config(self):
        """價值導航卡規則配置"""
        # 期望行為：價值導航卡有3x3九宮格，每格限1張
        from app.game.config import GameRuleConfig

        config = GameRuleConfig.get_value_navigation_config()

        assert config.id == "value_navigation"
        assert config.name == "價值導航卡"
        assert len(config.layout.drop_zones) == 9  # 3x3九宮格

        # 檢查每個位置都只能放1張牌
        for i in range(9):
            zone = config.layout.get_zone(f"rank_{i + 1}")
            assert zone is not None
            assert zone.max_cards == 1

    def test_career_personality_rule_config(self):
        """職游旅人卡規則配置"""
        # 期望行為：職游旅人卡有3列，喜歡/討厭區各限20張，中立區無限
        from app.game.config import GameRuleConfig

        config = GameRuleConfig.get_career_personality_config()

        assert config.id == "career_personality"
        assert config.name == "職游旅人卡"
        assert len(config.layout.drop_zones) == 3  # 3列

        # 喜歡區限制20張
        like_zone = config.layout.get_zone("like")
        assert like_zone.max_cards == 20

        # 中立區無限制
        neutral_zone = config.layout.get_zone("neutral")
        assert neutral_zone.max_cards is None

        # 討厭區限制20張
        dislike_zone = config.layout.get_zone("dislike")
        assert dislike_zone.max_cards == 20


class TestGameEngine:
    """測試遊戲引擎核心 (Engine Layer)"""

    def test_validate_skill_assessment_zone_limits(self):
        """驗證職能盤點卡區域限制"""
        # 期望行為：優勢區放滿5張後，第6張應被拒絕
        from app.game.config import ActionType, GameRuleConfig
        from app.game.engine import GameAction, GameEngine, GameState

        config = GameRuleConfig.get_skill_assessment_config()
        engine = GameEngine(config)

        # 創建初始狀態
        state = GameState.create_initial_state("room_1", "skill_assessment")

        # 模擬已放5張牌到優勢區
        for i in range(5):
            state = state.place_card_in_zone(f"card_{i}", "advantage")

        # 嘗試放第6張牌 - 應被拒絕
        action = GameAction(
            type=ActionType.PLACE_CARD,
            player_id="player_1",
            card_id="card_6",
            target_zone="advantage",
        )

        assert engine.validate_action(action, state) is False

    def test_execute_valid_card_placement(self):
        """執行有效牌卡放置"""
        # 期望行為：有效動作應更新遊戲狀態
        from app.game.config import ActionType, GameRuleConfig
        from app.game.engine import GameAction, GameEngine, GameState

        config = GameRuleConfig.get_skill_assessment_config()
        engine = GameEngine(config)
        state = GameState.create_initial_state("room_1", "skill_assessment")

        # 執行有效的放牌動作
        action = GameAction(
            type=ActionType.PLACE_CARD,
            player_id="player_1",
            card_id="skill_001",
            target_zone="advantage",
        )

        result = engine.execute_action(action, state)

        assert result.success is True
        assert result.new_state is not None
        assert result.new_state.get_zone_card_count("advantage") == 1
        assert "skill_001" in result.new_state.zones["advantage"].cards

    def test_game_state_immutability(self):
        """遊戲狀態不可變性"""
        # 期望行為：每次動作應產生新狀態，而不修改原狀態
        from app.game.config import ActionType, GameRuleConfig
        from app.game.engine import GameAction, GameEngine, GameState

        config = GameRuleConfig.get_skill_assessment_config()
        engine = GameEngine(config)

        # 創建初始狀態
        original_state = GameState.create_initial_state("room_1", "skill_assessment")

        # 記錄原始狀態
        original_advantage_count = original_state.get_zone_card_count("advantage")
        original_version = original_state.version
        original_zones_id = id(original_state.zones)

        # 執行動作
        action = GameAction(
            type=ActionType.PLACE_CARD,
            player_id="player_1",
            card_id="skill_001",
            target_zone="advantage",
        )

        result = engine.execute_action(action, original_state)

        # 驗證不可變性
        assert result.success is True
        assert result.new_state is not None

        # 原狀態不應被修改
        assert (
            original_state.get_zone_card_count("advantage") == original_advantage_count
        )
        assert original_state.version == original_version
        assert id(original_state.zones) == original_zones_id
        assert "skill_001" not in original_state.zones["advantage"].cards

        # 新狀態應該不同
        assert result.new_state is not original_state
        assert result.new_state.version == original_version + 1
        assert (
            result.new_state.get_zone_card_count("advantage")
            == original_advantage_count + 1
        )
        assert "skill_001" in result.new_state.zones["advantage"].cards


class TestGameIntegration:
    """整合測試 (Application + Configuration + Engine)"""

    def test_create_room_with_game_rule(self, session: Session):
        """創建諮詢室並指定遊戲規則"""
        # 期望行為：創建諮詢室時可選擇遊戲規則
        from app.models.game_rule import GameRuleTemplate
        from app.models.room import Room

        counselor = UserFactory.create_counselor(session)

        # 創建遊戲規則模板
        skill_assessment_rule = GameRuleTemplate(
            name="職能盤點卡",
            slug="skill_assessment",
            layout_config={
                "drop_zones": [
                    {"id": "advantage", "name": "優勢", "max_cards": 5},
                    {"id": "disadvantage", "name": "劣勢", "max_cards": 5},
                ]
            },
            constraint_config={
                "max_per_zone": {"advantage": 5, "disadvantage": 5},
                "total_limit": 10,
            },
            validation_rules={},
        )
        session.add(skill_assessment_rule)
        session.commit()

        # 創建諮詢室並指定遊戲規則
        room = Room(
            name="Test Room",
            description="Test room with game rule",
            counselor_id=counselor.id,  # Convert UUID to string for SQLite
            game_rule_id=skill_assessment_rule.id,
        )
        session.add(room)
        session.commit()

        # 驗證諮詢室有正確的遊戲規則
        assert room.game_rule_id == skill_assessment_rule.id

    def test_complete_skill_assessment_flow(self, session: Session):
        """完整職能盤點卡流程"""
        # 期望行為：完整的遊戲流程應該可以正常進行
        from app.game.config import ActionType, GameRuleConfig
        from app.game.engine import GameAction, GameEngine, GameState

        test_data = (
            TestDataBuilder(session)
            .with_counselor()
            .with_room()
            .with_visitors(count=1)
            .build()
        )

        # 1. 初始化遊戲狀態
        config = GameRuleConfig.get_skill_assessment_config()
        engine = GameEngine(config)
        state = GameState.create_initial_state(
            str(test_data["room"].id), "skill_assessment"
        )

        # 驗證初始狀態
        assert state.room_id == str(test_data["room"].id)
        assert state.rule_id == "skill_assessment"
        assert state.get_zone_card_count("advantage") == 0
        assert state.get_zone_card_count("disadvantage") == 0

        # 2. 執行放牌動作序列
        visitor = test_data["visitors"][0]

        # 放第一張牌到優勢區
        action1 = GameAction(
            type=ActionType.PLACE_CARD,
            player_id=str(visitor.id),
            card_id="skill_communication",
            target_zone="advantage",
        )
        result1 = engine.execute_action(action1, state)
        assert result1.success is True
        state = result1.new_state

        # 放第二張牌到劣勢區
        action2 = GameAction(
            type=ActionType.PLACE_CARD,
            player_id=str(visitor.id),
            card_id="skill_math",
            target_zone="disadvantage",
        )
        result2 = engine.execute_action(action2, state)
        assert result2.success is True
        state = result2.new_state

        # 3. 驗證最終狀態
        assert state.get_zone_card_count("advantage") == 1
        assert state.get_zone_card_count("disadvantage") == 1
        assert "skill_communication" in state.zones["advantage"].cards
        assert "skill_math" in state.zones["disadvantage"].cards
        assert state.version == 3  # 初始=1, +2次動作

        # 4. 測試區域限制
        # 嘗試在優勢區放滿5張牌後再放第6張
        for i in range(4):  # 再放4張，總共5張
            action = GameAction(
                type=ActionType.PLACE_CARD,
                player_id=str(visitor.id),
                card_id=f"skill_extra_{i}",
                target_zone="advantage",
            )
            result = engine.execute_action(action, state)
            assert result.success is True
            state = result.new_state

        # 現在優勢區應該有5張牌
        assert state.get_zone_card_count("advantage") == 5

        # 嘗試放第6張牌 - 應被拒絕
        action_overflow = GameAction(
            type=ActionType.PLACE_CARD,
            player_id=str(visitor.id),
            card_id="skill_overflow",
            target_zone="advantage",
        )
        result_overflow = engine.execute_action(action_overflow, state)
        assert result_overflow.success is False
        assert "validation failed" in result_overflow.error_message.lower()
