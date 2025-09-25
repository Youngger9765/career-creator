"""
Test Game Sessions API - TDD approach
遊戲會話 API 測試 - 採用 TDD 方法
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    """Get auth headers for demo counselor"""
    response = client.post(
        "/api/auth/login",
        json={"email": "demo.counselor@example.com", "password": "demo123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_room(auth_headers):
    """Create a test room with game rule"""
    response = client.post(
        "/api/rooms/",
        headers=auth_headers,
        json={
            "name": "Test Room",
            "description": "Room for testing",
            "game_rule_slug": "skill_assessment",
        },
    )
    assert response.status_code == 201
    return response.json()


class TestGameSessionCreation:
    """測試遊戲會話創建"""

    def test_create_game_session(self, auth_headers, test_room):
        """測試創建新的遊戲會話"""
        # Red: Test fails because endpoint doesn't exist yet
        response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )

        # Green: Make it pass
        assert response.status_code == 201
        data = response.json()
        assert data["room_id"] == test_room["id"]
        assert data["status"] == "waiting"
        assert data["game_state"] is not None
        assert "zones" in data["game_state"]

    def test_cannot_create_duplicate_session(self, auth_headers, test_room):
        """測試不能為同一諮詢室創建重複的遊戲會話"""
        # Create first session
        response1 = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        assert response1.status_code == 201

        # Try to create second session
        response2 = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        assert response2.status_code == 400
        assert "already has an active game session" in response2.json()["detail"]

    def test_only_room_owner_can_create_session(self, test_room):
        """測試只有房主能創建遊戲會話"""
        # Login as different user
        response = client.post(
            "/api/auth/login",
            json={"email": "demo.client@example.com", "password": "demo123"},
        )
        other_token = response.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}

        # Try to create session
        response = client.post(
            "/api/game-sessions/",
            headers=other_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        assert response.status_code == 403
        assert "Only room owner" in response.json()["detail"]


class TestGameSessionRetrieval:
    """測試遊戲會話檢索"""

    def test_get_game_session_by_id(self, auth_headers, test_room):
        """測試通過 ID 獲取遊戲會話"""
        # Create session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]

        # Get session
        response = client.get(f"/api/game-sessions/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert data["room_id"] == test_room["id"]

    def test_get_active_session_for_room(self, auth_headers, test_room):
        """測試獲取諮詢室的活躍遊戲會話"""
        # Create session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_data = create_response.json()

        # Get active session for room
        response = client.get(f"/api/game-sessions/room/{test_room['id']}/active")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_data["id"]
        assert data["status"] in ["waiting", "in_progress"]


class TestGameSessionLifecycle:
    """測試遊戲會話生命週期"""

    def test_start_game_session(self, auth_headers, test_room):
        """測試開始遊戲會話"""
        # Create session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]

        # Start session
        response = client.post(
            f"/api/game-sessions/{session_id}/start", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["started_at"] is not None

    def test_complete_game_session(self, auth_headers, test_room):
        """測試完成遊戲會話"""
        # Create and start session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]

        # Start session
        client.post(f"/api/game-sessions/{session_id}/start", headers=auth_headers)

        # Complete session
        response = client.post(
            f"/api/game-sessions/{session_id}/complete", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None


class TestGameActions:
    """測試遊戲動作執行"""

    def test_execute_place_card_action(self, auth_headers, test_room):
        """測試執行放置牌卡動作"""
        # Create and start session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": ["visitor-001"]},
        )
        session_id = create_response.json()["id"]
        counselor_id = create_response.json()["counselor_id"]

        # Start session
        client.post(f"/api/game-sessions/{session_id}/start", headers=auth_headers)

        # Execute action
        response = client.post(
            f"/api/game-sessions/{session_id}/actions",
            headers=auth_headers,
            json={
                "action_type": "place_card",
                "action_data": {"card_id": "card-001", "target_zone": "advantage"},
                "player_id": counselor_id,
                "player_role": "counselor",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["game_state"] is not None

    def test_invalid_action_fails(self, auth_headers, test_room):
        """測試無效動作會失敗"""
        # Create and start session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]
        counselor_id = create_response.json()["counselor_id"]

        # Start session
        client.post(f"/api/game-sessions/{session_id}/start", headers=auth_headers)

        # Execute invalid action (non-existent zone)
        response = client.post(
            f"/api/game-sessions/{session_id}/actions",
            headers=auth_headers,
            json={
                "action_type": "place_card",
                "action_data": {
                    "card_id": "card-001",
                    "target_zone": "non_existent_zone",
                },
                "player_id": counselor_id,
                "player_role": "counselor",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["message"] == "Invalid action"

    def test_get_action_history(self, auth_headers, test_room):
        """測試獲取動作歷史記錄"""
        # Create and start session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]
        counselor_id = create_response.json()["counselor_id"]

        # Start session
        client.post(f"/api/game-sessions/{session_id}/start", headers=auth_headers)

        # Execute some actions
        for i in range(3):
            client.post(
                f"/api/game-sessions/{session_id}/actions",
                headers=auth_headers,
                json={
                    "action_type": "place_card",
                    "action_data": {
                        "card_id": f"card-{i:03d}",
                        "target_zone": "advantage",
                    },
                    "player_id": counselor_id,
                    "player_role": "counselor",
                },
            )

        # Get action history
        response = client.get(f"/api/game-sessions/{session_id}/actions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(action["action_type"] == "place_card" for action in data)


class TestGameStateConsistency:
    """測試遊戲狀態一致性"""

    def test_state_persists_between_actions(self, auth_headers, test_room):
        """測試狀態在動作之間保持一致"""
        # Create and start session
        create_response = client.post(
            "/api/game-sessions/",
            headers=auth_headers,
            json={"room_id": test_room["id"], "visitor_ids": []},
        )
        session_id = create_response.json()["id"]
        counselor_id = create_response.json()["counselor_id"]
        initial_state = create_response.json()["game_state"]

        # Start session
        client.post(f"/api/game-sessions/{session_id}/start", headers=auth_headers)

        # Execute first action
        response1 = client.post(
            f"/api/game-sessions/{session_id}/actions",
            headers=auth_headers,
            json={
                "action_type": "place_card",
                "action_data": {"card_id": "card-001", "target_zone": "advantage"},
                "player_id": counselor_id,
                "player_role": "counselor",
            },
        )
        state_after_first = response1.json()["game_state"]

        # Verify state changed
        assert state_after_first != initial_state
        assert "card-001" in state_after_first["zones"]["advantage"]["cards"]

        # Get session and verify state persisted
        get_response = client.get(f"/api/game-sessions/{session_id}")
        persisted_state = get_response.json()["game_state"]
        assert persisted_state == state_after_first

    def test_concurrent_actions_handled_correctly(self, auth_headers, test_room):
        """測試併發動作處理正確"""
        # This test ensures that actions are processed sequentially
        # and state remains consistent
        pass  # TODO: Implement concurrent action testing with threading
