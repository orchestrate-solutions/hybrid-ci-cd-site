"""
Dashboard data models for job and deployment tracking.
"""

from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from typing import Optional, Dict, Any
import uuid


class JobStatus(str, Enum):
    """Job execution status"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"
    ERROR = "error"


class DeploymentStatus(str, Enum):
    """Deployment status across environments"""
    PENDING = "pending"
    STAGING = "staging"  # Deploying to staging
    STAGED = "staged"    # Live in staging
    PRODUCTION = "production"  # Deploying to production
    LIVE = "live"  # Live in production
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class Job:
    """Job execution record with full lifecycle tracking"""
    # Identifiers
    job_id: str = field(default_factory=lambda: f"job-{uuid.uuid4().hex[:12]}")
    job_type: str = ""  # "build", "test", "deploy", etc.
    
    # Status
    status: JobStatus = JobStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Git context
    git_repo: str = ""  # "org/repo"
    git_ref: str = ""   # "main", "develop", etc.
    git_commit_sha: str = ""
    git_commit_message: str = ""
    git_author: str = ""
    
    # Execution details
    agent_id: Optional[str] = None
    queued_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Results
    exit_code: Optional[int] = None
    duration_seconds: Optional[int] = None
    logs_url: Optional[str] = None
    logs_summary: Optional[str] = None
    error_message: Optional[str] = None
    
    # Metadata
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_running(self) -> bool:
        """Check if job is currently running"""
        return self.status in (JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING)
    
    def is_terminal(self) -> bool:
        """Check if job has reached terminal state"""
        return self.status in (JobStatus.SUCCESS, JobStatus.FAILED, JobStatus.CANCELLED, 
                              JobStatus.TIMEOUT, JobStatus.ERROR)
    
    def is_complete(self) -> bool:
        """Check if job completed successfully"""
        return self.status == JobStatus.SUCCESS
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to DynamoDB-compatible dict"""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "git_repo": self.git_repo,
            "git_ref": self.git_ref,
            "git_commit_sha": self.git_commit_sha,
            "git_commit_message": self.git_commit_message,
            "git_author": self.git_author,
            "agent_id": self.agent_id or "",
            "queued_at": self.queued_at.isoformat() if self.queued_at else "",
            "started_at": self.started_at.isoformat() if self.started_at else "",
            "completed_at": self.completed_at.isoformat() if self.completed_at else "",
            "exit_code": self.exit_code if self.exit_code is not None else -1,
            "duration_seconds": self.duration_seconds if self.duration_seconds is not None else 0,
            "logs_url": self.logs_url or "",
            "logs_summary": self.logs_summary or "",
            "error_message": self.error_message or "",
            "tags": self.tags,
            "metadata": self.metadata,
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Job":
        """Create Job from DynamoDB dict"""
        job = Job(
            job_id=data.get("job_id"),
            job_type=data.get("job_type"),
            status=JobStatus(data.get("status", "pending")),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.utcnow().isoformat())),
            git_repo=data.get("git_repo"),
            git_ref=data.get("git_ref"),
            git_commit_sha=data.get("git_commit_sha"),
            git_commit_message=data.get("git_commit_message"),
            git_author=data.get("git_author"),
            agent_id=data.get("agent_id") or None,
            exit_code=data.get("exit_code") if data.get("exit_code", -1) != -1 else None,
            duration_seconds=data.get("duration_seconds") or None,
            logs_url=data.get("logs_url") or None,
            logs_summary=data.get("logs_summary") or None,
            error_message=data.get("error_message") or None,
            tags=data.get("tags", {}),
            metadata=data.get("metadata", {}),
        )
        
        # Parse optional datetimes
        if data.get("queued_at"):
            job.queued_at = datetime.fromisoformat(data["queued_at"])
        if data.get("started_at"):
            job.started_at = datetime.fromisoformat(data["started_at"])
        if data.get("completed_at"):
            job.completed_at = datetime.fromisoformat(data["completed_at"])
        
        return job


