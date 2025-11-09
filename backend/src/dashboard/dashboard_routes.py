"""
Dashboard API routes for job and deployment tracking (CodeUChain-powered).
"""

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from src.db.dashboard_models import (
    Job, Deployment, JobStatus, DeploymentStatus, JobSummary, DeploymentSummary
)
from src.db.dashboard_store import InMemoryJobStore, InMemoryDeploymentStore, JobStoreInterface, DeploymentStoreInterface
from src.db.dynamodb_dashboard_store import DynamoDBJobStore, DynamoDBDeploymentStore
from src.components.chains.dashboard_chains import (
    JobCreationChain, JobExecutionChain, ListJobsChain,
    DeploymentCreationChain, DeploymentLifecycleChain, ListDeploymentsChain
)
from src.core.config import settings


logger = logging.getLogger(__name__)

# Initialize stores (DynamoDB in production, in-memory in development)
if settings.environment == "production":
    _job_store: JobStoreInterface = DynamoDBJobStore()
    _deployment_store: DeploymentStoreInterface = DynamoDBDeploymentStore()
else:
    _job_store: JobStoreInterface = InMemoryJobStore()
    _deployment_store: DeploymentStoreInterface = InMemoryDeploymentStore()

# Initialize CodeUChain chains
_job_creation_chain = JobCreationChain(_job_store)
_job_execution_chain = JobExecutionChain(_job_store)
_list_jobs_chain = ListJobsChain(_job_store)
_deployment_creation_chain = DeploymentCreationChain(_deployment_store)
_deployment_lifecycle_chain = DeploymentLifecycleChain(_deployment_store)
_list_deployments_chain = ListDeploymentsChain(_deployment_store)


# ============================================================================
# Demo Data Integration
# ============================================================================

def is_demo_mode(request: Request) -> bool:
    """Check if request is in demo mode"""
    demo_header = request.headers.get("x-demo-mode", "").lower()
    return demo_header == "true"

async def get_demo_data(endpoint: str, **kwargs):
    """Get demo data for unified pipeline"""
    # Import demo data generators dynamically to avoid circular imports
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../../src/lib'))

    # For now, return mock data - in a real implementation, this would call the actual demo generators
    if "agents" in endpoint:
        return [
            {
                "agent_id": f"agent-{i:03d}",
                "status": "healthy" if i % 3 != 0 else "unhealthy",
                "cpu_percent": 45.2 + (i * 2.1),
                "memory_percent": 62.8 + (i * 1.5),
                "disk_percent": 34.1 + (i * 0.8),
                "jobs_queued": i % 5,
                "jobs_completed": 100 + (i * 23),
                "last_heartbeat": "2024-01-15T10:30:00Z",
                "uptime_seconds": 86400 + (i * 3600),
                "region": ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"][i % 4]
            } for i in range(8)
        ]
    elif "summary" in endpoint:
        return {
            "jobs_running": 3,
            "jobs_failed_today": 2,
            "deployments_today": 5,
            "recent_jobs": [],
            "recent_deployments": []
        }
    elif "jobs" in endpoint:
        return [
            {
                "job_id": f"job-{i:04d}",
                "job_type": ["test", "build", "deploy"][i % 3],
                "status": "success",
                "git_repo": "orchestrate/platform",
                "git_ref": "main",
                "git_commit_sha": f"abc123{i:04d}",
                "git_commit_message": f"Commit message {i}",
                "git_author": "user@example.com",
                "exit_code": 0,
                "duration_seconds": 120 + i,
                "logs_url": f"https://logs.example.com/job-{i}",
                "created_at": "2024-01-15T10:00:00Z",
                "started_at": "2024-01-15T10:01:00Z",
                "completed_at": "2024-01-15T10:03:00Z",
                "error_message": None,
                "tags": {"env": "prod"}
            } for i in range(20)
        ]
    elif "deployments" in endpoint:
        return [
            {
                "deployment_id": f"dep-{i:04d}",
                "service_name": f"service-{i % 5}",
                "service_version": f"v1.{i % 10}.0",
                "git_commit_sha": f"def456{i:04d}",
                "git_commit_message": f"Deploy commit {i}",
                "git_author": "deployer@example.com",
                "status": "live",
                "deployed_to_staging": True,
                "deployed_to_production": True,
                "staging_deployed_at": "2024-01-15T09:00:00Z",
                "production_deployed_at": "2024-01-15T10:00:00Z",
                "rolled_back": False,
                "rolled_back_to_version": None,
                "rollback_reason": None,
                "created_at": "2024-01-15T08:00:00Z",
                "updated_at": "2024-01-15T10:00:00Z"
            } for i in range(15)
        ]

    return []


