"""
Agent store interfaces and in-memory implementations for agent lifecycle management.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from src.db.agent_models import Agent, AgentPool, AgentStatus, AgentHealthCheck, AgentScalingState


logger = logging.getLogger(__name__)


class AgentStoreInterface(ABC):
    """Abstract interface for agent storage"""
    
    @abstractmethod
    async def register_agent(self, agent: Agent) -> Agent:
        """Register a new agent"""
        pass
    
    @abstractmethod
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Retrieve an agent by ID"""
        pass
    
    @abstractmethod
    async def list_agents(self, pool_name: Optional[str] = None, status: Optional[AgentStatus] = None) -> List[Agent]:
        """List agents, optionally filtered by pool or status"""
        pass
    
    @abstractmethod
    async def update_agent_status(self, agent_id: str, status: AgentStatus) -> Optional[Agent]:
        """Update agent status"""
        pass
    
    @abstractmethod
    async def update_agent_metrics(self, agent_id: str, cpu: float, memory: float, disk: float,
                                   jobs_queued: int, jobs_completed: int, uptime: int) -> Optional[Agent]:
        """Update agent resource metrics"""
        pass
    
    @abstractmethod
    async def record_heartbeat(self, agent_id: str) -> Optional[Agent]:
        """Record agent heartbeat"""
        pass
    
    @abstractmethod
    async def deregister_agent(self, agent_id: str) -> Optional[Agent]:
        """Deregister an agent"""
        pass
    
    @abstractmethod
    async def get_agents_by_pool(self, pool_name: str) -> List[Agent]:
        """Get all agents in a pool"""
        pass
    
    @abstractmethod
    async def get_healthy_agents(self, limit: int = 100) -> List[Agent]:
        """Get healthy agents available for jobs"""
        pass
    
    @abstractmethod
    async def get_idle_agents(self, pool_name: Optional[str] = None) -> List[Agent]:
        """Get idle agents (not running jobs)"""
        pass


class AgentPoolStoreInterface(ABC):
    """Abstract interface for agent pool storage"""
    
    @abstractmethod
    async def create_pool(self, pool: AgentPool) -> AgentPool:
        """Create a new agent pool"""
        pass
    
    @abstractmethod
    async def get_pool(self, pool_name: str) -> Optional[AgentPool]:
        """Retrieve a pool by name"""
        pass
    
    @abstractmethod
    async def list_pools(self) -> List[AgentPool]:
        """List all agent pools"""
        pass
    
    @abstractmethod
    async def update_pool_scaling_state(self, pool_name: str, desired_count: int) -> Optional[AgentPool]:
        """Update pool scaling state"""
        pass
    
    @abstractmethod
    async def update_pool_agent_counts(self, pool_name: str, active: int, idle: int, unhealthy: int) -> Optional[AgentPool]:
        """Update pool agent counts"""
        pass


