"""
Comprehensive permission testing
完整權限測試 - 基於角色系統
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from uuid import uuid4

from app.main import app
from app.core.database import get_session
from app.core.roles import UserRole, Permission, has_permission, get_user_permissions
from app.models.user import User
from tests.helpers import create_auth_headers


@pytest.fixture(name="session")
def session_fixture():
    """Create test database session"""
    engine = create_engine(
        "sqlite://", 
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with dependency override"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def create_user_with_role(session: Session, role: str, email_suffix: str = None) -> User:
    """Helper to create user with specific role"""
    suffix = email_suffix or role
    user = User(
        id=uuid4(),
        email=f"{suffix}@test.com",
        hashed_password="password123",
        name=f"Test {role.title()}",
        roles=[role],
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestRolePermissions:
    """Test role-based permissions"""
    
    def test_counselor_permissions(self):
        """Test counselor role permissions"""
        permissions = get_user_permissions(["counselor"])
        
        expected_permissions = {
            Permission.CREATE_ROOM,
            Permission.JOIN_ROOM,
            Permission.MOVE_CARD,
            Permission.FLIP_CARD,
            Permission.ANNOTATE_CARD,
            Permission.SEND_MESSAGE,
            Permission.VIEW_CHAT,
        }
        
        assert permissions == expected_permissions
        
        # Test individual permissions
        assert has_permission(["counselor"], Permission.CREATE_ROOM)
        assert has_permission(["counselor"], Permission.MOVE_CARD)
        assert not has_permission(["counselor"], Permission.MANAGE_USERS)
    
    def test_client_permissions(self):
        """Test client role permissions"""
        permissions = get_user_permissions(["client"])
        
        expected_permissions = {
            Permission.JOIN_ROOM,
            Permission.MOVE_CARD,
            Permission.FLIP_CARD,
            Permission.SEND_MESSAGE,
            Permission.VIEW_CHAT,
        }
        
        assert permissions == expected_permissions
        
        # Client cannot create rooms
        assert not has_permission(["client"], Permission.CREATE_ROOM)
        assert not has_permission(["client"], Permission.MANAGE_USERS)
    
    def test_observer_permissions(self):
        """Test observer role permissions (minimal)"""
        permissions = get_user_permissions(["observer"])
        
        expected_permissions = {
            Permission.JOIN_ROOM,
            Permission.VIEW_CHAT,
        }
        
        assert permissions == expected_permissions
        
        # Observer cannot interact with cards
        assert not has_permission(["observer"], Permission.MOVE_CARD)
        assert not has_permission(["observer"], Permission.FLIP_CARD)
        assert not has_permission(["observer"], Permission.SEND_MESSAGE)
        assert not has_permission(["observer"], Permission.CREATE_ROOM)
    
    def test_admin_permissions(self):
        """Test admin role permissions (all)"""
        permissions = get_user_permissions(["admin"])
        
        # Admin should have all permissions
        all_permissions = set(Permission)
        assert permissions == all_permissions
        
        # Test specific admin permissions
        assert has_permission(["admin"], Permission.MANAGE_USERS)
        assert has_permission(["admin"], Permission.VIEW_ANALYTICS)
        assert has_permission(["admin"], Permission.DELETE_ROOM)
    
    def test_multi_role_permissions(self):
        """Test user with multiple roles gets combined permissions"""
        permissions = get_user_permissions(["client", "observer"])
        
        # Should get union of both roles
        expected_permissions = {
            Permission.JOIN_ROOM,
            Permission.MOVE_CARD,
            Permission.FLIP_CARD,
            Permission.SEND_MESSAGE,
            Permission.VIEW_CHAT,
        }
        
        assert permissions == expected_permissions
    
    def test_invalid_role_handling(self):
        """Test handling of invalid roles"""
        permissions = get_user_permissions(["invalid_role", "counselor"])
        
        # Should only get permissions from valid roles
        expected_permissions = {
            Permission.CREATE_ROOM,
            Permission.JOIN_ROOM,
            Permission.MOVE_CARD,
            Permission.FLIP_CARD,
            Permission.ANNOTATE_CARD,
            Permission.SEND_MESSAGE,
            Permission.VIEW_CHAT,
        }
        
        assert permissions == expected_permissions
        
        # Invalid role should return False
        assert not has_permission(["invalid_role"], Permission.CREATE_ROOM)


class TestAPIPermissionEnforcement:
    """Test permission enforcement in actual API endpoints"""
    
    def test_room_creation_enforcement(self, client: TestClient, session: Session):
        """Test room creation permission enforcement"""
        
        # Create users with different roles
        counselor = create_user_with_role(session, "counselor")
        client_user = create_user_with_role(session, "client")
        observer = create_user_with_role(session, "observer")
        admin = create_user_with_role(session, "admin")
        
        room_data = {"name": "Permission Test Room"}
        
        # Counselor can create room
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(counselor)
        )
        assert response.status_code == 201
        
        # Admin can create room
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(admin)
        )
        assert response.status_code == 201
        
        # Client cannot create room
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(client_user)
        )
        assert response.status_code == 403
        assert "Only counselors can create rooms" in response.json()["detail"]
        
        # Observer cannot create room
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(observer)
        )
        assert response.status_code == 403
    
    def test_room_management_permissions(self, client: TestClient, session: Session):
        """Test room update/delete permissions"""
        
        counselor = create_user_with_role(session, "counselor")
        another_counselor = create_user_with_role(session, "counselor", "counselor2")
        admin = create_user_with_role(session, "admin")
        client_user = create_user_with_role(session, "client")
        
        # Counselor creates room
        room_data = {"name": "Test Room"}
        response = client.post(
            "/api/rooms",
            json=room_data,
            headers=create_auth_headers(counselor)
        )
        assert response.status_code == 201
        room_id = response.json()["id"]
        
        update_data = {"name": "Updated Room"}
        
        # Room owner can update
        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(counselor)
        )
        assert response.status_code == 200
        
        # Admin can update any room
        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(admin)
        )
        assert response.status_code == 200
        
        # Different counselor cannot update others' rooms
        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(another_counselor)
        )
        assert response.status_code == 403
        
        # Client cannot update room
        response = client.put(
            f"/api/rooms/{room_id}",
            json=update_data,
            headers=create_auth_headers(client_user)
        )
        assert response.status_code == 403


class TestRoleEvolution:
    """Test role changes and their effects"""
    
    def test_user_role_management(self, session: Session):
        """Test user role addition/removal"""
        
        user = create_user_with_role(session, "client")
        
        # Initially only client permissions
        assert user.has_role("client")
        assert not user.has_role("counselor")
        
        # Add counselor role
        user.add_role("counselor")
        session.add(user)
        session.commit()
        
        assert user.has_role("client")
        assert user.has_role("counselor")
        
        # Remove client role
        user.remove_role("client")
        session.add(user)
        session.commit()
        
        assert not user.has_role("client")
        assert user.has_role("counselor")
        
        # Try to remove non-existent role (should not error)
        user.remove_role("admin")  # User never had admin role
        
        # Try to add duplicate role (should not duplicate)
        original_length = len(user.roles)
        user.add_role("counselor")  # Already has counselor
        assert len(user.roles) == original_length
    
    def test_role_upgrade_workflow(self, client: TestClient, session: Session):
        """Test workflow when user role is upgraded"""
        
        # Start as client
        user = create_user_with_role(session, "client")
        
        # Cannot create room initially
        response = client.post(
            "/api/rooms",
            json={"name": "Test Room"},
            headers=create_auth_headers(user)
        )
        assert response.status_code == 403
        
        # Upgrade to counselor
        user.add_role("counselor")
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Now can create room
        response = client.post(
            "/api/rooms",
            json={"name": "Test Room"},
            headers=create_auth_headers(user)
        )
        assert response.status_code == 201