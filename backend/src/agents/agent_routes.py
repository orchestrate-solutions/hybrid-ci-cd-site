"""
Agent Lifecycle API routes for agent registration, health checking, and pool management.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from src.db.agent_store import InMemoryAgentStore, InMemoryAgentPoolStore, AgentStoreInterface, AgentPoolStoreInterface
from src.components.chains.agent_chains import (
    AgentRegistrationChain, AgentHeartbeatChain, ListAgentsChain,
    GetHealthyAgentsChain, AgentStatusUpdateChain, AgentDeregistrationChain
)
from src.core.config import settings


logger = logging.getLogger(__name__)

# Initialize stores (in-memory for now, DynamoDB in production)
_agent_store: AgentStoreInterface = InMemoryAgentStore()
_agent_pool_store: AgentPoolStoreInterface = InMemoryAgentPoolStore()

# Initialize CodeUChain chains
_agent_registration_chain = AgentRegistrationChain(_agent_store)
_agent_heartbeat_chain = AgentHeartbeatChain(_agent_store)
_list_agents_chain = ListAgentsChain(_agent_store)
_get_healthy_agents_chain = GetHealthyAgentsChain(_agent_store)
_agent_status_update_chain = AgentStatusUpdateChain(_agent_store)
_agent_deregistration_chain = AgentDeregistrationChain(_agent_store)


# ============================================================================
# Request/Response Models
# ============================================================================

class AgentRegistrationRequest(BaseModel):
    """Request to register a new agent"""
    pool_name: str  # e.g., "us-east-1-a"
    version: Optional[str] = "1.0.0"


class AgentRegistrationResponse(BaseModel):
    """Response for agent registration"""
    agent_id: str
    pool_name: str
    status: str
    workload_identity_secret: Optional[str] = None  # Only in registration response
    registered_at: str


class AgentHeartbeatRequest(BaseModel):
    """Agent heartbeat data"""
    agent_id: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    jobs_queued: int
    jobs_completed: int
    uptime_seconds: int


class AgentHeartbeatResponse(BaseModel):
    """Response for agent heartbeat"""
    agent_id: str
    status: str
    next_check_interval: int = 30


class AgentResponse(BaseModel):
    """Agent response model"""
    agent_id: str
    pool_name: str
    status: str
    registered_at: str
    last_heartbeat: str
    current_job_count: int
    max_concurrent_jobs: int


class AgentStatusUpdateRequest(BaseModel):
    """Request to update agent status"""
    status: str  # e.g., "healthy", "degraded", "offline"


class AgentDeregistrationRequest(BaseModel):
    """Request to deregister an agent"""
    reason: Optional[str] = "Agent requested deregistration"


class AgentPoolResponse(BaseModel):
    """Agent pool response model"""
    pool_name: str
    region: str
    zone: str
    active_agents: int
    idle_agents: int
    unhealthy_agents: int
    current_agent_count: int
    desired_agent_count: int
    enabled: bool


# ============================================================================
# Agent Endpoints
# ============================================================================

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/register", response_model=Dict[str, Any])
async def register_agent(request: AgentRegistrationRequest) -> Dict[str, Any]:
    """Register a new agent (powered by CodeUChain)"""
    request_data = {
        "pool_name": request.pool_name,
        "version": request.version or "1.0.0"
    }
    
    result = await _agent_registration_chain.run(request_data)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Include workload identity secret in registration response only
    response = result.copy()
    if result.get("agent_id"):
        agent = await _agent_store.get_agent(result["agent_id"])
        if agent:
            response["workload_identity_secret"] = agent.workload_identity_secret
    
    return response


@router.get("", response_model=Dict[str, Any])
async def list_agents(
    pool_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=1000)
) -> Dict[str, Any]:
    """List agents with optional filtering (powered by CodeUChain)"""
    return await _list_agents_chain.run(pool_name=pool_name, status=status, limit=limit)


@router.get("/healthy", response_model=Dict[str, Any])
async def get_healthy_agents(limit: int = Query(100, le=1000)) -> Dict[str, Any]:
    """Get healthy agents available for job dispatch (powered by CodeUChain)"""
    return await _get_healthy_agents_chain.run(limit=limit)


@router.get("/pools", response_model=List[Dict[str, Any]])
async def list_agent_pools() -> List[Dict[str, Any]]:
    """List all agent pools"""
    pools = await _agent_pool_store.list_pools()
    
    return [
        {
            "pool_name": p.pool_name,
            "region": p.region,
            "zone": p.zone,
            "min_agents": p.min_agents,
            "max_agents": p.max_agents,
            "current_agent_count": p.current_agent_count,
            "active_agents": p.active_agents,
            "idle_agents": p.idle_agents,
            "unhealthy_agents": p.unhealthy_agents,
            "enabled": p.enabled,
        }
        for p in pools
    ]


@router.post("/{agent_id}/heartbeat", response_model=Dict[str, Any])
async def agent_heartbeat(agent_id: str, request: AgentHeartbeatRequest) -> Dict[str, Any]:
    """Record agent heartbeat and metrics (powered by CodeUChain)"""
    heartbeat_data = {
        "agent_id": agent_id,
        "cpu_percent": request.cpu_percent,
        "memory_percent": request.memory_percent,
        "disk_percent": request.disk_percent,
        "jobs_queued": request.jobs_queued,
        "jobs_completed": request.jobs_completed,
        "uptime_seconds": request.uptime_seconds,
    }
    
    result = await _agent_heartbeat_chain.run(heartbeat_data)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "agent_id": result.get("agent_id"),
        "status": result.get("status"),
        "next_check_interval": 30,  # Check in 30 seconds
    }


@router.get("/{agent_id}", response_model=Dict[str, Any])
async def get_agent(agent_id: str) -> Dict[str, Any]:
    """Get agent details"""
    agent = await _agent_store.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    return {
        "agent_id": agent.agent_id,
        "pool_name": agent.pool_name,
        "status": agent.status.value,
        "scaling_state": agent.scaling_state.value,
        "version": agent.version,
        "registered_at": agent.registered_at.isoformat(),
        "last_heartbeat": agent.last_heartbeat.isoformat(),
        "current_job_count": agent.current_job_count,
        "max_concurrent_jobs": agent.max_concurrent_jobs,
        "metrics": agent.metrics.to_dict(),
    }


@router.patch("/{agent_id}/status", response_model=Dict[str, Any])
async def update_agent_status(agent_id: str, request: AgentStatusUpdateRequest) -> Dict[str, Any]:
    """Update agent status (powered by CodeUChain)"""
    result = await _agent_status_update_chain.run(agent_id, request.status)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "agent_id": result.get("agent_id"),
        "status": result.get("status"),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.post("/{agent_id}/deregister", response_model=Dict[str, Any])
async def deregister_agent(agent_id: str, request: Optional[AgentDeregistrationRequest] = None) -> Dict[str, Any]:
    """Deregister an agent (powered by CodeUChain)"""
    result = await _agent_deregistration_chain.run(agent_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "agent_id": result.get("agent_id"),
        "status": "terminated",
        "deregistered_at": datetime.utcnow().isoformat(),
    }


@router.get("/pools/{pool_name}", response_model=Dict[str, Any])
async def get_agent_pool(pool_name: str) -> Dict[str, Any]:
    """Get agent pool details"""
    pool = await _agent_pool_store.get_pool(pool_name)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool {pool_name} not found")
    
    # Get agents in pool
    agents = await _agent_store.get_agents_by_pool(pool_name)
    
    return {
        "pool_name": pool.pool_name,
        "region": pool.region,
        "zone": pool.zone,
        "min_agents": pool.min_agents,
        "max_agents": pool.max_agents,
        "current_agent_count": pool.current_agent_count,
        "active_agents": pool.active_agents,
        "idle_agents": pool.idle_agents,
        "unhealthy_agents": pool.unhealthy_agents,
        "desired_agent_count": pool.desired_agent_count,
        "enabled": pool.enabled,
        "agents": [
            {
                "agent_id": a.agent_id,
                "status": a.status.value,
                "current_job_count": a.current_job_count,
            }
            for a in agents
        ],
    }