class InMemoryAgentStore(AgentStoreInterface):
    """In-memory agent storage implementation"""
    
    def __init__(self):
        self._agents: Dict[str, Agent] = {}
    
    async def register_agent(self, agent: Agent) -> Agent:
        """Register a new agent"""
        self._agents[agent.agent_id] = agent
        agent.status = AgentStatus.HEALTHY
        logger.info(f"Registered agent {agent.agent_id} in pool {agent.pool_name}")
        return agent
    
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Retrieve an agent by ID"""
        return self._agents.get(agent_id)
    
    async def list_agents(self, pool_name: Optional[str] = None, status: Optional[AgentStatus] = None) -> List[Agent]:
        """List agents, optionally filtered by pool or status"""
        agents = list(self._agents.values())
        
        if pool_name:
            agents = [a for a in agents if a.pool_name == pool_name]
        
        if status:
            agents = [a for a in agents if a.status == status]
        
        # Sort by registration time (newest first)
        agents.sort(key=lambda a: a.registered_at, reverse=True)
        return agents
    
    async def update_agent_status(self, agent_id: str, status: AgentStatus) -> Optional[Agent]:
        """Update agent status"""
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = status
            agent.updated_at = datetime.utcnow()
            logger.info(f"Updated agent {agent_id} status to {status.value}")
            return agent
        return None
    
    async def update_agent_metrics(self, agent_id: str, cpu: float, memory: float, disk: float,
                                   jobs_queued: int, jobs_completed: int, uptime: int) -> Optional[Agent]:
        """Update agent resource metrics"""
        agent = self._agents.get(agent_id)
        if agent:
            agent.metrics.cpu_percent = cpu
            agent.metrics.memory_percent = memory
            agent.metrics.disk_percent = disk
            agent.metrics.jobs_queued = jobs_queued
            agent.metrics.jobs_completed = jobs_completed
            agent.metrics.uptime_seconds = uptime
            agent.metrics.last_heartbeat = datetime.utcnow()
            agent.updated_at = datetime.utcnow()
            logger.debug(f"Updated metrics for agent {agent_id}")
            return agent
        return None
    
    async def record_heartbeat(self, agent_id: str) -> Optional[Agent]:
        """Record agent heartbeat"""
        agent = self._agents.get(agent_id)
        if agent:
            agent.last_heartbeat = datetime.utcnow()
            logger.debug(f"Recorded heartbeat for agent {agent_id}")
            return agent
        return None
    
    async def deregister_agent(self, agent_id: str) -> Optional[Agent]:
        """Deregister an agent"""
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = AgentStatus.TERMINATED
            agent.updated_at = datetime.utcnow()
            logger.info(f"Deregistered agent {agent_id}")
            return agent
        return None
    
    async def get_agents_by_pool(self, pool_name: str) -> List[Agent]:
        """Get all agents in a pool"""
        agents = [a for a in self._agents.values() if a.pool_name == pool_name]
        agents.sort(key=lambda a: a.registered_at, reverse=True)
        return agents
    
    async def get_healthy_agents(self, limit: int = 100) -> List[Agent]:
        """Get healthy agents available for jobs"""
        agents = [a for a in self._agents.values() if a.status == AgentStatus.HEALTHY]
        agents.sort(key=lambda a: a.current_job_count)  # Sort by current load
        return agents[:limit]
    
    async def get_idle_agents(self, pool_name: Optional[str] = None) -> List[Agent]:
        """Get idle agents (not running jobs)"""
        agents = [a for a in self._agents.values() if a.status == AgentStatus.HEALTHY and a.current_job_count == 0]
        
        if pool_name:
            agents = [a for a in agents if a.pool_name == pool_name]
        
        agents.sort(key=lambda a: a.registered_at, reverse=True)
        return agents


class InMemoryAgentPoolStore(AgentPoolStoreInterface):
    """In-memory agent pool storage implementation"""
    
    def __init__(self):
        self._pools: Dict[str, AgentPool] = {}
    
    async def create_pool(self, pool: AgentPool) -> AgentPool:
        """Create a new agent pool"""
        self._pools[pool.pool_name] = pool
        logger.info(f"Created agent pool {pool.pool_name} with min={pool.min_agents}, max={pool.max_agents}")
        return pool
    
    async def get_pool(self, pool_name: str) -> Optional[AgentPool]:
        """Retrieve a pool by name"""
        return self._pools.get(pool_name)
    
    async def list_pools(self) -> List[AgentPool]:
        """List all agent pools"""
        pools = list(self._pools.values())
        pools.sort(key=lambda p: p.created_at, reverse=True)
        return pools
    
    async def update_pool_scaling_state(self, pool_name: str, desired_count: int) -> Optional[AgentPool]:
        """Update pool scaling state"""
        pool = self._pools.get(pool_name)
        if pool:
            pool.desired_agent_count = desired_count
            pool.last_scaled_at = datetime.utcnow()
            logger.info(f"Updated pool {pool_name} desired count to {desired_count}")
            return pool
        return None
    
    async def update_pool_agent_counts(self, pool_name: str, active: int, idle: int, unhealthy: int) -> Optional[AgentPool]:
        """Update pool agent counts"""
        pool = self._pools.get(pool_name)
        if pool:
            pool.active_agents = active
            pool.idle_agents = idle
            pool.unhealthy_agents = unhealthy
            pool.current_agent_count = active + idle + unhealthy
            logger.debug(f"Updated pool {pool_name} counts: active={active}, idle={idle}, unhealthy={unhealthy}")
            return pool
        return None
