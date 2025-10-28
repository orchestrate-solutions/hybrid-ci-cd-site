"""
CodeUChain Links for job queue operations.

Links handle the domain logic of queue management:
- Enqueue: Dashboard creates job → queue
- Claim: Agent polls → atomic claim
- Progress: Agent execution lifecycle
"""

from codeuchain.core import Context, Link
from typing import Any
import logging

from src.db.queue_store import JobQueueStoreInterface
from src.db.queue_models import QueuedJob, JobQueueStatus, JobQueuePriority


logger = logging.getLogger(__name__)


class EnqueueJobLink(Link):
    """Enqueue a job from dashboard for agent execution"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Enqueue a job
        
        Input: job_id, job_type, pool_name, priority, git_*, tags
        Output: job (QueuedJob), error (if validation fails)
        """
        try:
            job_id = ctx.get("job_id")
            job_type = ctx.get("job_type")
            pool_name = ctx.get("pool_name")
            priority_str = ctx.get("priority") or "normal"
            
            # Validate inputs
            if not all([job_id, job_type, pool_name]):
                return ctx.insert("error", "Missing required fields: job_id, job_type, pool_name")
            
            # Parse priority
            try:
                priority = JobQueuePriority(priority_str)
            except ValueError:
                priority = JobQueuePriority.NORMAL
            
            # Create queued job
            job = QueuedJob(
                job_id=job_id,
                job_type=job_type,
                pool_name=pool_name,
                priority=priority,
                status=JobQueueStatus.QUEUED,
                git_repo=ctx.get("git_repo") or "",
                git_ref=ctx.get("git_ref") or "",
                git_commit_sha=ctx.get("git_commit_sha") or "",
                git_commit_message=ctx.get("git_commit_message") or "",
                git_author=ctx.get("git_author") or "",
                tags=ctx.get("tags") or {},
                timeout_seconds=ctx.get("timeout_seconds") or 3600,
                max_attempts=ctx.get("max_attempts") or 3,
            )
            
            # Enqueue
            enqueued = await self.queue_store.enqueue_job(job)
            logger.info(f"Enqueued job {job_id} (type={job_type}, pool={pool_name})")
            
            return ctx.insert("job", enqueued)
        
        except Exception as e:
            logger.error(f"Error enqueueing job: {e}")
            return ctx.insert("error", str(e))


class ClaimJobLink(Link):
    """Claim a job from queue for execution"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Claim a job for agent
        
        Input: agent_id, pool_name, lease_duration_seconds (optional)
        Output: job (if available), no_jobs_available (bool)
        """
        try:
            agent_id = ctx.get("agent_id")
            pool_name = ctx.get("pool_name")
            lease_duration = ctx.get("lease_duration_seconds") or 30
            
            if not agent_id or not pool_name:
                return ctx.insert("error", "Missing agent_id or pool_name")
            
            # Atomically claim job
            job = await self.queue_store.claim_job(agent_id, pool_name, lease_duration)
            
            if not job:
                logger.debug(f"No jobs available in pool {pool_name} for agent {agent_id}")
                return ctx.insert("no_jobs_available", True)
            
            logger.info(f"Agent {agent_id} claimed job {job.job_id}")
            return ctx.insert("job", job).insert("no_jobs_available", False)
        
        except Exception as e:
            logger.error(f"Error claiming job: {e}")
            return ctx.insert("error", str(e))


class StartJobExecutionLink(Link):
    """Mark job as started (CLAIMED → RUNNING)"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Start job execution
        
        Input: job_id, agent_id
        Output: job, error (if not found)
        """
        try:
            job_id = ctx.get("job_id")
            agent_id = ctx.get("agent_id")
            
            if not job_id or not agent_id:
                return ctx.insert("error", "Missing job_id or agent_id")
            
            job = await self.queue_store.start_job(job_id, agent_id)
            
            if not job:
                return ctx.insert("error", f"Job {job_id} not found or not claimed by agent")
            
            logger.info(f"Job {job_id} started execution by agent {agent_id}")
            return ctx.insert("job", job)
        
        except Exception as e:
            logger.error(f"Error starting job: {e}")
            return ctx.insert("error", str(e))


