"""
First TDD test following Kent Beck's Canon TDD:
1. Write a failing test (Red)
2. Make it pass with simplest code (Green)
3. Refactor if needed
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test: API should return healthy status"""
    # Act
    response = client.get("/health")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data


def test_root_endpoint():
    """Test: Root endpoint should return welcome message"""
    # Act
    response = client.get("/")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Career Creator API"
    assert data["version"] == "1.0.0"
