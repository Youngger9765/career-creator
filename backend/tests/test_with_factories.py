"""
使用 Test Factory 的範例測試
展示如何使用 Factory 來簡化測試代碼
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.database import get_session
from app.main import app
from tests.factories import (  # CardEventFactory,  # Disabled for now
    RoomFactory,
    TestDataBuilder,
    UserFactory,
    VisitorFactory,
)
from tests.helpers import create_auth_headers

# Session fixture removed - using PostgreSQL conftest.py fixture instead


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with dependency override"""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestWithFactories:
    """使用 Factory 的測試範例"""

    @pytest.mark.skip(reason="Card events feature is disabled")
    def test_complete_consultation_flow(self, client: TestClient, session: Session):
        """測試完整的諮詢流程 - 使用 TestDataBuilder"""
        # 使用 Builder 創建完整的測試場景
        test_data = (
            TestDataBuilder(session)
            .with_counselor(name="張諮詢師")
            .with_room(name="職涯探索諮詢")
            .with_visitors(count=2)
            # .with_card_events()  # Disabled - card events feature
            .build()
        )

        counselor = test_data["counselor"]
        room = test_data["room"]
        visitors = test_data["visitors"]

        # 驗證資料已創建
        assert counselor.name == "張諮詢師"
        assert room.name == "職涯探索諮詢"
        assert len(visitors) == 2
        assert len(test_data["events"]) == 4  # 預設創建4個事件

        # 測試諮詢師可以查看諮詢室
        headers = create_auth_headers(counselor)
        response = client.get(f"/api/rooms/{room.id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "職涯探索諮詢"

        # 測試可以獲取事件歷史
        response = client.get(f"/api/card-events/room/{room.id}", headers=headers)
        assert response.status_code == 200
        events = response.json()
        assert len(events) == 4

    def test_room_expiration(self, session: Session):
        """測試諮詢室過期 - 使用 RoomFactory"""
        # 創建活躍諮詢室
        active_room = RoomFactory.create(session)
        assert active_room.is_active is True

        # 創建過期諮詢室
        expired_room = RoomFactory.create_expired(session)
        assert expired_room.is_active is False

    @pytest.mark.skip(reason="Card events feature is disabled")
    def test_visitor_operations(self, client: TestClient, session: Session):
        """測試訪客操作 - 使用多個 Factory"""
        # 快速設置測試環境
        counselor = UserFactory.create_counselor(session)
        room = RoomFactory.create(session, counselor=counselor)
        visitor = VisitorFactory.create(session, room=room, name="小明")

        # 訪客創建牌卡事件
        response = client.post(
            "/api/card-events/",
            json={
                "room_id": str(room.id),  # Convert UUID to string
                "event_type": "card_flipped",
                "card_id": "test_card",
                "performer_type": "visitor",
                "performer_id": str(visitor.id),  # Convert UUID to string
                "performer_name": visitor.name,
            },
        )
        assert response.status_code == 201  # 201 Created for new resource

        # 使用 Factory 創建更多事件
        # CardEventFactory.create_flip_event(
        #     session, room, performer_id=str(visitor.id)
        # )
        # CardEventFactory.create_move_event(
        #     session, room, performer_id=str(visitor.id)
        # )
        # CardEventFactory.create_arrange_event(
        #     session, room, "disadvantage", performer_id=str(visitor.id)
        # )

        # 驗證事件數量
        headers = create_auth_headers(counselor)
        response = client.get(f"/api/card-events/room/{room.id}", headers=headers)
        events = response.json()
        assert len(events) >= 4

    def test_multiple_rooms_scenario(self, session: Session):
        """測試多諮詢室場景 - 展示 Factory 的靈活性"""
        # 一個諮詢師創建多個諮詢室
        counselor = UserFactory.create_counselor(session, name="資深諮詢師")

        rooms = [
            RoomFactory.create(session, counselor, name=f"諮詢室 {i + 1}")
            for i in range(3)
        ]

        # 每個諮詢室有不同數量的訪客
        for i, room in enumerate(rooms):
            for j in range(i + 1):  # 第一個諮詢室1個訪客，第二個2個，依此類推
                VisitorFactory.create(session, room, name=f"諮詢室{i + 1}訪客{j + 1}")

        # 驗證
        assert len(rooms) == 3
        assert all(r.counselor_id == counselor.id for r in rooms)  # Compare as strings

        # 在 session 中查詢驗證
        from sqlmodel import select

        from app.models.visitor import Visitor

        room1_visitors = session.exec(
            select(Visitor).where(Visitor.room_id == str(rooms[0].id))
        ).all()
        room2_visitors = session.exec(
            select(Visitor).where(Visitor.room_id == str(rooms[1].id))
        ).all()
        room3_visitors = session.exec(
            select(Visitor).where(Visitor.room_id == str(rooms[2].id))
        ).all()

        assert len(room1_visitors) == 1
        assert len(room2_visitors) == 2
        assert len(room3_visitors) == 3
