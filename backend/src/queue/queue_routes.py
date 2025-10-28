"""
FastAPI routes for job queue management.

Endpoints enable:
- Dashboard: enqueue jobs for agent execution
- Agents: claim work, report progress, complete jobs
- Monitoring: queue statistics and job tracking
"""

from fastapi import APIRouter, HTTPException, Query
import logging
from typing import Optional
from datetime import datetime

from src.db.queue_store import JobQueueStoreInterface
from src.db.queue_models import JobQueuePriority
from src.components.chains.queue_chains import (
    EnqueueChain,
    ClaimChain,
    StartChain,
    CompleteChain,
    MaintenanceChain,
    StatsChain,
)


logger = logging.getLogger(__name__)


def create_queue_router(queue_store: JobQueueStoreInterface) -> APIRouter:
    """Create queue API router with store dependency"""
    
    router = APIRouter(prefix="/api/queue", tags=["queue"])
    
    # Initialize chains
    enqueue_chain = EnqueueChain(queue_store)
    claim_chain = ClaimChain(queue_store)
    start_chain = StartChain(queue_store)
    complete_chain = CompleteChain(queue_store)
    stats_chain = StatsChain(queue_store)
    maintenance_chain = MaintenanceChain(queue_store)
    
    # Dashboard: Enqueue job
    @router.post("/jobs")
    async def enqueue_job(
        job_id: str,
        job_type: str,
        pool_name: str,
        git_repo: Optional[str] = None,
        git_ref: Optional[str] = None,
        git_commit_sha: Optional[str] = None,
        git_commit_message: Optional[str] = None,
        git_author: Optional[str] = None,
        priority: str = "normal",
        timeout_seconds: int = 3600,
        max_attempts: int = 3,
        tags: Optional[dict] = None,
    ):
        """Enqueue a job from dashboard
        
        Returns:
        - job_response: QueuedJob serialized to dict
        - error: if validation fails
        """
        
        try:
            result = await enqueue_chain.run({
                "job_id": job_id,
                "job_type": job_type,
                "pool_name": pool_name,
                "git_repo": git_repo or "",
                "git_ref": git_ref or "",
                "git_commit_sha": git_commit_sha or "",
                "git_commit_message": git_commit_message or "",
                "git_author": git_author or "",
                "priority": priority,
                "timeout_seconds": timeout_seconds,
                "max_attempts": max_attempts,
                "tags": tags or {},
            })
            
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result.get("error"))
            
            return {
                "status": "success",
                "job": result.get("job_response", result),
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error enqueueing job: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Agent: Claim work
    @router.post("/claim")
    async def claim_job(
        agent_id: str,
        pool_name: str,
        lease_duration_seconds: int = 30,
    ):
        """Agent claims a job from queue
        
        Returns:
        - job_response: Job details if claimed
        - no_jobs_available: true if queue is empty
        - error: if something fails
        """
        
        try:
            result = await claim_chain.run({
                "agent_id": agent_id,
                "pool_name": pool_name,
                "lease_duration_seconds": lease_duration_seconds,
            })
            
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result.get("error"))
            
            no_jobs = result.get("no_jobs_available", True)
            
            return {
                "status": "success",
                "no_jobs_available": no_jobs,
                "job": result.get("job_response") if not no_jobs else None,
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error claiming job: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Agent: Mark job as started
    @router.patch("/jobs/{job_id}/start")
    async def start_job(job_id: str, agent_id: str):
        """Agent marks job as started (CLAIMED → RUNNING)
        
        Returns:
        - job_response: Updated job details
        - error: if job not found or not claimed
        """
        
        try:
            result = await start_chain.run({
                "job_id": job_id,
                "agent_id": agent_id,
            })
            
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result.get("error"))
            
            return {
                "status": "success",
                "job": result.get("job_response", {}),
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error starting job: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Agent: Report completion
    @router.patch("/jobs/{job_id}/complete")
    async def complete_job(
        job_id: str,
        exit_code: int,
        duration_seconds: float,
        error_message: Optional[str] = None,
    ):
        """Agent reports job completion
        
        Returns:
        - job_response: Updated job details
        - retried: whether job was automatically retried
        - error: if job not found
        """
        
        try:
            result = await complete_chain.run({
                "job_id": job_id,
                "exit_code": exit_code,
                "duration_seconds": duration_seconds,
                "error_message": error_message,
            })
            
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result.get("error"))
            
            retried = result.get("retried", False)
            
            return {
                "status": "success",
                "job": result.get("job", {}),
                "retried": retried,
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error completing job: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Dashboard: List queued jobs
    @router.get("/jobs")
    async def list_jobs(pool_name: Optional[str] = None, status: Optional[str] = None):
        """List jobs in queue
        
        Returns:
        - jobs: List of QueuedJob objects
        """
        
        try:
            jobs = await queue_store.list_queued_jobs(pool_name)
            
            # Filter by status if provided
            if status:
                jobs = [j for j in jobs if j.status.value == status]
            
            job_dicts = [j.to_dict() for j in jobs]
            
            return {
                "status": "success",
                "jobs": job_dicts,
                "count": len(job_dicts),
            }
        
        except Exception as e:
            logger.error(f"Error listing jobs: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Dashboard: Get job by ID
    @router.get("/jobs/{job_id}")
    async def get_job(job_id: str):
        """Get job details by ID
        
        Returns:
        - job: QueuedJob details
        """
        
        try:
            job = await queue_store.get_job(job_id)
            
            if not job:
                raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
            
            return {
                "status": "success",
                "job": job.to_dict(),
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting job: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Monitoring: Queue statistics
    @router.get("/stats")
    async def get_stats():
        """Get queue statistics for monitoring
        
        Returns:
        - stats: QueueStats with queue depth, timing, failure rate, p95
        """
        
        try:
            result = await stats_chain.run({})
            
            if result.get("error"):
                raise HTTPException(status_code=500, detail=result.get("error"))
            
            return {
                "status": "success",
                "stats": result.get("stats", {}),
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    # Maintenance: Requeue expired leases
    @router.post("/maintenance/requeue-expired")
    async def requeue_expired():
        """Requeue jobs with expired agent leases (maintenance endpoint)
        
        Returns:
        - requeued_count: Number of jobs requeued
        """
        
        try:
            result = await maintenance_chain.run({})
            
            if result.get("error"):
                raise HTTPException(status_code=500, detail=result.get("error"))
            
            return {
                "status": "success",
                "requeued_count": result.get("requeued_count", 0),
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error requeuing expired leases: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    return router