# ============================================================================
# Request/Response Models
# ============================================================================

class JobCreateRequest(BaseModel):
    """Request to create a new job"""
    job_type: str
    git_repo: str
    git_ref: str
    git_commit_sha: str
    git_commit_message: str
    git_author: str
    tags: Optional[Dict[str, str]] = None


class JobUpdateRequest(BaseModel):
    """Request to complete a job"""
    agent_id: str
    exit_code: int
    duration_seconds: int
    logs_url: Optional[str] = None
    logs_summary: Optional[str] = None
    error_message: Optional[str] = None


class JobResponse(BaseModel):
    """Job response model"""
    job_id: str
    job_type: str
    status: str
    created_at: str
    git_commit_sha: str
    git_author: str
    exit_code: Optional[int] = None
    duration_seconds: Optional[int] = None


class DeploymentCreateRequest(BaseModel):
    """Request to create a new deployment"""
    service_name: str
    service_version: str
    git_commit_sha: str
    git_commit_message: str
    git_author: str
    build_job_id: Optional[str] = None
    test_job_id: Optional[str] = None


class StagingDeploymentRequest(BaseModel):
    """Request to record staging deployment"""
    job_id: str


class ProductionDeploymentRequest(BaseModel):
    """Request to record production deployment"""
    job_id: str


class RollbackRequest(BaseModel):
    """Request to record rollback"""
    rolled_back_to_version: str
    reason: str


class DeploymentResponse(BaseModel):
    """Deployment response model"""
    deployment_id: str
    service_name: str
    service_version: str
    status: str
    created_at: str
    git_commit_sha: str
    deployed_to_staging: bool
    deployed_to_production: bool
    rolled_back: bool


class DashboardSummary(BaseModel):
    """Quick status summary for dashboard"""
    jobs_running: int
    jobs_failed_today: int
    deployments_today: int
    recent_jobs: List[JobSummary]
    recent_deployments: List[DeploymentSummary]


# ============================================================================
# Job Endpoints
# ============================================================================

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.post("/jobs", response_model=JobResponse)
async def create_job(request: JobCreateRequest) -> Dict[str, Any]:
    """Create a new job (powered by CodeUChain)"""
    request_data = {
        "job_type": request.job_type,
        "git_repo": request.git_repo,
        "git_ref": request.git_ref,
        "git_commit_sha": request.git_commit_sha,
        "git_commit_message": request.git_commit_message,
        "git_author": request.git_author,
        "tags": request.tags or {}
    }
    
    result = await _job_creation_chain.run(request_data)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "job_id": result.get("job_id"),
        "job_type": result.get("job_type"),
        "status": result.get("status"),
        "created_at": result.get("created_at"),
        "git_commit_sha": result.get("git_commit_sha", "")[:7],
        "git_author": result.get("git_author"),
    }


@router.get("/jobs", response_model=Dict[str, Any])
async def list_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=100)
) -> Dict[str, Any]:
    """List jobs with optional status filter (powered by CodeUChain)"""
    return await _list_jobs_chain.run(status=status, limit=limit)


@router.get("/jobs/running", response_model=List[Dict[str, Any]])
async def get_running_jobs() -> List[Dict[str, Any]]:
    """Get all currently running jobs (powered by CodeUChain)"""
    jobs = await _job_store.list_running_jobs()
    
    return [
        {
            "job_id": job.job_id,
            "job_type": job.job_type,
            "status": job.status.value,
            "created_at": job.created_at.isoformat(),
            "git_commit_sha": job.git_commit_sha[:7],
            "git_author": job.git_author,
        }
        for job in jobs
    ]


@router.get("/jobs/{job_id}", response_model=Dict[str, Any])
async def get_job(job_id: str) -> Dict[str, Any]:
    """Get job details"""
    job = await _job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    return {
        "job_id": job.job_id,
        "job_type": job.job_type,
        "status": job.status.value,
        "created_at": job.created_at.isoformat(),
        "git_repo": job.git_repo,
        "git_ref": job.git_ref,
        "git_commit_sha": job.git_commit_sha,
        "git_author": job.git_author,
        "agent_id": job.agent_id,
        "exit_code": job.exit_code,
        "duration_seconds": job.duration_seconds,
        "logs_url": job.logs_url,
        "error_message": job.error_message,
    }


