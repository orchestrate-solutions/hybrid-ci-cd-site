"""
Integration tests for queue chains and API routes.

Tests cover:
- End-to-end job lifecycle via chains
- API endpoints for dashboard and agents
- Error handling and edge cases
- Priority-based dispatch
- Retry behavior
"""

import pytest
from fastapi.testclient import TestClient
from src.db.queue_store import InMemoryJobQueueStore
from src.components.chains.queue_chains import (
    EnqueueChain,
    ClaimChain,
    StartChain,
    CompleteChain,
    StatsChain,
)
from src.queue.queue_routes import create_queue_router


@pytest.fixture
def queue_store():
    """Fresh queue store for each test"""
    return InMemoryJobQueueStore()


@pytest.fixture
def client(queue_store):
    """FastAPI test client with queue router"""
    from fastapi import FastAPI
    
    app = FastAPI()
    router = create_queue_router(queue_store)
    app.include_router(router)
    
    return TestClient(app)


class TestQueueChains:
    """Test CodeUChain queue workflows"""
    
    @pytest.mark.asyncio
    async def test_enqueue_chain(self, queue_store):
        """EnqueueChain: dashboard → queue"""
        chain = EnqueueChain(queue_store)
        
        result = await chain.run({
            "job_id": "job-1",
            "job_type": "deploy",
            "pool_name": "prod",
            "git_repo": "https://github.com/test/repo",
            "git_ref": "main",
            "priority": "high",
        })
        
        assert result.get("error") is None
        # Result will have job_response from SerializeJobLink
        job = result
        assert job.get("job_id") == "job-1"
        assert job.get("status") == "queued"
        assert job.get("priority") == "high"
    
    @pytest.mark.asyncio
    async def test_enqueue_chain_validation_error(self, queue_store):
        """EnqueueChain fails gracefully on invalid input"""
        chain = EnqueueChain(queue_store)
        
        result = await chain.run({
            # Missing required fields
            "job_id": "job-1",
            # pool_name missing
        })
        
        assert result.get("error") is not None
    
    @pytest.mark.asyncio
    async def test_claim_chain(self, queue_store):
        """ClaimChain: agent → claim work"""
        # First enqueue a job
        enqueue = EnqueueChain(queue_store)
        enqueue_ctx = Context({
            "job_id": "job-1",
            "job_type": "deploy",
            "pool_name": "prod",
        })
        await enqueue.run(enqueue_ctx)
        
        # Now claim it
        claim = ClaimChain(queue_store)
        claim_ctx = Context({
            "agent_id": "agent-1",
            "pool_name": "prod",
        })
        
        result = await claim.run(claim_ctx)
        
        assert result.get("no_jobs_available") is False
        assert result.get("job_response") is not None
        job = result.get("job_response", {})
        assert job.get("job_id") == "job-1"
        assert job.get("status") == "CLAIMED"
    
    @pytest.mark.asyncio
    async def test_claim_chain_no_jobs(self, queue_store):
        """ClaimChain returns no_jobs_available when queue empty"""
        claim = ClaimChain(queue_store)
        ctx = Context({
            "agent_id": "agent-1",
            "pool_name": "prod",
        })
        
        result = await claim.run(ctx)
        
        assert result.get("no_jobs_available") is True
    
    @pytest.mark.asyncio
    async def test_start_chain(self, queue_store):
        """StartChain: agent marks job as started"""
        # Enqueue and claim
        enqueue = EnqueueChain(queue_store)
        await enqueue.run(Context({
            "job_id": "job-1",
            "job_type": "deploy",
            "pool_name": "prod",
        }))
        
        claim = ClaimChain(queue_store)
        claim_result = await claim.run(Context({
            "agent_id": "agent-1",
            "pool_name": "prod",
        }))
        
        # Start execution
        start = StartChain(queue_store)
        start_result = await start.run(Context({
            "job_id": "job-1",
            "agent_id": "agent-1",
        }))
        
        assert start_result.get("error") is None
        job = start_result.get("job_response", {})
        assert job.get("status") == "RUNNING"
    
    @pytest.mark.asyncio
    async def test_complete_chain_success(self, queue_store):
        """CompleteChain: job succeeds"""
        # Setup: enqueue, claim, start
        enqueue = EnqueueChain(queue_store)
        await enqueue.run(Context({
            "job_id": "job-1",
            "job_type": "deploy",
            "pool_name": "prod",
        }))
        
        claim = ClaimChain(queue_store)
        await claim.run(Context({
            "agent_id": "agent-1",
            "pool_name": "prod",
        }))
        
        start = StartChain(queue_store)
        await start.run(Context({
            "job_id": "job-1",
            "agent_id": "agent-1",
        }))
        
        # Complete successfully
        complete = CompleteChain(queue_store)
        result = await complete.run(Context({
            "job_id": "job-1",
            "exit_code": 0,
            "duration_seconds": 45.5,
        }))
        
        assert result.get("error") is None
        job = result.get("job_response", {})
        assert job.get("status") == "COMPLETED"
        assert job.get("exit_code") == 0
    
    @pytest.mark.asyncio
    async def test_complete_chain_failure_with_retry(self, queue_store):
        """CompleteChain: job fails but retries"""
        # Setup: enqueue with max_attempts=3, claim, start
        enqueue = EnqueueChain(queue_store)
        await enqueue.run(Context({
            "job_id": "job-1",
            "job_type": "deploy",
            "pool_name": "prod",
            "max_attempts": "3",
        }))
        
        claim = ClaimChain(queue_store)
        await claim.run(Context({
            "agent_id": "agent-1",
            "pool_name": "prod",
        }))
        
        start = StartChain(queue_store)
        await start.run(Context({
            "job_id": "job-1",
            "agent_id": "agent-1",
        }))
        
        # Complete with failure
        complete = CompleteChain(queue_store)
        result = await complete.run(Context({
            "job_id": "job-1",
            "exit_code": 1,
            "duration_seconds": 30.0,
            "error_message": "Test failed",
        }))
        
        assert result.get("error") is None
        job = result.get("job_response", {})
        # After retry, job should be requeued
        assert job.get("status") == "QUEUED"
        assert job.get("attempt") == 2
    
    @pytest.mark.asyncio
    async def test_stats_chain(self, queue_store):
        """StatsChain: get queue statistics"""
        # Add some jobs
        enqueue = EnqueueChain(queue_store)
        for i in range(3):
            await enqueue.run(Context({
                "job_id": f"job-{i}",
                "job_type": "deploy",
                "pool_name": "prod",
            }))
        
        # Get stats
        stats = StatsChain(queue_store)
        result = await stats.run(Context({}))
        
        assert result.get("error") is None
        stats_dict = result.get("stats_response", {})
        assert stats_dict.get("total_queued") == 3