@dataclass
class Deployment:
    """Deployment record with multi-environment tracking"""
    # Identifiers
    deployment_id: str = field(default_factory=lambda: f"deploy-{uuid.uuid4().hex[:12]}")
    service_name: str = ""
    service_version: str = ""
    
    # Status
    status: DeploymentStatus = DeploymentStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Git context
    git_commit_sha: str = ""
    git_commit_message: str = ""
    git_author: str = ""
    
    # Tracking job IDs
    build_job_id: Optional[str] = None
    test_job_id: Optional[str] = None
    deploy_job_id: Optional[str] = None
    
    # Environment deployment tracking
    deployed_to_staging: bool = False
    staging_deployed_at: Optional[datetime] = None
    staging_job_id: Optional[str] = None
    
    deployed_to_production: bool = False
    production_deployed_at: Optional[datetime] = None
    production_job_id: Optional[str] = None
    
    # Rollback tracking
    rolled_back: bool = False
    rolled_back_at: Optional[datetime] = None
    rolled_back_to_version: Optional[str] = None
    rollback_reason: Optional[str] = None
    
    # Performance metrics (from production)
    production_error_rate: Optional[float] = None
    production_latency_ms: Optional[int] = None
    production_requests_per_sec: Optional[float] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_live_in_production(self) -> bool:
        """Check if deployment is currently live in production"""
        return self.deployed_to_production and self.status == DeploymentStatus.LIVE
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to DynamoDB-compatible dict"""
        return {
            "deployment_id": self.deployment_id,
            "service_name": self.service_name,
            "service_version": self.service_version,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "git_commit_sha": self.git_commit_sha,
            "git_commit_message": self.git_commit_message,
            "git_author": self.git_author,
            "build_job_id": self.build_job_id or "",
            "test_job_id": self.test_job_id or "",
            "deploy_job_id": self.deploy_job_id or "",
            "deployed_to_staging": self.deployed_to_staging,
            "staging_deployed_at": self.staging_deployed_at.isoformat() if self.staging_deployed_at else "",
            "staging_job_id": self.staging_job_id or "",
            "deployed_to_production": self.deployed_to_production,
            "production_deployed_at": self.production_deployed_at.isoformat() if self.production_deployed_at else "",
            "production_job_id": self.production_job_id or "",
            "rolled_back": self.rolled_back,
            "rolled_back_at": self.rolled_back_at.isoformat() if self.rolled_back_at else "",
            "rolled_back_to_version": self.rolled_back_to_version or "",
            "rollback_reason": self.rollback_reason or "",
            "production_error_rate": self.production_error_rate if self.production_error_rate is not None else 0.0,
            "production_latency_ms": self.production_latency_ms if self.production_latency_ms is not None else 0,
            "production_requests_per_sec": self.production_requests_per_sec if self.production_requests_per_sec is not None else 0.0,
            "metadata": self.metadata,
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Deployment":
        """Create Deployment from DynamoDB dict"""
        deploy = Deployment(
            deployment_id=data.get("deployment_id"),
            service_name=data.get("service_name"),
            service_version=data.get("service_version"),
            status=DeploymentStatus(data.get("status", "pending")),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.utcnow().isoformat())),
            git_commit_sha=data.get("git_commit_sha"),
            git_commit_message=data.get("git_commit_message"),
            git_author=data.get("git_author"),
            build_job_id=data.get("build_job_id") or None,
            test_job_id=data.get("test_job_id") or None,
            deploy_job_id=data.get("deploy_job_id") or None,
            deployed_to_staging=data.get("deployed_to_staging", False),
            deployed_to_production=data.get("deployed_to_production", False),
            rolled_back=data.get("rolled_back", False),
            rolled_back_to_version=data.get("rolled_back_to_version") or None,
            rollback_reason=data.get("rollback_reason") or None,
            production_error_rate=data.get("production_error_rate") or None,
            production_latency_ms=data.get("production_latency_ms") or None,
            production_requests_per_sec=data.get("production_requests_per_sec") or None,
            metadata=data.get("metadata", {}),
        )
        
        # Parse optional datetimes
        if data.get("staging_deployed_at"):
            deploy.staging_deployed_at = datetime.fromisoformat(data["staging_deployed_at"])
        if data.get("production_deployed_at"):
            deploy.production_deployed_at = datetime.fromisoformat(data["production_deployed_at"])
        if data.get("rolled_back_at"):
            deploy.rolled_back_at = datetime.fromisoformat(data["rolled_back_at"])
        
        deploy.staging_job_id = data.get("staging_job_id") or None
        deploy.production_job_id = data.get("production_job_id") or None
        
        return deploy


@dataclass
class JobSummary:
    """Lightweight job summary for API responses"""
    job_id: str
    job_type: str
    status: str
    created_at: str
    git_commit_sha: str  # Truncated
    git_author: str
    duration_seconds: Optional[int] = None
    exit_code: Optional[int] = None


@dataclass
class DeploymentSummary:
    """Lightweight deployment summary for API responses"""
    deployment_id: str
    service_name: str
    service_version: str
    status: str
    created_at: str
    git_commit_sha: str  # Truncated
    git_author: str
    deployed_to_staging: bool
    deployed_to_production: bool
    rolled_back: bool
