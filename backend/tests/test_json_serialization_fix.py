"""
Test JSON Serialization Fix - TDD approach
測試 JSON 序列化修復 - 採用 TDD 方法
"""

import json

import pytest
from fastapi.testclient import TestClient

from app.game.config import DropZoneConfig, GameRuleConfig, Position
from app.main import app

client = TestClient(app)


class TestJSONSerializationFix:
    """測試 JSON 序列化修復"""

    def test_drop_zone_config_serialization(self):
        """測試 DropZoneConfig 可以正確序列化為 JSON"""
        # Red: Test fails because DropZoneConfig is not JSON serializable
        drop_zone = DropZoneConfig(
            id="test_zone",
            name="測試區域",
            position=Position(x=10.0, y=20.0),
            max_cards=5,
            show_counter=True,
        )

        # This should work after implementing to_dict()
        dict_result = drop_zone.to_dict()

        # Should be able to serialize to JSON
        json_str = json.dumps(dict_result)
        assert json_str is not None

        # Should be able to deserialize back
        parsed = json.loads(json_str)
        assert parsed["id"] == "test_zone"
        assert parsed["name"] == "測試區域"
        assert parsed["position"]["x"] == 10.0
        assert parsed["position"]["y"] == 20.0

    def test_layout_config_serialization(self):
        """測試 LayoutConfig 可以正確序列化"""
        from app.game.config import LayoutConfig

        layout = LayoutConfig(
            deck_area={"position": {"x": 0, "y": 0}, "style": "stack"},
            drop_zones=[
                DropZoneConfig(
                    id="zone1", name="區域1", position=Position(x=10, y=10), max_cards=3
                )
            ],
        )

        # Should be able to convert to dict
        dict_result = layout.to_dict()

        # Should be JSON serializable
        json_str = json.dumps(dict_result)
        assert json_str is not None

        # Verify structure
        parsed = json.loads(json_str)
        assert "deck_area" in parsed
        assert "drop_zones" in parsed
        assert len(parsed["drop_zones"]) == 1
        assert parsed["drop_zones"][0]["id"] == "zone1"

    def test_constraint_config_serialization(self):
        """測試 ConstraintConfig 可以正確序列化"""
        from app.game.config import ConstraintConfig

        constraints = ConstraintConfig(
            max_per_zone={"zone1": 5, "zone2": 3},
            min_per_zone={"zone1": 1},
            total_limit=10,
            unique_positions=True,
        )

        # Should be able to convert to dict
        dict_result = constraints.to_dict()

        # Should be JSON serializable
        json_str = json.dumps(dict_result)
        assert json_str is not None

        # Verify structure
        parsed = json.loads(json_str)
        assert parsed["max_per_zone"]["zone1"] == 5
        assert parsed["min_per_zone"]["zone1"] == 1
        assert parsed["total_limit"] == 10
        assert parsed["unique_positions"] is True

    def test_game_rule_config_full_serialization(self):
        """測試完整的 GameRuleConfig 序列化"""
        config = GameRuleConfig.get_skill_assessment_config()

        # All components should have to_dict() method
        layout_dict = config.layout.to_dict()
        constraints_dict = config.constraints.to_dict()

        # Should be JSON serializable
        full_config = {
            "id": config.id,
            "name": config.name,
            "version": config.version,
            "layout": layout_dict,
            "constraints": constraints_dict,
        }

        json_str = json.dumps(full_config)
        assert json_str is not None

        # Parse back and verify
        parsed = json.loads(json_str)
        assert parsed["id"] == "skill_assessment"
        assert parsed["name"] == "職能盤點卡"
        assert len(parsed["layout"]["drop_zones"]) == 2

    def test_create_room_with_new_game_rule(self):
        """測試創建房間時自動創建遊戲規則（測試序列化修復）"""
        # Login first
        login_response = client.post(
            "/api/auth/login",
            json={"email": "demo.counselor@example.com", "password": "demo123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Clear any existing game rules (to force creation)
        # Note: In real scenario, we might want to use a unique slug

        # Create room with game rule that might not exist
        response = client.post(
            "/api/rooms/",
            headers=headers,
            json={
                "name": "測試序列化房間",
                "description": "測試 JSON 序列化修復",
                "game_rule_slug": "skill_assessment",
            },
        )

        # Should succeed without JSON serialization error
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "測試序列化房間"
        assert data["game_rule_id"] is not None

    def test_position_dataclass_serialization(self):
        """測試 Position dataclass 序列化"""
        position = Position(x=100.5, y=200.75)

        # Position doesn't have to_dict(), but we can use __dict__
        position_dict = {"x": position.x, "y": position.y}

        # Should be JSON serializable
        json_str = json.dumps(position_dict)
        assert json_str is not None

        # Parse back
        parsed = json.loads(json_str)
        assert parsed["x"] == 100.5
        assert parsed["y"] == 200.75
