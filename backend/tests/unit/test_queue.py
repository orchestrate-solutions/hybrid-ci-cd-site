"""
Unit tests for queue models and store layer.

Tests cover:
- Job lifecycle (QUEUED → CLAIMED → RUNNING → COMPLETED/FAILED)
- Atomic claiming (no race conditions)
- Lease expiration tracking
- Retry logic with max attempts
- Dead-lettering for exhausted retries
- Priority-based job selection
- Queue statistics calculation
"""

import pytest
from datetime import datetime, timedelta
from src.db.queue_models import (
    QueuedJob,
    JobQueueStatus,
    JobQueuePriority,
    QueueStats,
)
from src.db.queue_store import InMemoryJobQueueStore


@pytest.fixture
def queue_store():
    """Fresh queue store for each test"""
    return InMemoryJobQueueStore()


class TestQueuedJobModel:
    """Tests for QueuedJob dataclass"""
    
    def test_create_queued_job(self):
        """Job is created in QUEUED state"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            priority=JobQueuePriority.NORMAL,
            status=JobQueueStatus.QUEUED,
            git_repo="https://github.com/test/repo",
            git_ref="main",
            git_commit_sha="abc123",
            git_commit_message="Fix bug",
            git_author="test@example.com",
        )
        
        assert job.job_id == "job-1"
        assert job.status == JobQueueStatus.QUEUED
        assert job.priority == JobQueuePriority.NORMAL
        assert job.attempt == 1
        assert job.claimed_by_agent is None
    
    def test_job_to_dict(self):
        """Job serializes to dict for API responses"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            priority=JobQueuePriority.HIGH,
            status=JobQueueStatus.QUEUED,
        )
        
        d = job.to_dict()
        
        assert d["job_id"] == "job-1"
        assert d["status"] == "queued"  # Enum value is lowercase
        assert d["priority"] == "high"
        assert d["attempt"] == 1
    
    def test_can_retry_with_attempts_remaining(self):
        """Job with remaining attempts can be retried"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            max_attempts=3,
            attempt=2,
        )
        
        assert job.can_retry() is True
    
    def test_cannot_retry_when_max_attempts_exhausted(self):
        """Job with no remaining attempts cannot be retried"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            max_attempts=3,
            attempt=3,
        )
        
        assert job.can_retry() is False
    
    def test_lease_expired_check(self):
        """Lease expiration is detected correctly"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            status=JobQueueStatus.CLAIMED,
            claimed_by_agent="agent-1",
            claimed_lease_expires_at=datetime.utcnow() - timedelta(seconds=1),
        )
        
        assert job.lease_expired() is True
    
    def test_lease_not_expired(self):
        """Active lease is not expired"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
            status=JobQueueStatus.CLAIMED,
            claimed_by_agent="agent-1",
            claimed_lease_expires_at=datetime.utcnow() + timedelta(seconds=30),
        )
        
        assert job.lease_expired() is False


