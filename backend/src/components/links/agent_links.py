"""
CodeUChain links for agent lifecycle management.
"""

from codeuchain.core import Context, Link
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from src.db.agent_models import Agent, AgentStatus, AgentScalingState
from src.db.agent_store import AgentStoreInterface, AgentPoolStoreInterface


logger = logging.getLogger(__name__)


class ValidateAgentRegistrationLink(Link):
    """Link to validate agent registration request"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "pool_name": str,
            "version": str (optional)
        }
        
        Output: adds "validation_error" if invalid, otherwise None
        """
        errors = []
        
        if not ctx.get("pool_name"):
            errors.append("pool_name is required")
        if not ctx.get("version"):
            ctx = ctx.insert("version", "1.0.0")
        
        if errors:
            error_msg = "; ".join(errors)
            logger.warning(f"Agent registration validation failed: {error_msg}")
            return ctx.insert("validation_error", error_msg)
        
        return ctx.insert("validation_error", None)


class RegisterAgentLink(Link):
    """Link to register a new agent"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "pool_name": str,
            "version": str
        }
        
        Output: adds "agent" key with registered Agent object
        """
        pool_name = ctx.get("pool_name")
        version = ctx.get("version") or "1.0.0"
        
        agent = Agent.create(pool_name=pool_name, version=version)
        registered_agent = await self.agent_store.register_agent(agent)
        
        logger.info(f"Registered agent {registered_agent.agent_id}")
        return ctx.insert("agent", registered_agent)


class GetAgentLink(Link):
    """Link to retrieve an agent by ID"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agent_id": str
        }
        
        Output: adds "agent" key with Agent object, or None if not found
        """
        agent_id = ctx.get("agent_id")
        agent = await self.agent_store.get_agent(agent_id)
        
        if agent:
            logger.info(f"Retrieved agent {agent_id}")
        else:
            logger.warning(f"Agent {agent_id} not found")
        
        return ctx.insert("agent", agent)


class ListAgentsLink(Link):
    """Link to list agents with optional filtering"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "pool_name": str (optional),
            "status": str (optional),
            "limit": int (optional, default 100)
        }
        
        Output: adds "agents" key with list of Agent objects
        """
        pool_name = ctx.get("pool_name")
        status_str = ctx.get("status")
        status = AgentStatus(status_str) if status_str else None
        
        agents = await self.agent_store.list_agents(pool_name=pool_name, status=status)
        logger.info(f"Listed {len(agents)} agents")
        
        return ctx.insert("agents", agents)


class GetHealthyAgentsLink(Link):
    """Link to get healthy agents available for job assignment"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "limit": int (optional, default 100)
        }
        
        Output: adds "healthy_agents" key with list of healthy Agents sorted by load
        """
        limit = ctx.get("limit") or 100
        
        healthy_agents = await self.agent_store.get_healthy_agents(limit=limit)
        logger.info(f"Found {len(healthy_agents)} healthy agents")
        
        return ctx.insert("healthy_agents", healthy_agents)


class RecordAgentHeartbeatLink(Link):
    """Link to record agent heartbeat and update metrics"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agent_id": str,
            "cpu_percent": float,
            "memory_percent": float,
            "disk_percent": float,
            "jobs_queued": int,
            "jobs_completed": int,
            "uptime_seconds": int
        }
        
        Output: updates "agent" with heartbeat and metrics
        """
        agent_id = ctx.get("agent_id")
        cpu = ctx.get("cpu_percent") or 0.0
        memory = ctx.get("memory_percent") or 0.0
        disk = ctx.get("disk_percent") or 0.0
        jobs_queued = ctx.get("jobs_queued") or 0
        jobs_completed = ctx.get("jobs_completed") or 0
        uptime = ctx.get("uptime_seconds") or 0
        
        # Update metrics
        updated_agent = await self.agent_store.update_agent_metrics(
            agent_id=agent_id,
            cpu=cpu,
            memory=memory,
            disk=disk,
            jobs_queued=jobs_queued,
            jobs_completed=jobs_completed,
            uptime=uptime
        )
        
        # Determine health status based on metrics
        if updated_agent:
            if cpu > 90 or memory > 90 or disk > 95:
                new_status = AgentStatus.DEGRADED
            else:
                new_status = AgentStatus.HEALTHY
            
            await self.agent_store.update_agent_status(agent_id, new_status)
            logger.info(f"Recorded heartbeat for agent {agent_id}: CPU={cpu}%, MEM={memory}%, status={new_status.value}")
            
            # Re-fetch to get latest status
            updated_agent = await self.agent_store.get_agent(agent_id)
        
        return ctx.insert("agent", updated_agent)


class UpdateAgentStatusLink(Link):
    """Link to update agent status"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agent_id": str,
            "status": str (AgentStatus enum value)
        }
        
        Output: updates "agent" with new status
        """
        agent_id = ctx.get("agent_id")
        status_str = ctx.get("status")
        status = AgentStatus(status_str)
        
        updated_agent = await self.agent_store.update_agent_status(agent_id, status)
        
        if updated_agent:
            logger.info(f"Updated agent {agent_id} to status {status.value}")
            return ctx.insert("agent", updated_agent)
        else:
            logger.warning(f"Agent {agent_id} not found for status update")
            return ctx.insert("agent", None)


class DeregisterAgentLink(Link):
    """Link to deregister an agent"""
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.agent_store = agent_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agent_id": str
        }
        
        Output: updates "agent" with terminated status
        """
        agent_id = ctx.get("agent_id")
        
        updated_agent = await self.agent_store.deregister_agent(agent_id)
        
        if updated_agent:
            logger.info(f"Deregistered agent {agent_id}")
            return ctx.insert("agent", updated_agent)
        else:
            logger.warning(f"Agent {agent_id} not found for deregistration")
            return ctx.insert("agent", None)


class SerializeAgentLink(Link):
    """Link to serialize an agent to API response format"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agent": Agent
        }
        
        Output: adds "agent_response" key with serialized agent
        """
        agent: Optional[Agent] = ctx.get("agent")
        
        if not agent:
            return ctx.insert("agent_response", None)
        
        response = {
            "agent_id": agent.agent_id,
            "pool_name": agent.pool_name,
            "status": agent.status.value,
            "scaling_state": agent.scaling_state.value,
            "version": agent.version,
            "registered_at": agent.registered_at.isoformat(),
            "last_heartbeat": agent.last_heartbeat.isoformat(),
            "max_concurrent_jobs": agent.max_concurrent_jobs,
            "current_job_count": agent.current_job_count,
            "metrics": agent.metrics.to_dict(),
            "tags": agent.tags,
        }
        
        return ctx.insert("agent_response", response)


class SerializeAgentsListLink(Link):
    """Link to serialize a list of agents to API response format"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "agents": List[Agent]
        }
        
        Output: adds "agents_response" key with serialized agents
        """
        agents = ctx.get("agents") or []
        
        response = [
            {
                "agent_id": a.agent_id,
                "pool_name": a.pool_name,
                "status": a.status.value,
                "registered_at": a.registered_at.isoformat(),
                "last_heartbeat": a.last_heartbeat.isoformat(),
                "current_job_count": a.current_job_count,
                "max_concurrent_jobs": a.max_concurrent_jobs,
            }
            for a in agents
        ]
        
        return ctx.insert("agents_response", response)