@router.patch("/jobs/{job_id}/complete", response_model=Dict[str, Any])
async def complete_job(job_id: str, request: JobUpdateRequest) -> Dict[str, Any]:
    """Mark job as complete (powered by CodeUChain)"""
    execution_data = {
        "agent_id": request.agent_id,
        "exit_code": request.exit_code,
        "duration_seconds": request.duration_seconds,
        "logs_url": request.logs_url,
        "logs_summary": request.logs_summary,
        "error_message": request.error_message
    }
    
    result = await _job_execution_chain.run(job_id, execution_data)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "job_id": result.get("job_id"),
        "status": result.get("status"),
        "exit_code": result.get("exit_code"),
        "duration_seconds": result.get("duration_seconds"),
        "completed_at": result.get("completed_at"),
    }


# ============================================================================
# Deployment Endpoints
# ============================================================================

@router.post("/deployments", response_model=DeploymentResponse)
async def create_deployment(request: DeploymentCreateRequest) -> Dict[str, Any]:
    """Create a new deployment (powered by CodeUChain)"""
    request_data = {
        "service_name": request.service_name,
        "service_version": request.service_version,
        "git_commit_sha": request.git_commit_sha,
        "git_commit_message": request.git_commit_message,
        "git_author": request.git_author,
        "build_job_id": request.build_job_id,
        "test_job_id": request.test_job_id,
    }
    
    result = await _deployment_creation_chain.run(request_data)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "deployment_id": result.get("deployment_id"),
        "service_name": result.get("service_name"),
        "service_version": result.get("service_version"),
        "status": result.get("status"),
        "created_at": result.get("created_at"),
        "git_commit_sha": (result.get("git_commit_sha") or "")[:12],
        "deployed_to_staging": result.get("deployed_to_staging"),
        "deployed_to_production": result.get("deployed_to_production"),
        "rolled_back": result.get("rolled_back"),
    }


@router.get("/deployments", response_model=Dict[str, Any])
async def list_deployments(limit: int = Query(100, le=100)) -> Dict[str, Any]:
    """List all deployments (powered by CodeUChain)"""
    return await _list_deployments_chain.run(service_name=None, limit=limit)


@router.get("/deployments/{deployment_id}", response_model=Dict[str, Any])
async def get_deployment(deployment_id: str) -> Dict[str, Any]:
    """Get deployment details"""
    deployment = await _deployment_store.get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail=f"Deployment {deployment_id} not found")
    
    return {
        "deployment_id": deployment.deployment_id,
        "service_name": deployment.service_name,
        "service_version": deployment.service_version,
        "status": deployment.status.value,
        "created_at": deployment.created_at.isoformat(),
        "git_commit_sha": deployment.git_commit_sha,
        "git_author": deployment.git_author,
        "deployed_to_staging": deployment.deployed_to_staging,
        "staging_deployed_at": deployment.staging_deployed_at.isoformat() if deployment.staging_deployed_at else None,
        "deployed_to_production": deployment.deployed_to_production,
        "production_deployed_at": deployment.production_deployed_at.isoformat() if deployment.production_deployed_at else None,
        "rolled_back": deployment.rolled_back,
        "rolled_back_to_version": deployment.rolled_back_to_version,
        "rollback_reason": deployment.rollback_reason,
    }


@router.get("/deployments/service/{service_name}", response_model=Dict[str, Any])
async def get_service_deployments(service_name: str, limit: int = Query(50, le=100)) -> Dict[str, Any]:
    """Get deployment history for a service (powered by CodeUChain)"""
    return await _list_deployments_chain.run(service_name=service_name, limit=limit)


@router.post("/deployments/{deployment_id}/staging", response_model=Dict[str, Any])
async def record_staging_deployment(deployment_id: str, request: StagingDeploymentRequest) -> Dict[str, Any]:
    """Record successful staging deployment (powered by CodeUChain)"""
    result = await _deployment_lifecycle_chain.run(deployment_id, "staging", {"job_id": request.job_id})
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "deployment_id": result.get("deployment_id"),
        "status": result.get("status"),
        "deployed_to_staging": result.get("deployed_to_staging"),
        "staging_deployed_at": result.get("staging_deployed_at"),
    }


