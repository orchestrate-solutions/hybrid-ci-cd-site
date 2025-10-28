"""Database models for session and job storage."""

from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Optional
import uuid


@dataclass
class SessionToken:
    """Represents a session token (stored in DynamoDB)."""
    
    session_id: str
    user_id: str
    provider: str  # "google" or "github"
    created_at: int  # Unix timestamp
    expires_at: int  # Unix timestamp (TTL attribute)
    oauth_tokens: dict  # {"access_token": "...", "token_type": "Bearer", ...}
    user_info: dict  # {"email": "...", "name": "...", "picture": "..."}
    
    @classmethod
    def create(
        cls,
        user_id: str,
        provider: str,
        oauth_tokens: dict,
        user_info: dict,
        ttl_seconds: int = 86400,
    ) -> "SessionToken":
        """Create a new session token."""
        now = int(datetime.utcnow().timestamp())
        return cls(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            provider=provider,
            created_at=now,
            expires_at=now + ttl_seconds,
            oauth_tokens=oauth_tokens,
            user_info=user_info,
        )
    
    def is_expired(self) -> bool:
        """Check if session has expired."""
        now = int(datetime.utcnow().timestamp())
        return now >= self.expires_at
    
    def to_dict(self) -> dict:
        """Convert to DynamoDB-compatible dict."""
        return asdict(self)


@dataclass
class Job:
    """Represents a CI/CD job."""
    
    job_id: str
    status: str  # "queued", "running", "completed", "failed"
    git_ref: str
    agent_id: Optional[str] = None
    created_at: Optional[int] = None
    started_at: Optional[int] = None
    completed_at: Optional[int] = None
    exit_code: Optional[int] = None
    logs_url: Optional[str] = None
    error_message: Optional[str] = None
    
    @classmethod
    def create(cls, git_ref: str) -> "Job":
        """Create a new job."""
        return cls(
            job_id=str(uuid.uuid4()),
            status="queued",
            git_ref=git_ref,
            created_at=int(datetime.utcnow().timestamp()),
        )


@dataclass
class Agent:
    """Represents an execution agent."""
    
    agent_id: str
    status: str  # "healthy", "unhealthy", "dead"
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    jobs_queued: int
    jobs_completed: int
    last_heartbeat: int  # Unix timestamp
    uptime_seconds: int
    region: str  # "us-east-1", "us-west-2", etc.
    
    @classmethod
    def create(cls, agent_id: str, region: str) -> "Agent":
        """Create a new agent."""
        now = int(datetime.utcnow().timestamp())
        return cls(
            agent_id=agent_id,
            status="healthy",
            cpu_percent=0.0,
            memory_percent=0.0,
            disk_percent=0.0,
            jobs_queued=0,
            jobs_completed=0,
            last_heartbeat=now,
            uptime_seconds=0,
            region=region,
        )
