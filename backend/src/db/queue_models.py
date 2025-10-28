"""
Job queue models for agent work distribution.

Design:
- Jobs enter queue with QUEUED status
- Agents poll queue, claim work atomically (QUEUED → CLAIMED)
- Agents execute, heartbeat with progress (CLAIMED → RUNNING)
- Agents complete (RUNNING → COMPLETED/FAILED)
- Failed jobs can be retried or dead-lettered

This is the connective tissue between Dashboard (creates jobs)
and Agents (execute jobs) in the hybrid control plane.
"""

from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, Any, Optional


class JobQueueStatus(str, Enum):
    """Job queue status lifecycle"""
    QUEUED = "queued"          # Waiting for an agent to claim
    CLAIMED = "claimed"        # Agent has claimed but not started execution
    RUNNING = "running"        # Agent is executing
    COMPLETED = "completed"    # Successfully finished
    FAILED = "failed"          # Execution failed
    DEAD_LETTERED = "dead_lettered"  # Exhausted retries


class JobQueuePriority(str, Enum):
    """Job priority for queue ordering"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class QueuedJob:
    """A job waiting in the queue for agent execution"""
    job_id: str                          # Unique ID from dashboard
    job_type: str                        # Type: "build", "test", "deploy"
    pool_name: str                       # Target agent pool (e.g., "us-east-1-a")
    
    # Payload (with defaults for flexible construction)
    priority: JobQueuePriority = JobQueuePriority.NORMAL
    status: JobQueueStatus = JobQueueStatus.QUEUED
    git_repo: str = ""
    git_ref: str = ""
    git_commit_sha: str = ""
    git_commit_message: str = ""
    git_author: str = ""
    tags: Dict[str, str] = field(default_factory=dict)
    
    # Timestamps
    queued_at: datetime = field(default_factory=datetime.utcnow)
    claimed_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Agent binding
    claimed_by_agent: Optional[str] = None  # Agent ID that claimed this job
    claimed_lease_expires_at: Optional[datetime] = None  # Lease TTL (30 seconds)
    
    # Execution tracking
    attempt: int = 1                     # Retry attempt number
    max_attempts: int = 3                # Max retries allowed
    error_message: Optional[str] = None
    exit_code: Optional[int] = None
    duration_seconds: Optional[int] = None
    
    # Metadata
    timeout_seconds: int = 3600          # Max execution time (1 hour)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def is_lease_expired(self) -> bool:
        """Check if agent's claim lease has expired"""
        if not self.claimed_lease_expires_at:
            return False
        return datetime.utcnow() > self.claimed_lease_expires_at
    
    def lease_expired(self) -> bool:
        """Alias for is_lease_expired for consistency"""
        return self.is_lease_expired()
    
    def can_retry(self) -> bool:
        """Check if job can be retried (attempt < max_attempts)"""
        return self.attempt < self.max_attempts
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to API response dict"""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "pool_name": self.pool_name,
            "priority": self.priority.value,
            "status": self.status.value,
            "git_commit_sha": self.git_commit_sha[:12],
            "git_author": self.git_author,
            "queued_at": self.queued_at.isoformat(),
            "claimed_by_agent": self.claimed_by_agent,
            "attempt": self.attempt,
            "exit_code": self.exit_code,
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
        }


@dataclass
class QueueStats:
    """Queue statistics for monitoring"""
    total_queued: int
    total_claimed: int
    total_running: int
    total_completed: int
    total_failed: int
    total_dead_lettered: int
    
    # Timing metrics
    avg_queue_wait_seconds: float       # Average time job sits in queue
    avg_execution_seconds: float        # Average job execution time
    
    # Health metrics
    failure_rate: float                 # (failed + dead_lettered) / (completed + failed)
    p95_queue_wait: float               # 95th percentile queue wait
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict"""
        return {
            "total_queued": self.total_queued,
            "total_claimed": self.total_claimed,
            "total_running": self.total_running,
            "total_completed": self.total_completed,
            "total_failed": self.total_failed,
            "total_dead_lettered": self.total_dead_lettered,
            "avg_queue_wait_seconds": round(self.avg_queue_wait_seconds, 2),
            "avg_execution_seconds": round(self.avg_execution_seconds, 2),
            "failure_rate": round(self.failure_rate, 3),
            "p95_queue_wait": round(self.p95_queue_wait, 2),
        }
