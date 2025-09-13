"""
Authentication API tests
認證系統測試 - Demo 帳號登入
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.core.database import get_session
from app.models.user import User


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


class TestAuthAPI:
    """Test authentication API endpoints"""
    
    def test_get_demo_accounts(self, client: TestClient):
        """Test getting demo account list"""
        response = client.get("/api/auth/demo-accounts")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 2  # At least 2 demo accounts
        
        # Check demo account structure
        demo_account = data[0]
        assert "id" in demo_account
        assert "name" in demo_account
        assert "email" in demo_account
        assert "roles" in demo_account
        assert "description" in demo_account
        # Password should not be exposed
        assert "password" not in demo_account
        assert "hashed_password" not in demo_account
    
    def test_login_with_demo_account(self, client: TestClient):
        """Test login with demo account credentials"""
        
        # First get demo accounts
        response = client.get("/api/auth/demo-accounts")
        demo_accounts = response.json()
        demo_account = demo_accounts[0]
        
        # Login with demo credentials
        login_data = {
            "email": demo_account["email"],
            "password": "demo123"  # Demo password
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        
        user = data["user"]
        assert user["email"] == demo_account["email"]
        assert user["name"] == demo_account["name"]
        assert user["roles"] == demo_account["roles"]
    
    def test_login_with_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials"""
        
        login_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials"""
        
        # Missing password
        response = client.post("/api/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 422
        
        # Missing email
        response = client.post("/api/auth/login", json={"password": "password"})
        assert response.status_code == 422
        
        # Empty request
        response = client.post("/api/auth/login", json={})
        assert response.status_code == 422
    
    def test_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token"""
        
        # Try to create room without authentication header
        response = client.post("/api/rooms", json={"name": "Test Room"})
        # Should return 401 (Unauthorized) when no token is provided
        assert response.status_code == 401
    
    def test_protected_endpoint_with_token(self, client: TestClient):
        """Test accessing protected endpoint with valid token"""
        
        # Login first
        demo_accounts = client.get("/api/auth/demo-accounts").json()
        demo_account = demo_accounts[0]  # Get counselor demo account
        
        login_data = {
            "email": demo_account["email"],
            "password": "demo123"
        }
        
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Use token to access protected endpoint
        response = client.post(
            "/api/rooms",
            json={"name": "Test Room"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should succeed if demo account has counselor role
        if "counselor" in demo_account["roles"]:
            assert response.status_code == 201
        else:
            assert response.status_code == 403
    
    def test_get_current_user(self, client: TestClient):
        """Test getting current user info"""
        
        # Login first
        demo_accounts = client.get("/api/auth/demo-accounts").json()
        demo_account = demo_accounts[0]
        
        login_data = {
            "email": demo_account["email"],
            "password": "demo123"
        }
        
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        user_data = response.json()
        
        assert user_data["email"] == demo_account["email"]
        assert user_data["name"] == demo_account["name"]
        assert user_data["roles"] == demo_account["roles"]
        assert "id" in user_data
        assert "created_at" in user_data
    
    def test_token_expiration(self, client: TestClient):
        """Test that invalid token is rejected"""
        
        # Use invalid token
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401
        assert "detail" in response.json()


class TestDemoAccountSetup:
    """Test demo account configuration"""
    
    def test_demo_accounts_configuration(self):
        """Test that demo accounts are properly configured"""
        from app.core.auth import DEMO_ACCOUNTS, find_demo_account_by_email
        
        # Check that we have expected demo accounts
        assert len(DEMO_ACCOUNTS) >= 4
        
        # Check specific demo accounts exist
        demo_emails = [
            "demo.counselor@example.com",
            "demo.admin@example.com",
            "demo.client@example.com",
            "demo.counselor2@example.com"
        ]
        
        for email in demo_emails:
            demo_account = find_demo_account_by_email(email)
            assert demo_account is not None, f"Demo account {email} should exist"
            assert "id" in demo_account
            assert "name" in demo_account
            assert "roles" in demo_account
            assert "password" in demo_account
            assert demo_account["password"] == "demo123"