class TestQueueRoutes:
    """Test REST API endpoints"""
    
    def test_enqueue_job_endpoint(self, client):
        """POST /api/queue/jobs enqueues job"""
        response = client.post(
            "/api/queue/jobs",
            params={
                "job_id": "job-1",
                "job_type": "deploy",
                "pool_name": "prod",
                "git_repo": "https://github.com/test/repo",
                "git_ref": "main",
                "priority": "high",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["job"]["job_id"] == "job-1"
        assert data["job"]["status"] == "QUEUED"
    
    def test_enqueue_job_missing_params(self, client):
        """POST /api/queue/jobs rejects invalid input"""
        response = client.post(
            "/api/queue/jobs",
            params={
                # Missing job_type and pool_name
                "job_id": "job-1",
            }
        )
        
        assert response.status_code == 400
    
    def test_claim_job_endpoint(self, client):
        """POST /api/queue/claim claims job"""
        # First enqueue
        client.post(
            "/api/queue/jobs",
            params={
                "job_id": "job-1",
                "job_type": "deploy",
                "pool_name": "prod",
            }
        )
        
        # Then claim
        response = client.post(
            "/api/queue/claim",
            params={
                "agent_id": "agent-1",
                "pool_name": "prod",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["no_jobs_available"] is False
        assert data["job"]["job_id"] == "job-1"
        assert data["job"]["status"] == "CLAIMED"
    
    def test_claim_job_empty_queue(self, client):
        """POST /api/queue/claim returns no_jobs_available"""
        response = client.post(
            "/api/queue/claim",
            params={
                "agent_id": "agent-1",
                "pool_name": "prod",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["no_jobs_available"] is True
    
    def test_start_job_endpoint(self, client):
        """PATCH /api/queue/jobs/{job_id}/start starts execution"""
        # Setup
        client.post(
            "/api/queue/jobs",
            params={
                "job_id": "job-1",
                "job_type": "deploy",
                "pool_name": "prod",
            }
        )
        
        client.post(
            "/api/queue/claim",
            params={
                "agent_id": "agent-1",
                "pool_name": "prod",
            }
        )
        
        # Start
        response = client.patch(
            "/api/queue/jobs/job-1/start",
            params={
                "agent_id": "agent-1",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["job"]["status"] == "RUNNING"
    
    def test_complete_job_success(self, client):
        """PATCH /api/queue/jobs/{job_id}/complete completes job"""
        # Setup
        client.post(
            "/api/queue/jobs",
            params={
                "job_id": "job-1",
                "job_type": "deploy",
                "pool_name": "prod",
            }
        )
        
        client.post(
            "/api/queue/claim",
            params={
                "agent_id": "agent-1",
                "pool_name": "prod",
            }
        )
        
        client.patch(
            "/api/queue/jobs/job-1/start",
            params={
                "agent_id": "agent-1",
            }
        )
        
        # Complete
        response = client.patch(
            "/api/queue/jobs/job-1/complete",
            params={
                "exit_code": 0,
                "duration_seconds": 45.5,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["job"]["status"] == "COMPLETED"
        assert data["job"]["exit_code"] == 0
    
    def test_get_job_endpoint(self, client):
        """GET /api/queue/jobs/{job_id} retrieves job"""
        # Enqueue
        client.post(
            "/api/queue/jobs",
            params={
                "job_id": "job-1",
                "job_type": "deploy",
                "pool_name": "prod",
            }
        )
        
        # Get
        response = client.get("/api/queue/jobs/job-1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["job"]["job_id"] == "job-1"
    
    def test_get_nonexistent_job(self, client):
        """GET /api/queue/jobs/{job_id} returns 404 for non-existent"""
        response = client.get("/api/queue/jobs/nonexistent")
        
        assert response.status_code == 404
    
    def test_list_jobs_endpoint(self, client):
        """GET /api/queue/jobs lists queued jobs"""
        # Enqueue 3 jobs
        for i in range(3):
            client.post(
                "/api/queue/jobs",
                params={
                    "job_id": f"job-{i}",
                    "job_type": "deploy",
                    "pool_name": "prod",
                }
            )
        
        # List
        response = client.get("/api/queue/jobs")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 3
    
    def test_get_stats_endpoint(self, client):
        """GET /api/queue/stats returns queue statistics"""
        # Enqueue some jobs
        for i in range(2):
            client.post(
                "/api/queue/jobs",
                params={
                    "job_id": f"job-{i}",
                    "job_type": "deploy",
                    "pool_name": "prod",
                }
            )
        
        response = client.get("/api/queue/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        assert data["stats"]["total_queued"] >= 2
    
    def test_requeue_expired_endpoint(self, client):
        """POST /api/queue/maintenance/requeue-expired requeues expired leases"""
        response = client.post("/api/queue/maintenance/requeue-expired")
        
        assert response.status_code == 200
        data = response.json()
        assert "requeued_count" in data


class TestEndToEndQueueFlow:
    """Test complete job lifecycle"""
    
    def test_full_job_lifecycle(self, client):
        """Complete workflow: enqueue → claim → start → complete"""
        # Dashboard: enqueue job
        enqueue_resp = client.post(
            "/api/queue/jobs",
            params={
                "job_id": "e2e-job-1",
                "job_type": "deploy",
                "pool_name": "prod",
                "git_repo": "https://github.com/test/repo",
                "git_ref": "main",
            }
        )
        assert enqueue_resp.status_code == 200
        
        # Agent: claim work
        claim_resp = client.post(
            "/api/queue/claim",
            params={
                "agent_id": "agent-1",
                "pool_name": "prod",
            }
        )
        assert claim_resp.status_code == 200
        assert not claim_resp.json()["no_jobs_available"]
        
        # Agent: start execution
        start_resp = client.patch(
            "/api/queue/jobs/e2e-job-1/start",
            params={
                "agent_id": "agent-1",
            }
        )
        assert start_resp.status_code == 200
        
        # Agent: complete execution
        complete_resp = client.patch(
            "/api/queue/jobs/e2e-job-1/complete",
            params={
                "exit_code": 0,
                "duration_seconds": 60.0,
            }
        )
        assert complete_resp.status_code == 200
        
        # Dashboard: check final status
        get_resp = client.get("/api/queue/jobs/e2e-job-1")
        assert get_resp.status_code == 200
        final_job = get_resp.json()["job"]
        assert final_job["status"] == "COMPLETED"
        assert final_job["exit_code"] == 0
    
    def test_priority_dispatch(self, client):
        """Queue respects job priority"""
        # Enqueue jobs with different priorities
        client.post("/api/queue/jobs", params={
            "job_id": "low-job", "job_type": "deploy", "pool_name": "prod", "priority": "low"
        })
        client.post("/api/queue/jobs", params={
            "job_id": "critical-job", "job_type": "deploy", "pool_name": "prod", "priority": "critical"
        })
        client.post("/api/queue/jobs", params={
            "job_id": "normal-job", "job_type": "deploy", "pool_name": "prod", "priority": "normal"
        })
        
        # Agent claims - should get critical first
        claim_resp = client.post(
            "/api/queue/claim",
            params={"agent_id": "agent-1", "pool_name": "prod"}
        )
        claimed = claim_resp.json()["job"]
        assert claimed["job_id"] == "critical-job"
