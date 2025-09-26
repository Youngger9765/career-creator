"""
User roles and permissions
用戶角色與權限定義
"""

from enum import Enum
from typing import List, Set


class UserRole(str, Enum):
    """User role definitions"""

    COUNSELOR = "counselor"  # 諮詢師 - 主導諮詢、開諮詢室
    CLIENT = "client"  # 來談者/當事人 - 接受諮詢
    OBSERVER = "observer"  # 觀察員 - 純觀摩，無操作權限
    ADMIN = "admin"  # 管理員 - 系統管理權限


class Permission(str, Enum):
    """Permission definitions"""

    # Room permissions
    CREATE_ROOM = "create_room"
    JOIN_ROOM = "join_room"
    DELETE_ROOM = "delete_room"

    # Card permissions
    MOVE_CARD = "move_card"
    FLIP_CARD = "flip_card"
    ANNOTATE_CARD = "annotate_card"

    # Chat permissions
    SEND_MESSAGE = "send_message"
    VIEW_CHAT = "view_chat"

    # CRM permissions
    MANAGE_CLIENTS = "manage_clients"

    # Admin permissions
    MANAGE_USERS = "manage_users"
    VIEW_ANALYTICS = "view_analytics"


# Role-Permission mapping
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.COUNSELOR: {
        Permission.CREATE_ROOM,
        Permission.JOIN_ROOM,
        Permission.MOVE_CARD,
        Permission.FLIP_CARD,
        Permission.ANNOTATE_CARD,
        Permission.SEND_MESSAGE,
        Permission.VIEW_CHAT,
        Permission.MANAGE_CLIENTS,
    },
    UserRole.CLIENT: {
        Permission.JOIN_ROOM,
        Permission.MOVE_CARD,
        Permission.FLIP_CARD,
        Permission.SEND_MESSAGE,
        Permission.VIEW_CHAT,
    },
    UserRole.OBSERVER: {
        Permission.JOIN_ROOM,
        Permission.VIEW_CHAT,
        # 觀察員不能操作卡牌或發言
    },
    UserRole.ADMIN: {
        # Admin has all permissions
        Permission.CREATE_ROOM,
        Permission.JOIN_ROOM,
        Permission.DELETE_ROOM,
        Permission.MOVE_CARD,
        Permission.FLIP_CARD,
        Permission.ANNOTATE_CARD,
        Permission.SEND_MESSAGE,
        Permission.VIEW_CHAT,
        Permission.MANAGE_USERS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_CLIENTS,
    },
}


def has_permission(user_roles: List[str], permission: Permission) -> bool:
    """Check if user with given roles has specific permission"""
    for role_str in user_roles:
        try:
            role = UserRole(role_str)
            if permission in ROLE_PERMISSIONS.get(role, set()):
                return True
        except ValueError:
            # Invalid role, skip
            continue
    return False


def get_user_permissions(user_roles: List[str]) -> Set[Permission]:
    """Get all permissions for user with given roles"""
    permissions = set()
    for role_str in user_roles:
        try:
            role = UserRole(role_str)
            permissions.update(ROLE_PERMISSIONS.get(role, set()))
        except ValueError:
            # Invalid role, skip
            continue
    return permissions
