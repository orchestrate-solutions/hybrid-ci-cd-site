"""
Agent lifecycle models for agent registration, health tracking, and pool management.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import uuid


class AgentStatus(Enum):
    """Agent status enumeration"""
    REGISTERING = "registering"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    OFFLINE = "offline"
    TERMINATING = "terminating"
    TERMINATED = "terminated"


class AgentScalingState(Enum):
    """Agent scaling state"""
    STABLE = "stable"
    SCALING_UP = "scaling_up"
    SCALING_DOWN = "scaling_down"
    IDLE = "idle"


@dataclass
class AgentMetrics:
    """Resource metrics for an agent"""
    cpu_percent: float  # 0-100
    memory_percent: float  # 0-100
    disk_percent: float  # 0-100
    jobs_queued: int
    jobs_completed: int
    uptime_seconds: int
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "cpu_percent": self.cpu_percent,
            "memory_percent": self.memory_percent,
            "disk_percent": self.disk_percent,
            "jobs_queued": self.jobs_queued,
            "jobs_completed": self.jobs_completed,
            "uptime_seconds": self.uptime_seconds,
            "last_heartbeat": self.last_heartbeat.isoformat(),
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "AgentMetrics":
        """Create from dictionary"""
        return AgentMetrics(
            cpu_percent=data.get("cpu_percent", 0.0),
            memory_percent=data.get("memory_percent", 0.0),
            disk_percent=data.get("disk_percent", 0.0),
            jobs_queued=data.get("jobs_queued", 0),
            jobs_completed=data.get("jobs_completed", 0),
            uptime_seconds=data.get("uptime_seconds", 0),
            last_heartbeat=datetime.fromisoformat(data.get("last_heartbeat", datetime.utcnow().isoformat())),
        )


@dataclass
class Agent:
    """Agent model for job execution pool"""
    agent_id: str
    pool_name: str  # e.g., "us-east-1-a", "eu-west-1-b"
    status: AgentStatus
    scaling_state: AgentScalingState = AgentScalingState.STABLE
    version: str = "1.0.0"  # Agent software version
    metrics: AgentMetrics = field(default_factory=lambda: AgentMetrics(0, 0, 0, 0, 0, 0))
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    workload_identity_secret: str = field(default_factory=lambda: str(uuid.uuid4()))
    deployment_targets: Dict[str, Any] = field(default_factory=dict)  # {environment: config}
    max_concurrent_jobs: int = 5
    current_job_count: int = 0
    tags: Dict[str, str] = field(default_factory=dict)
    
    @staticmethod
    def create(pool_name: str, version: str = "1.0.0") -> "Agent":
        """Factory method to create a new agent"""
        agent_id = f"agent-{uuid.uuid4().hex[:12]}"
        return Agent(
            agent_id=agent_id,
            pool_name=pool_name,
            status=AgentStatus.REGISTERING,
            version=version,
            workload_identity_secret=str(uuid.uuid4()),
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "agent_id": self.agent_id,
            "pool_name": self.pool_name,
            "status": self.status.value,
            "scaling_state": self.scaling_state.value,
            "version": self.version,
            "metrics": self.metrics.to_dict(),
            "registered_at": self.registered_at.isoformat(),
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "max_concurrent_jobs": self.max_concurrent_jobs,
            "current_job_count": self.current_job_count,
            "tags": self.tags,
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Agent":
        """Create from dictionary"""
        return Agent(
            agent_id=data.get("agent_id"),
            pool_name=data.get("pool_name"),
            status=AgentStatus(data.get("status", "healthy")),
            scaling_state=AgentScalingState(data.get("scaling_state", "stable")),
            version=data.get("version", "1.0.0"),
            metrics=AgentMetrics.from_dict(data.get("metrics", {})),
            registered_at=datetime.fromisoformat(data.get("registered_at", datetime.utcnow().isoformat())),
            last_heartbeat=datetime.fromisoformat(data.get("last_heartbeat", datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None,
            workload_identity_secret=data.get("workload_identity_secret", str(uuid.uuid4())),
            deployment_targets=data.get("deployment_targets", {}),
            max_concurrent_jobs=data.get("max_concurrent_jobs", 5),
            current_job_count=data.get("current_job_count", 0),
            tags=data.get("tags", {}),
        )


@dataclass
class AgentPool:
    """Agent pool for managing a group of agents in a zone"""
    pool_name: str  # e.g., "us-east-1-a"
    region: str  # e.g., "us-east-1"
    zone: str  # e.g., "a"
    min_agents: int = 1
    max_agents: int = 10
    target_agents: int = 2
    current_agent_count: int = 0
    desired_agent_count: int = 0
    active_agents: int = 0
    idle_agents: int = 0
    unhealthy_agents: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_scaled_at: Optional[datetime] = None
    enabled: bool = True
    
    @staticmethod
    def create(pool_name: str, region: str, zone: str, min_agents: int = 1, max_agents: int = 10) -> "AgentPool":
        """Factory method to create a new pool"""
        return AgentPool(
            pool_name=pool_name,
            region=region,
            zone=zone,
            min_agents=min_agents,
            max_agents=max_agents,
            target_agents=min_agents,
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "pool_name": self.pool_name,
            "region": self.region,
            "zone": self.zone,
            "min_agents": self.min_agents,
            "max_agents": self.max_agents,
            "target_agents": self.target_agents,
            "current_agent_count": self.current_agent_count,
            "desired_agent_count": self.desired_agent_count,
            "active_agents": self.active_agents,
            "idle_agents": self.idle_agents,
            "unhealthy_agents": self.unhealthy_agents,
            "created_at": self.created_at.isoformat(),
            "last_scaled_at": self.last_scaled_at.isoformat() if self.last_scaled_at else None,
            "enabled": self.enabled,
        }


@dataclass
class AgentHealthCheck:
    """Health check result for an agent"""
    agent_id: str
    status: AgentStatus
    timestamp: datetime
    message: str = ""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    disk_percent: float = 0.0
    response_time_ms: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "timestamp": self.timestamp.isoformat(),
            "message": self.message,
            "cpu_percent": self.cpu_percent,
            "memory_percent": self.memory_percent,
            "disk_percent": self.disk_percent,
            "response_time_ms": self.response_time_ms,
        }
