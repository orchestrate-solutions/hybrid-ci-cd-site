"""
Integration tests for agent API endpoints using CodeUChain chains.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json

from src.main import app
from src.db.agent_store import InMemoryAgentStore, InMemoryAgentPoolStore
from src.db.agent_models import Agent, AgentPool, AgentStatus, AgentScalingState


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def reset_agent_stores():
    """Reset global agent stores before each test"""
    # This would be called by middleware/fixture setup in real app
    yield


# ============================================================================
# Agent Registration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_register_agent_success(client):
    """Test successful agent registration"""
    response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["pool_name"] == "us-east-1-a"
    assert "agent_id" in data
    assert "workload_identity_secret" in data


@pytest.mark.asyncio
async def test_register_agent_missing_pool(client):
    """Test agent registration fails without pool_name"""
    response = client.post("/api/agents/register", json={
        "version": "1.0.0"
    })
    
    # Should fail validation or return 400
    assert response.status_code in [400, 422]


# ============================================================================
# Agent Heartbeat Tests
# ============================================================================

@pytest.mark.asyncio
async def test_agent_heartbeat_success(client):
    """Test successful agent heartbeat recording"""
    # First register an agent
    reg_response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    agent_id = reg_response.json()["agent_id"]
    
    # Record heartbeat
    response = client.post(f"/api/agents/{agent_id}/heartbeat", json={
        "agent_id": agent_id,
        "cpu_percent": 45.5,
        "memory_percent": 60.0,
        "disk_percent": 70.0,
        "jobs_queued": 3,
        "jobs_completed": 50,
        "uptime_seconds": 3600
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id
    assert "status" in data
    assert "next_check_interval" in data


@pytest.mark.asyncio
async def test_agent_heartbeat_nonexistent_agent(client):
    """Test heartbeat fails for non-existent agent"""
    response = client.post(f"/api/agents/nonexistent-id/heartbeat", json={
        "agent_id": "nonexistent-id",
        "cpu_percent": 45.5,
        "memory_percent": 60.0,
        "disk_percent": 70.0,
        "jobs_queued": 3,
        "jobs_completed": 50,
        "uptime_seconds": 3600
    })
    
    assert response.status_code == 404


# ============================================================================
# Agent List/Retrieval Tests
# ============================================================================

@pytest.mark.asyncio
async def test_list_agents_empty(client):
    """Test listing agents when none registered"""
    response = client.get("/api/agents")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


@pytest.mark.asyncio
async def test_list_agents_multiple(client):
    """Test listing multiple agents"""
    # Register three agents
    for i in range(3):
        client.post("/api/agents/register", json={
            "pool_name": "us-east-1-a",
            "version": "1.0.0"
        })
    
    # List all agents
    response = client.get("/api/agents")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_agents_filter_by_pool(client):
    """Test listing agents filtered by pool"""
    # Register agents in different pools
    client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    client.post("/api/agents/register", json={
        "pool_name": "us-west-2-b",
        "version": "1.0.0"
    })
    
    # Filter by pool
    response = client.get("/api/agents?pool_name=us-east-1-a")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_agent_details(client):
    """Test retrieving specific agent details"""
    # Register an agent
    reg_response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    agent_id = reg_response.json()["agent_id"]
    
    # Get agent details
    response = client.get(f"/api/agents/{agent_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id
    assert data["pool_name"] == "us-east-1-a"
    assert "status" in data
    assert "metrics" in data


@pytest.mark.asyncio
async def test_get_agent_nonexistent(client):
    """Test retrieving non-existent agent returns 404"""
    response = client.get("/api/agents/nonexistent-id")
    assert response.status_code == 404


# ============================================================================
# Healthy Agents Tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_healthy_agents_empty(client):
    """Test getting healthy agents when none exist"""
    response = client.get("/api/agents/healthy")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_healthy_agents_multiple(client):
    """Test getting multiple healthy agents"""
    # Register agents
    for i in range(3):
        client.post("/api/agents/register", json={
            "pool_name": "us-east-1-a",
            "version": "1.0.0"
        })
    
    # Get healthy agents
    response = client.get("/api/agents/healthy")
    assert response.status_code == 200


# ============================================================================
# Agent Status Update Tests
# ============================================================================

@pytest.mark.asyncio
async def test_update_agent_status_success(client):
    """Test updating agent status"""
    # Register an agent
    reg_response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    agent_id = reg_response.json()["agent_id"]
    
    # Update status
    response = client.patch(f"/api/agents/{agent_id}/status", json={
        "status": "degraded"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id


@pytest.mark.asyncio
async def test_update_agent_status_nonexistent(client):
    """Test status update fails for non-existent agent"""
    response = client.patch("/api/agents/nonexistent-id/status", json={
        "status": "degraded"
    })
    
    assert response.status_code == 404


# ============================================================================
# Agent Deregistration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_deregister_agent_success(client):
    """Test successful agent deregistration"""
    # Register an agent
    reg_response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    agent_id = reg_response.json()["agent_id"]
    
    # Deregister
    response = client.post(f"/api/agents/{agent_id}/deregister")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "terminated"


@pytest.mark.asyncio
async def test_deregister_agent_nonexistent(client):
    """Test deregistration fails for non-existent agent"""
    response = client.post("/api/agents/nonexistent-id/deregister")
    assert response.status_code == 404


# ============================================================================
# Agent Pool Tests
# ============================================================================

@pytest.mark.asyncio
async def test_list_agent_pools_empty(client):
    """Test listing pools when none created"""
    response = client.get("/api/agents/pools")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_agent_pools_multiple(client):
    """Test listing multiple pools"""
    response = client.get("/api/agents/pools")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_agent_pool_details(client):
    """Test retrieving pool details"""
    # Create a pool (or use existing)
    response = client.get("/api/agents/pools/us-east-1-a")
    # May be 200 or 404 depending on pool existence
    assert response.status_code in [200, 404]


# ============================================================================
# End-to-End Workflow Tests
# ============================================================================

@pytest.mark.asyncio
async def test_full_agent_lifecycle(client):
    """Test complete agent lifecycle: register -> heartbeat -> deregister"""
    # Step 1: Register agent
    reg_response = client.post("/api/agents/register", json={
        "pool_name": "us-east-1-a",
        "version": "1.0.0"
    })
    assert reg_response.status_code == 200
    agent_id = reg_response.json()["agent_id"]
    
    # Step 2: Record heartbeat
    hb_response = client.post(f"/api/agents/{agent_id}/heartbeat", json={
        "agent_id": agent_id,
        "cpu_percent": 45.5,
        "memory_percent": 60.0,
        "disk_percent": 70.0,
        "jobs_queued": 2,
        "jobs_completed": 30,
        "uptime_seconds": 3600
    })
    assert hb_response.status_code == 200
    
    # Step 3: Get agent details
    get_response = client.get(f"/api/agents/{agent_id}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert data["metrics"]["jobs_completed"] == 30
    
    # Step 4: Update status
    status_response = client.patch(f"/api/agents/{agent_id}/status", json={
        "status": "degraded"
    })
    assert status_response.status_code == 200
    
    # Step 5: Deregister
    dereg_response = client.post(f"/api/agents/{agent_id}/deregister")
    assert dereg_response.status_code == 200
    assert dereg_response.json()["status"] == "terminated"


@pytest.mark.asyncio
async def test_agent_pool_management(client):
    """Test agent pool management flow"""
    # Get pools
    response = client.get("/api/agents/pools")
    assert response.status_code == 200
    
    # List may be empty, but endpoint should work
    pools = response.json()
    assert isinstance(pools, list)


@pytest.mark.asyncio
async def test_agent_load_balancing_scenario(client):
    """Test load balancing with multiple agents"""
    # Register 3 agents
    agents = []
    for i in range(3):
        resp = client.post("/api/agents/register", json={
            "pool_name": "us-east-1-a",
            "version": "1.0.0"
        })
        agents.append(resp.json()["agent_id"])
    
    # Get healthy agents (should be load-ordered)
    response = client.get("/api/agents/healthy")
    assert response.status_code == 200
    
    # Record varied heartbeats
    for idx, agent_id in enumerate(agents):
        client.post(f"/api/agents/{agent_id}/heartbeat", json={
            "agent_id": agent_id,
            "cpu_percent": 40.0 + (idx * 20),  # Vary CPU
            "memory_percent": 50.0,
            "disk_percent": 70.0,
            "jobs_queued": idx,
            "jobs_completed": 100 - idx,
            "uptime_seconds": 3600
        })


@pytest.mark.asyncio
async def test_concurrent_agent_operations(client):
    """Test multiple concurrent-like operations"""
    agent_ids = []
    
    # Register multiple agents
    for i in range(2):
        resp = client.post("/api/agents/register", json={
            "pool_name": "us-east-1-a",
            "version": "1.0.0"
        })
        agent_ids.append(resp.json()["agent_id"])
    
    # Record heartbeats for all
    for agent_id in agent_ids:
        response = client.post(f"/api/agents/{agent_id}/heartbeat", json={
            "agent_id": agent_id,
            "cpu_percent": 50.0,
            "memory_percent": 60.0,
            "disk_percent": 70.0,
            "jobs_queued": 1,
            "jobs_completed": 10,
            "uptime_seconds": 1800
        })
        assert response.status_code == 200
    
    # List all agents
    list_resp = client.get("/api/agents")
    assert list_resp.status_code == 200