@router.post("/deployments/{deployment_id}/production", response_model=Dict[str, Any])
async def record_production_deployment(deployment_id: str, request: ProductionDeploymentRequest) -> Dict[str, Any]:
    """Record successful production deployment (powered by CodeUChain)"""
    result = await _deployment_lifecycle_chain.run(deployment_id, "production", {"job_id": request.job_id})
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "deployment_id": result.get("deployment_id"),
        "status": result.get("status"),
        "deployed_to_production": result.get("deployed_to_production"),
        "production_deployed_at": result.get("production_deployed_at"),
    }


@router.post("/deployments/{deployment_id}/rollback", response_model=Dict[str, Any])
async def rollback_deployment(deployment_id: str, request: RollbackRequest) -> Dict[str, Any]:
    """Record rollback (powered by CodeUChain)"""
    result = await _deployment_lifecycle_chain.run(
        deployment_id,
        "rollback",
        {
            "rolled_back_to_version": request.rolled_back_to_version,
            "reason": request.reason
        }
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "deployment_id": result.get("deployment_id"),
        "status": result.get("status"),
        "rolled_back": result.get("rolled_back"),
        "rolled_back_to_version": result.get("rolled_back_to_version"),
        "rollback_reason": result.get("rollback_reason"),
    }


# ============================================================================
# Dashboard Summary
# ============================================================================

@router.get("/agents", response_model=List[Dict[str, Any]])
async def get_agents(request: Request) -> List[Dict[str, Any]]:
    """Get all agents"""
    if is_demo_mode(request):
        return await get_demo_data("agents")

    # TODO: Implement real agent fetching
    return []


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(request: Request) -> Dict[str, Any]:
    """Get quick status summary"""
    if is_demo_mode(request):
        return await get_demo_data("summary")

    running_jobs = await _job_store.list_running_jobs()
    all_jobs = await _job_store.list_jobs(limit=1000)
    all_deployments = await _deployment_store.list_deployments(limit=1000)

    # Count failed jobs today
    now = datetime.utcnow()
    today_failed = len([
        j for j in all_jobs
        if j.status == JobStatus.FAILED and j.created_at.date() == now.date()
    ])

    # Count deployments today
    today_deployments = len([
        d for d in all_deployments
        if d.created_at.date() == now.date()
    ])

    # Get recent items
    recent_jobs = running_jobs[:5]
    recent_deployments = all_deployments[:5]

    return {
        "jobs_running": len(running_jobs),
        "jobs_failed_today": today_failed,
        "deployments_today": today_deployments,
        "recent_jobs": [
            JobSummary(
                job_id=j.job_id,
                job_type=j.job_type,
                status=j.status.value,
                created_at=j.created_at.isoformat(),
                git_commit_sha=j.git_commit_sha[:12],
                git_author=j.git_author,
                duration_seconds=j.duration_seconds,
                exit_code=j.exit_code,
            )
            for j in recent_jobs
        ],
        "recent_deployments": [
            DeploymentSummary(
                deployment_id=d.deployment_id,
                service_name=d.service_name,
                service_version=d.service_version,
                status=d.status.value,
                created_at=d.created_at.isoformat(),
                git_commit_sha=d.git_commit_sha[:12],
                git_author=d.git_author,
                deployed_to_staging=d.deployed_to_staging,
                deployed_to_production=d.deployed_to_production,
                rolled_back=d.rolled_back,
            )
            for d in recent_deployments
        ],
    }


@router.get("/jobs", response_model=Dict[str, Any])
async def list_jobs(
    request: Request,
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=100)
) -> Dict[str, Any]:
    """List jobs with optional status filter (powered by CodeUChain)"""
    if is_demo_mode(request):
        jobs = await get_demo_data("jobs")
        if status:
            jobs = [j for j in jobs if j.get("status") == status]
        return {"jobs": jobs[:limit], "total": len(jobs)}

    return await _list_jobs_chain.run(status=status, limit=limit)


@router.get("/deployments", response_model=Dict[str, Any])
async def list_deployments(request: Request, limit: int = Query(100, le=100)) -> Dict[str, Any]:
    """List all deployments (powered by CodeUChain)"""
    if is_demo_mode(request):
        deployments = await get_demo_data("deployments")
        return {"deployments": deployments[:limit], "total": len(deployments)}

    return await _list_deployments_chain.run(service_name=None, limit=limit)
