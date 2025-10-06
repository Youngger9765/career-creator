"""
Test Factories - 測試資料工廠
使用 Factory 模式來創建測試資料，減少重複代碼
"""

import random
import string
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlmodel import Session

from app.core.auth import get_password_hash
# from app.models.card_event import CardEvent  # Disabled for now
from app.models.room import Room
from app.models.user import User
from app.models.visitor import Visitor


class UserFactory:
    """用戶工廠"""

    @staticmethod
    def create(
        session: Session,
        email: Optional[str] = None,
        password: str = "Test123456!",
        name: str = "Test User",
        roles: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> User:
        """創建測試用戶"""
        if email is None:
            email = f"user_{datetime.now().timestamp()}@test.com"

        if roles is None:
            roles = ["user"]

        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            name=name,
            roles=roles,
            **kwargs,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    @staticmethod
    def create_counselor(session: Session, **kwargs: Any) -> User:
        """創建諮詢師"""
        email = kwargs.get("email", f"counselor_{datetime.now().timestamp()}@test.com")
        name = kwargs.get("name", "Test Counselor")
        roles = kwargs.get("roles", ["counselor"])
        return UserFactory.create(session, email=email, name=name, roles=roles)

    @staticmethod
    def create_admin(session: Session, **kwargs: Any) -> User:
        """創建管理員"""
        email = kwargs.get("email", f"admin_{datetime.now().timestamp()}@test.com")
        name = kwargs.get("name", "Test Admin")
        roles = kwargs.get("roles", ["admin"])
        return UserFactory.create(session, email=email, name=name, roles=roles)


class RoomFactory:
    """諮詢室工廠"""

    @staticmethod
    def create(
        session: Session,
        counselor: Optional[User] = None,
        name: Optional[str] = None,
        **kwargs: Any,
    ) -> Room:
        """創建測試諮詢室"""
        if counselor is None:
            counselor = UserFactory.create_counselor(session)

        if name is None:
            name = f"Test Room {datetime.now().timestamp()}"

        # 生成隨機分享碼
        share_code = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )

        defaults = {
            "name": name,
            "counselor_id": counselor.id,  # UUID directly (refactored)
            "share_code": share_code,
            "is_active": True,
        }
        defaults.update(kwargs)

        room = Room(**defaults)
        session.add(room)
        session.commit()
        session.refresh(room)
        return room

    @staticmethod
    def create_expired(session: Session, **kwargs: Any) -> Room:
        """創建已過期的諮詢室"""
        kwargs["is_active"] = False
        return RoomFactory.create(session, **kwargs)


class VisitorFactory:
    """訪客工廠"""

    @staticmethod
    def create(
        session: Session,
        room: Optional[Room] = None,
        name: Optional[str] = None,
        **kwargs: Any,
    ) -> Visitor:
        """創建測試訪客"""
        if room is None:
            room = RoomFactory.create(session)

        if name is None:
            name = f"Visitor {datetime.now().timestamp()}"

        defaults = {
            "name": name,
            "room_id": room.id,  # UUID directly (refactored)
            "session_id": f"session_{datetime.now().timestamp()}",
            "is_active": True,
        }
        defaults.update(kwargs)

        visitor = Visitor(**defaults)
        session.add(visitor)
        session.commit()
        session.refresh(visitor)
        return visitor