class TestJobQueueStore:
    """Tests for InMemoryJobQueueStore"""
    
    @pytest.mark.asyncio
    async def test_enqueue_job(self, queue_store):
        """Job is enqueued successfully"""
        job = QueuedJob(
            job_id="job-1",
            job_type="deploy",
            pool_name="prod",
        )
        
        result = await queue_store.enqueue_job(job)
        
        assert result.job_id == "job-1"
        assert result.status == JobQueueStatus.QUEUED
    
    @pytest.mark.asyncio
    async def test_claim_job_returns_highest_priority(self, queue_store):
        """Claim selects highest priority queued job"""
        # Enqueue jobs with different priorities
        low = QueuedJob("job-1", "deploy", "prod", priority=JobQueuePriority.LOW)
        high = QueuedJob("job-2", "deploy", "prod", priority=JobQueuePriority.HIGH)
        critical = QueuedJob("job-3", "deploy", "prod", priority=JobQueuePriority.CRITICAL)
        normal = QueuedJob("job-4", "deploy", "prod", priority=JobQueuePriority.NORMAL)
        
        await queue_store.enqueue_job(low)
        await queue_store.enqueue_job(high)
        await queue_store.enqueue_job(critical)
        await queue_store.enqueue_job(normal)
        
        # Claim should get critical
        claimed = await queue_store.claim_job("agent-1", "prod")
        
        assert claimed.job_id == "job-3"
        assert claimed.status == JobQueueStatus.CLAIMED
        assert claimed.claimed_by_agent == "agent-1"
    
    @pytest.mark.asyncio
    async def test_claim_job_sets_lease_expiration(self, queue_store):
        """Claim sets lease expiration correctly"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        
        claimed = await queue_store.claim_job("agent-1", "prod", lease_duration_seconds=60)
        
        assert claimed.claimed_lease_expires_at is not None
        assert claimed.claimed_lease_expires_at > datetime.utcnow()
    
    @pytest.mark.asyncio
    async def test_claim_returns_none_if_no_jobs(self, queue_store):
        """Claim returns None when queue is empty"""
        result = await queue_store.claim_job("agent-1", "prod")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_claim_only_from_same_pool(self, queue_store):
        """Claim respects pool boundaries"""
        job_prod = QueuedJob("job-1", "deploy", "prod")
        job_staging = QueuedJob("job-2", "deploy", "staging")
        
        await queue_store.enqueue_job(job_prod)
        await queue_store.enqueue_job(job_staging)
        
        # Claim from prod
        claimed = await queue_store.claim_job("agent-1", "prod")
        
        assert claimed.job_id == "job-1"
    
    @pytest.mark.asyncio
    async def test_start_job_transitions_to_running(self, queue_store):
        """Start transitions CLAIMED → RUNNING"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        
        claimed = await queue_store.claim_job("agent-1", "prod")
        assert claimed.status == JobQueueStatus.CLAIMED
        
        started = await queue_store.start_job("job-1", "agent-1")
        
        assert started.status == JobQueueStatus.RUNNING
        assert started.started_at is not None
    
    @pytest.mark.asyncio
    async def test_complete_job_with_exit_code_zero(self, queue_store):
        """Complete with exit_code=0 marks job as COMPLETED"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        claimed = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        
        completed = await queue_store.complete_job(
            "job-1",
            exit_code=0,
            duration_seconds=45.5,
        )
        
        assert completed.status == JobQueueStatus.COMPLETED
        assert completed.exit_code == 0
        assert completed.duration_seconds == 45.5
    
    @pytest.mark.asyncio
    async def test_complete_job_with_nonzero_exit_code(self, queue_store):
        """Complete with exit_code!=0 marks job as FAILED"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        
        failed = await queue_store.complete_job(
            "job-1",
            exit_code=1,
            duration_seconds=30.0,
            error_message="Deployment failed",
        )
        
        assert failed.status == JobQueueStatus.FAILED
        assert failed.error_message == "Deployment failed"
    
    @pytest.mark.asyncio
    async def test_retry_failed_job(self, queue_store):
        """Retry transitions FAILED → QUEUED"""
        job = QueuedJob("job-1", "deploy", "prod", max_attempts=3)
        await queue_store.enqueue_job(job)
        claimed = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        await queue_store.complete_job("job-1", 1, 30.0)
        
        # Retry should requeue
        retried = await queue_store.retry_failed_job("job-1")
        
        assert retried is not None
        assert retried.status == JobQueueStatus.QUEUED
        assert retried.attempt == 2
    
    @pytest.mark.asyncio
    async def test_retry_returns_none_when_no_retries_left(self, queue_store):
        """Retry returns None when max attempts exhausted"""
        job = QueuedJob("job-1", "deploy", "prod", max_attempts=1)
        await queue_store.enqueue_job(job)
        claimed = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        await queue_store.complete_job("job-1", 1, 30.0)
        
        # Retry should fail (no retries left)
        retried = await queue_store.retry_failed_job("job-1")
        
        assert retried is None
    
    @pytest.mark.asyncio
    async def test_dead_letter_on_retry_exhaustion(self, queue_store):
        """Job moves to DEAD_LETTERED when retries exhausted"""
        job = QueuedJob("job-1", "deploy", "prod", max_attempts=1)
        await queue_store.enqueue_job(job)
        claimed = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        await queue_store.complete_job("job-1", 1, 30.0)
        
        # Try retry (fails, since no retries left)
        retried = await queue_store.retry_failed_job("job-1")
        assert retried is None
        
        # Job should be in dead letter
        job_after = await queue_store.get_job("job-1")
        assert job_after.status == JobQueueStatus.DEAD_LETTERED
    
    @pytest.mark.asyncio
    async def test_requeue_expired_leases(self, queue_store):
        """Expired leases are requeued"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        
        # Claim with 1-second lease
        claimed = await queue_store.claim_job("agent-1", "prod", lease_duration_seconds=1)
        assert claimed.status == JobQueueStatus.CLAIMED
        
        # Simulate time passing (in real scenario, would use sleep)
        claimed.claimed_lease_expires_at = datetime.utcnow() - timedelta(seconds=1)
        
        # Requeue expired
        requeued = await queue_store.requeue_expired_leases()
        
        assert requeued == 1
    
    @pytest.mark.asyncio
    async def test_get_job(self, queue_store):
        """Retrieve job by ID"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        
        retrieved = await queue_store.get_job("job-1")
        
        assert retrieved.job_id == "job-1"
    
    @pytest.mark.asyncio
    async def test_get_job_returns_none_if_not_found(self, queue_store):
        """Get returns None for non-existent job"""
        result = await queue_store.get_job("nonexistent")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_list_queued_jobs(self, queue_store):
        """List queued jobs in pool"""
        for i in range(3):
            job = QueuedJob(f"job-{i}", "deploy", "prod")
            await queue_store.enqueue_job(job)
        
        jobs = await queue_store.list_queued_jobs("prod")
        
        assert len(jobs) == 3
    
    @pytest.mark.asyncio
    async def test_list_running_jobs(self, queue_store):
        """List running jobs"""
        job = QueuedJob("job-1", "deploy", "prod")
        await queue_store.enqueue_job(job)
        claimed = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job("job-1", "agent-1")
        
        running = await queue_store.list_running_jobs()
        
        assert len(running) == 1
        assert running[0].job_id == "job-1"
    
    @pytest.mark.asyncio
    async def test_get_queue_stats(self, queue_store):
        """Queue statistics are calculated correctly"""
        # Add some jobs
        for i in range(3):
            job = QueuedJob(f"job-{i}", "deploy", "prod")
            await queue_store.enqueue_job(job)
        
        stats = await queue_store.get_queue_stats()
        
        assert stats.total_queued == 3
        assert stats.total_running == 0
        assert stats.total_completed == 0
    
    @pytest.mark.asyncio
    async def test_queue_stats_with_various_states(self, queue_store):
        """Statistics track jobs in different states"""
        # Enqueue 3 jobs
        for i in range(3):
            await queue_store.enqueue_job(QueuedJob(f"job-{i}", "deploy", "prod"))
        
        # Claim and run one
        j1 = await queue_store.claim_job("agent-1", "prod")
        await queue_store.start_job(j1.job_id, "agent-1")
        
        # Complete one
        await queue_store.complete_job(j1.job_id, 0, 60.0)
        
        stats = await queue_store.get_queue_stats()
        
        assert stats.total_queued == 2  # Two still queued
        assert stats.total_running == 0  # None currently running
        assert stats.total_completed == 1
