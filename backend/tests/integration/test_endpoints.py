"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_info(client):
    """Test info endpoint."""
    response = client.get("/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] is not None
    assert data["version"] is not None
    assert data["environment"] is not None


@pytest.mark.asyncio
async def test_create_session(client):
    """Test session creation endpoint."""
    response = client.post(
        "/auth/session",
        json={
            "user_id": "user123",
            "provider": "google",
            "oauth_tokens": {"access_token": "test_token"},
            "user_info": {"email": "user@example.com"},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] is not None
    assert data["user_id"] == "user123"
    assert data["provider"] == "google"


@pytest.mark.asyncio
async def test_validate_session(client):
    """Test session validation endpoint."""
    # Create session
    create_response = client.post(
        "/auth/session",
        json={
            "user_id": "user123",
            "provider": "google",
            "oauth_tokens": {"access_token": "test_token"},
            "user_info": {"email": "user@example.com"},
        },
    )
    session_id = create_response.json()["session_id"]
    
    # Validate session
    validate_response = client.post(
        "/auth/validate",
        json={"session_id": session_id},
    )
    assert validate_response.status_code == 200
    data = validate_response.json()
    assert data["valid"] is True
    assert data["user_id"] == "user123"


@pytest.mark.asyncio
async def test_logout(client):
    """Test logout endpoint."""
    # Create session
    create_response = client.post(
        "/auth/session",
        json={
            "user_id": "user123",
            "provider": "google",
            "oauth_tokens": {"access_token": "test_token"},
            "user_info": {"email": "user@example.com"},
        },
    )
    session_id = create_response.json()["session_id"]
    
    # Logout
    logout_response = client.post(
        f"/auth/logout?session_id={session_id}",
    )
    assert logout_response.status_code == 200
    
    # Validate should fail
    validate_response = client.post(
        "/auth/validate",
        json={"session_id": session_id},
    )
    assert validate_response.json()["valid"] is False


@pytest.mark.asyncio
async def test_get_agent_config(client):
    """Test agent config endpoint."""
    response = client.get("/agents/agent123/config")
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == "agent123"


@pytest.mark.asyncio
async def test_agent_heartbeat(client):
    """Test agent heartbeat endpoint."""
    response = client.post(
        "/agents/agent123/heartbeat",
        json={
            "agent_id": "agent123",
            "cpu_percent": 42.5,
            "memory_percent": 58.0,
            "disk_percent": 12.0,
            "jobs_queued": 5,
            "jobs_completed": 100,
            "uptime_seconds": 3600,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"


@pytest.mark.asyncio
async def test_list_jobs(client):
    """Test job list endpoint."""
    response = client.get("/jobs?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_job(client):
    """Test job creation endpoint."""
    response = client.post(
        "/jobs?git_ref=main",
    )
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert "status" in data