# CardEventFactory - Disabled for now
# class CardEventFactory:
#     """牌卡事件工廠"""
#
#     @staticmethod
#     def create(
#         session: Session,
#         room: Optional[Room] = None,
#         event_type: str = "card_flipped",
#         **kwargs: Any,
#     ) -> CardEvent:
#         """創建測試牌卡事件"""
#         if room is None:
#             room = RoomFactory.create(session)
#
#         defaults = {
#             "room_id": room.id,  # UUID directly (refactored)
#             "event_type": event_type,
#             "card_id": f"card_{datetime.now().timestamp()}",
#             "performer_type": "user",
#             "sequence_number": 1,
#         }
#         defaults.update(kwargs)
#
#         event = CardEvent(**defaults)
#         session.add(event)
#         session.commit()
#         session.refresh(event)
#         return event
#
#     @staticmethod
#     def create_flip_event(session: Session, room: Room, **kwargs: Any) -> CardEvent:
#         """創建翻牌事件"""
#         kwargs.setdefault("event_type", "card_flipped")
#         kwargs.setdefault("event_data", {"face_up": True})
#         return CardEventFactory.create(session, room, **kwargs)
#
#     @staticmethod
#     def create_move_event(session: Session, room: Room, **kwargs: Any) -> CardEvent:
#         """創建移動事件"""
#         kwargs.setdefault("event_type", "card_moved")
#         kwargs.setdefault("event_data", {"position": {"x": 100, "y": 200}})
#         return CardEventFactory.create(session, room, **kwargs)
#
#     @staticmethod
#     def create_arrange_event(
#         session: Session, room: Room, zone: str = "advantage", **kwargs: Any
#     ) -> CardEvent:
#         """創建排列事件"""
#         kwargs.setdefault("event_type", "card_arranged")
#         kwargs.setdefault(
#             "event_data", {"drop_zone": zone, "position": {"x": 400, "y": 150}}
#         )
#         return CardEventFactory.create(session, room, **kwargs)
#
#     @staticmethod
#     def create_note_event(
#         session: Session, room: Room, notes: str = "Test note", **kwargs: Any
#     ) -> CardEvent:
#         """創建註記事件"""
#         kwargs.setdefault("event_type", "notes_added")
#         kwargs.setdefault("notes", notes)
#         return CardEventFactory.create(session, room, **kwargs)


class TestDataBuilder:
    """測試資料建構器 - 用於創建完整的測試場景"""

    def __init__(self, session: Session):
        self.session = session
        self.counselor: Optional[User] = None
        self.room: Optional[Room] = None
        self.visitors: List[Visitor] = []
        # self.events: List[CardEvent] = []  # Disabled - card events feature

    def with_counselor(self, **kwargs: Any) -> "TestDataBuilder":
        """添加諮詢師"""
        self.counselor = UserFactory.create_counselor(self.session, **kwargs)
        return self

    def with_room(self, **kwargs: Any) -> "TestDataBuilder":
        """添加諮詢室"""
        if self.counselor is None:
            self.with_counselor()
        self.room = RoomFactory.create(self.session, counselor=self.counselor, **kwargs)
        return self

    def with_visitors(self, count: int = 1, **kwargs: Any) -> "TestDataBuilder":
        """添加訪客"""
        if self.room is None:
            self.with_room()
        for i in range(count):
            visitor = VisitorFactory.create(
                self.session, room=self.room, name=f"Visitor {i + 1}", **kwargs
            )
            self.visitors.append(visitor)
        return self

    # Disabled - card events feature
    # def with_card_events(
    #     self, events_config: Optional[List[Dict[str, Any]]] = None
    # ) -> "TestDataBuilder":
    #     """添加牌卡事件"""
    #     if self.room is None:
    #         self.with_room()
    #
    #     if events_config is None:
    #         # 預設事件序列
    #         events_config = [
    #             {"type": "flip"},
    #             {"type": "move"},
    #             {"type": "arrange", "zone": "advantage"},
    #             {"type": "note", "notes": "Important observation"},
    #         ]
    #
    #     for config in events_config:
    #         event_type = config.pop("type", "flip")
    #         if event_type == "flip":
    #             event = CardEventFactory.create_flip_event(
    #                 self.session, self.room, **config
    #             )
    #         elif event_type == "move":
    #             event = CardEventFactory.create_move_event(
    #                 self.session, self.room, **config
    #             )
    #         elif event_type == "arrange":
    #             zone = config.pop("zone", "advantage")
    #             event = CardEventFactory.create_arrange_event(
    #                 self.session, self.room, zone, **config
    #             )
    #         elif event_type == "note":
    #             notes = config.pop("notes", "Test note")
    #             event = CardEventFactory.create_note_event(
    #                 self.session, self.room, notes, **config
    #             )
    #         else:
    #             event = CardEventFactory.create(
    #                 self.session, self.room, event_type=event_type, **config
    #             )
    #
    #         self.events.append(event)
    #
    #     return self

    def build(self) -> Dict[str, Any]:
        """建構並返回所有測試資料"""
        return {
            "counselor": self.counselor,
            "room": self.room,
            "visitors": self.visitors,
            # "events": self.events,  # Disabled - card events feature
        }