class CompleteJobLink(Link):
    """Mark job as completed or failed"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Complete job execution
        
        Input: job_id, exit_code, duration_seconds, error_message (optional)
        Output: job, error (if not found)
        """
        try:
            job_id = ctx.get("job_id")
            exit_code = ctx.get("exit_code")
            duration_seconds = ctx.get("duration_seconds")
            error_message = ctx.get("error_message")
            
            if job_id is None or exit_code is None or duration_seconds is None:
                return ctx.insert("error", "Missing job_id, exit_code, or duration_seconds")
            
            job = await self.queue_store.complete_job(
                job_id, exit_code, duration_seconds, error_message
            )
            
            if not job:
                return ctx.insert("error", f"Job {job_id} not found")
            
            logger.info(f"Job {job_id} completed (exit_code={exit_code}, duration={duration_seconds}s)")
            return ctx.insert("job", job)
        
        except Exception as e:
            logger.error(f"Error completing job: {e}")
            return ctx.insert("error", str(e))


class RetryFailedJobLink(Link):
    """Retry a failed job if attempts remain"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Retry failed job
        
        Input: job_id
        Output: job, cannot_retry (bool), error
        """
        try:
            job_id = ctx.get("job_id")
            
            if not job_id:
                return ctx.insert("error", "Missing job_id")
            
            job = await self.queue_store.retry_failed_job(job_id)
            
            if not job:
                logger.warning(f"Cannot retry job {job_id} (no retries left or not failed)")
                return ctx.insert("cannot_retry", True)
            
            logger.info(f"Retrying job {job_id} (attempt {job.attempt})")
            return ctx.insert("job", job).insert("cannot_retry", False)
        
        except Exception as e:
            logger.error(f"Error retrying job: {e}")
            return ctx.insert("error", str(e))


class RequeueExpiredLeasesLink(Link):
    """Maintenance: requeue jobs with expired agent leases"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Requeue expired leases
        
        Output: requeued_count
        """
        try:
            count = await self.queue_store.requeue_expired_leases()
            logger.info(f"Requeued {count} jobs with expired leases")
            return ctx.insert("requeued_count", count)
        
        except Exception as e:
            logger.error(f"Error requeuing expired leases: {e}")
            return ctx.insert("error", str(e))


class GetQueueStatsLink(Link):
    """Get queue statistics for monitoring"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.queue_store = queue_store
    
    async def call(self, ctx: Context) -> Context:
        """Get queue stats
        
        Output: stats (QueueStats)
        """
        try:
            stats = await self.queue_store.get_queue_stats()
            logger.debug(f"Queue stats: queued={stats.total_queued}, running={stats.total_running}")
            return ctx.insert("stats", stats)
        
        except Exception as e:
            logger.error(f"Error getting queue stats: {e}")
            return ctx.insert("error", str(e))


class SerializeJobLink(Link):
    """Convert QueuedJob to API response"""
    
    async def call(self, ctx: Context) -> Context:
        """Serialize job to dict
        
        Input: job (QueuedJob)
        Output: job_response (dict)
        """
        job = ctx.get("job")
        
        if not job:
            return ctx.insert("job_response", {})
        
        return ctx.insert("job_response", job.to_dict())


class SerializeStatsLink(Link):
    """Convert QueueStats to API response"""
    
    async def call(self, ctx: Context) -> Context:
        """Serialize stats to dict
        
        Input: stats (QueueStats)
        Output: stats_response (dict)
        """
        stats = ctx.get("stats")
        
        if not stats:
            return ctx.insert("stats_response", {})
        
        return ctx.insert("stats_response", stats.to_dict())
