"""
Job queue store interface and in-memory implementation.

Design pattern:
- Queue operations are atomic (claim is a single operation, not read-then-write)
- Lease-based claiming prevents two agents claiming the same job
- Dead-lettering prevents infinite retry loops
- Store abstraction allows swapping to SQS/Kinesis/RabbitMQ later
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta
from collections import defaultdict

from src.db.queue_models import QueuedJob, JobQueueStatus, JobQueuePriority, QueueStats


logger = logging.getLogger(__name__)


class JobQueueStoreInterface(ABC):
    """Abstract interface for job queue storage"""
    
    @abstractmethod
    async def enqueue_job(self, job: QueuedJob) -> QueuedJob:
        """Add a job to the queue"""
        pass
    
    @abstractmethod
    async def claim_job(self, agent_id: str, pool_name: str, lease_duration_seconds: int = 30) -> Optional[QueuedJob]:
        """Atomically claim a job for execution (QUEUED → CLAIMED)
        
        Returns the claimed job or None if queue is empty.
        Lease prevents other agents claiming while this one executes.
        """
        pass
    
    @abstractmethod
    async def start_job(self, job_id: str, agent_id: str) -> Optional[QueuedJob]:
        """Mark job as running (CLAIMED → RUNNING)"""
        pass
    
    @abstractmethod
    async def complete_job(self, job_id: str, exit_code: int, duration_seconds: int,
                          error_message: Optional[str] = None) -> Optional[QueuedJob]:
        """Mark job as completed or failed"""
        pass
    
    @abstractmethod
    async def get_job(self, job_id: str) -> Optional[QueuedJob]:
        """Retrieve a job by ID"""
        pass
    
    @abstractmethod
    async def list_queued_jobs(self, pool_name: Optional[str] = None, limit: int = 100) -> List[QueuedJob]:
        """List jobs in QUEUED status"""
        pass
    
    @abstractmethod
    async def list_running_jobs(self, pool_name: Optional[str] = None) -> List[QueuedJob]:
        """List jobs currently being executed"""
        pass
    
    @abstractmethod
    async def list_agent_jobs(self, agent_id: str) -> List[QueuedJob]:
        """List all jobs claimed/executed by an agent"""
        pass
    
    @abstractmethod
    async def requeue_expired_leases(self) -> int:
        """Find jobs with expired leases and re-queue them. Returns count."""
        pass
    
    @abstractmethod
    async def retry_failed_job(self, job_id: str) -> Optional[QueuedJob]:
        """Retry a failed job (increment attempt, set to QUEUED)"""
        pass
    
    @abstractmethod
    async def get_queue_stats(self) -> QueueStats:
        """Get queue statistics for monitoring"""
        pass


class InMemoryJobQueueStore(JobQueueStoreInterface):
    """In-memory job queue implementation for development"""
    
    def __init__(self):
        self._jobs: Dict[str, QueuedJob] = {}
        self._queue_by_status: Dict[JobQueueStatus, List[str]] = defaultdict(list)  # job_ids
        self._queue_by_pool: Dict[str, List[str]] = defaultdict(list)  # pool_name -> job_ids
    
    async def enqueue_job(self, job: QueuedJob) -> QueuedJob:
        """Add a job to the queue"""
        job.status = JobQueueStatus.QUEUED
        job.queued_at = datetime.utcnow()
        self._jobs[job.job_id] = job
        self._queue_by_status[JobQueueStatus.QUEUED].append(job.job_id)
        self._queue_by_pool[job.pool_name].append(job.job_id)
        
        logger.info(f"Enqueued job {job.job_id} in pool {job.pool_name} (type={job.job_type}, priority={job.priority.value})")
        return job
    
    async def claim_job(self, agent_id: str, pool_name: str, lease_duration_seconds: int = 30) -> Optional[QueuedJob]:
        """Atomically claim a job (QUEUED → CLAIMED with lease)"""
        # Find highest priority queued job in pool
        queued_jobs = [
            self._jobs[jid] for jid in self._queue_by_pool.get(pool_name, [])
            if self._jobs[jid].status == JobQueueStatus.QUEUED
        ]
        
        if not queued_jobs:
            return None
        
        # Sort by priority (critical > high > normal > low)
        priority_order = {JobQueuePriority.CRITICAL: 4, JobQueuePriority.HIGH: 3, 
                         JobQueuePriority.NORMAL: 2, JobQueuePriority.LOW: 1}
        queued_jobs.sort(key=lambda j: (-priority_order.get(j.priority, 0), j.queued_at))
        
        job = queued_jobs[0]
        
        # Atomically claim
        job.status = JobQueueStatus.CLAIMED
        job.claimed_by_agent = agent_id
        job.claimed_at = datetime.utcnow()
        job.claimed_lease_expires_at = datetime.utcnow() + timedelta(seconds=lease_duration_seconds)
        job.updated_at = datetime.utcnow()
        
        # Update tracking
        self._queue_by_status[JobQueueStatus.QUEUED].remove(job.job_id)
        self._queue_by_status[JobQueueStatus.CLAIMED].append(job.job_id)
        
        logger.info(f"Agent {agent_id} claimed job {job.job_id} (lease expires in {lease_duration_seconds}s)")
        return job
    
    async def start_job(self, job_id: str, agent_id: str) -> Optional[QueuedJob]:
        """Mark job as running (CLAIMED → RUNNING)"""
        job = self._jobs.get(job_id)
        if not job or job.claimed_by_agent != agent_id:
            return None
        
        job.status = JobQueueStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        
        # Update tracking
        if job.job_id in self._queue_by_status[JobQueueStatus.CLAIMED]:
            self._queue_by_status[JobQueueStatus.CLAIMED].remove(job.job_id)
        self._queue_by_status[JobQueueStatus.RUNNING].append(job.job_id)
        
        logger.info(f"Job {job_id} started execution by agent {agent_id}")
        return job
    
    async def complete_job(self, job_id: str, exit_code: int, duration_seconds: int,
                          error_message: Optional[str] = None) -> Optional[QueuedJob]:
        """Mark job as completed or failed"""
        job = self._jobs.get(job_id)
        if not job:
            return None
        
        # Determine success/failure
        if exit_code == 0:
            job.status = JobQueueStatus.COMPLETED
        else:
            job.status = JobQueueStatus.FAILED
        
        job.exit_code = exit_code
        job.duration_seconds = duration_seconds
        job.error_message = error_message
        job.completed_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        
        # Update tracking
        if job.job_id in self._queue_by_status[JobQueueStatus.RUNNING]:
            self._queue_by_status[JobQueueStatus.RUNNING].remove(job.job_id)
        self._queue_by_status[job.status].append(job.job_id)
        
        logger.info(f"Job {job_id} completed with exit_code={exit_code}, duration={duration_seconds}s")
        return job
    
    async def get_job(self, job_id: str) -> Optional[QueuedJob]:
        """Retrieve a job by ID"""
        return self._jobs.get(job_id)
    
    async def list_queued_jobs(self, pool_name: Optional[str] = None, limit: int = 100) -> List[QueuedJob]:
        """List jobs in QUEUED status"""
        jobs = [self._jobs[jid] for jid in self._queue_by_status[JobQueueStatus.QUEUED]]
        
        if pool_name:
            jobs = [j for j in jobs if j.pool_name == pool_name]
        
        # Sort by priority desc, then queued_at asc
        priority_order = {JobQueuePriority.CRITICAL: 4, JobQueuePriority.HIGH: 3,
                         JobQueuePriority.NORMAL: 2, JobQueuePriority.LOW: 1}
        jobs.sort(key=lambda j: (-priority_order.get(j.priority, 0), j.queued_at))
        
        return jobs[:limit]
    
    async def list_running_jobs(self, pool_name: Optional[str] = None) -> List[QueuedJob]:
        """List jobs currently being executed"""
        jobs = [self._jobs[jid] for jid in self._queue_by_status[JobQueueStatus.RUNNING]]
        
        if pool_name:
            jobs = [j for j in jobs if j.pool_name == pool_name]
        
        jobs.sort(key=lambda j: j.started_at or j.claimed_at)
        return jobs
    
    async def list_agent_jobs(self, agent_id: str) -> List[QueuedJob]:
        """List all jobs claimed/executed by an agent"""
        jobs = [j for j in self._jobs.values() if j.claimed_by_agent == agent_id]
        jobs.sort(key=lambda j: j.claimed_at or j.queued_at, reverse=True)
        return jobs
    
    async def requeue_expired_leases(self) -> int:
        """Find jobs with expired leases and re-queue them"""
        count = 0
        now = datetime.utcnow()
        
        for job in self._jobs.values():
            if job.status == JobQueueStatus.CLAIMED and job.is_lease_expired():
                job.status = JobQueueStatus.QUEUED
                job.claimed_by_agent = None
                job.claimed_lease_expires_at = None
                job.updated_at = now
                
                # Update tracking
                self._queue_by_status[JobQueueStatus.CLAIMED].remove(job.job_id)
                self._queue_by_status[JobQueueStatus.QUEUED].append(job.job_id)
                
                logger.warning(f"Re-queued job {job.job_id} (lease expired)")
                count += 1
        
        return count
    
    async def retry_failed_job(self, job_id: str) -> Optional[QueuedJob]:
        """Retry a failed job if attempts remain, else move to DEAD_LETTERED"""
        job = self._jobs.get(job_id)
        if not job:
            return None
        
        # If job can't retry, move to dead letter
        if not job.can_retry():
            if job.status == JobQueueStatus.FAILED:
                job.status = JobQueueStatus.DEAD_LETTERED
                self._queue_by_status[JobQueueStatus.FAILED].remove(job.job_id)
                self._queue_by_status[JobQueueStatus.DEAD_LETTERED].append(job.job_id)
                logger.warning(f"Job {job_id} moved to DEAD_LETTERED (max retries exhausted)")
            return None
        
        # Reset for retry
        job.attempt += 1
        job.status = JobQueueStatus.QUEUED
        job.claimed_by_agent = None
        job.claimed_at = None
        job.claimed_lease_expires_at = None
        job.started_at = None
        job.completed_at = None
        job.exit_code = None
        job.duration_seconds = None
        job.error_message = None
        job.updated_at = datetime.utcnow()
        
        # Update tracking
        self._queue_by_status[JobQueueStatus.FAILED].remove(job.job_id)
        self._queue_by_status[JobQueueStatus.QUEUED].append(job.job_id)
        
        logger.info(f"Retrying job {job_id} (attempt {job.attempt}/{job.max_attempts})")
        return job
    
    async def get_queue_stats(self) -> QueueStats:
        """Get queue statistics for monitoring"""
        # Count jobs by status
        queued = len(self._queue_by_status[JobQueueStatus.QUEUED])
        claimed = len(self._queue_by_status[JobQueueStatus.CLAIMED])
        running = len(self._queue_by_status[JobQueueStatus.RUNNING])
        completed = len(self._queue_by_status[JobQueueStatus.COMPLETED])
        failed = len(self._queue_by_status[JobQueueStatus.FAILED])
        dead_lettered = len(self._queue_by_status[JobQueueStatus.DEAD_LETTERED])
        
        # Calculate timing metrics
        completed_jobs = [self._jobs[jid] for jid in self._queue_by_status[JobQueueStatus.COMPLETED]]
        failed_jobs = [self._jobs[jid] for jid in self._queue_by_status[JobQueueStatus.FAILED]]
        
        all_finished = completed_jobs + failed_jobs
        
        avg_queue_wait = 0.0
        avg_execution = 0.0
        if all_finished:
            wait_times = [(j.claimed_at - j.queued_at).total_seconds() for j in all_finished if j.claimed_at]
            execution_times = [j.duration_seconds or 0 for j in all_finished if j.duration_seconds]
            
            if wait_times:
                avg_queue_wait = sum(wait_times) / len(wait_times)
            if execution_times:
                avg_execution = sum(execution_times) / len(execution_times)
        
        # Calculate failure rate
        total_finished = completed + failed + dead_lettered
        failure_rate = (failed + dead_lettered) / total_finished if total_finished > 0 else 0.0
        
        # Calculate p95 queue wait (simple: 95th percentile)
        p95_wait = 0.0
        if all_finished:
            wait_times = sorted([(j.claimed_at - j.queued_at).total_seconds() for j in all_finished if j.claimed_at])
            if wait_times:
                idx = int(len(wait_times) * 0.95)
                p95_wait = wait_times[min(idx, len(wait_times) - 1)]
        
        return QueueStats(
            total_queued=queued,
            total_claimed=claimed,
            total_running=running,
            total_completed=completed,
            total_failed=failed,
            total_dead_lettered=dead_lettered,
            avg_queue_wait_seconds=avg_queue_wait,
            avg_execution_seconds=avg_execution,
            failure_rate=failure_rate,
            p95_queue_wait=p95_wait,
        )
