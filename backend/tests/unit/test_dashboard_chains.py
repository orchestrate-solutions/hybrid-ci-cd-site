"""
Integration tests for CodeUChain dashboard chains.
"""

import pytest
from src.db.dashboard_store import InMemoryJobStore, InMemoryDeploymentStore
from src.components.chains.dashboard_chains import (
    JobCreationChain, JobExecutionChain, ListJobsChain,
    DeploymentCreationChain, DeploymentLifecycleChain, ListDeploymentsChain
)


@pytest.fixture
def job_store():
    """Provide in-memory job store for tests"""
    return InMemoryJobStore()


@pytest.fixture
def deployment_store():
    """Provide in-memory deployment store for tests"""
    return InMemoryDeploymentStore()


# ============================================================================
# Job Creation Chain Tests
# ============================================================================

@pytest.mark.asyncio
async def test_job_creation_chain_success(job_store):
    """Test successful job creation through chain"""
    chain = JobCreationChain(job_store)
    
    request_data = {
        "job_type": "test",
        "git_repo": "org/repo",
        "git_ref": "main",
        "git_commit_sha": "abc123",
        "git_commit_message": "Add feature",
        "git_author": "alice@example.com",
    }
    
    result = await chain.run(request_data)
    
    assert "error" not in result
    assert result.get("job_id").startswith("job-")
    assert result.get("job_type") == "test"
    assert result.get("status") == "pending"


@pytest.mark.asyncio
async def test_job_creation_chain_validation_error(job_store):
    """Test job creation chain with missing required field"""
    chain = JobCreationChain(job_store)
    
    request_data = {
        "job_type": "test",
        # Missing git_repo, git_commit_sha, git_author
        "git_ref": "main",
        "git_commit_message": "Add feature",
    }
    
    result = await chain.run(request_data)
    
    assert "error" in result
    assert "git_repo" in result["error"] or "git_commit_sha" in result["error"]


@pytest.mark.asyncio
async def test_job_execution_chain_success(job_store):
    """Test successful job execution recording through chain"""
    # First create a job
    creation_chain = JobCreationChain(job_store)
    creation_result = await creation_chain.run({
        "job_type": "build",
        "git_repo": "org/repo",
        "git_ref": "main",
        "git_commit_sha": "abc123",
        "git_commit_message": "Build",
        "git_author": "bob@example.com",
    })
    
    job_id = creation_result.get("job_id")
    
    # Now execute the job
    execution_chain = JobExecutionChain(job_store)
    execution_data = {
        "agent_id": "us-east-1-a",
        "exit_code": 0,
        "duration_seconds": 45,
        "logs_url": "s3://logs/job.txt"
    }
    
    result = await execution_chain.run(job_id, execution_data)
    
    assert "error" not in result
    assert result.get("status") == "success"
    assert result.get("exit_code") == 0


@pytest.mark.asyncio
async def test_job_execution_chain_not_found(job_store):
    """Test job execution chain with non-existent job"""
    execution_chain = JobExecutionChain(job_store)
    execution_data = {
        "agent_id": "us-east-1-a",
        "exit_code": 0,
        "duration_seconds": 45,
    }
    
    result = await execution_chain.run("nonexistent-job", execution_data)
    
    assert "error" in result
    assert "not found" in result["error"]


@pytest.mark.asyncio
async def test_list_jobs_chain_empty(job_store):
    """Test listing jobs when none exist"""
    chain = ListJobsChain(job_store)
    
    result = await chain.run(limit=100)
    
    assert result.get("total") == 0
    assert result.get("jobs") == []


@pytest.mark.asyncio
async def test_list_jobs_chain_with_status_filter(job_store):
    """Test listing jobs with status filter"""
    # Create some jobs with different statuses
    creation_chain = JobCreationChain(job_store)
    
    for i in range(3):
        await creation_chain.run({
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": f"abc{i}",
            "git_commit_message": f"Test {i}",
            "git_author": "alice@example.com",
        })
    
    # List only pending jobs
    chain = ListJobsChain(job_store)
    result = await chain.run(status="pending", limit=100)
    
    assert result.get("total") == 3
    for job in result.get("jobs", []):
        assert job.get("status") == "pending"


# ============================================================================
# Deployment Creation Chain Tests
# ============================================================================

@pytest.mark.asyncio
async def test_deployment_creation_chain_success(deployment_store):
    """Test successful deployment creation through chain"""
    chain = DeploymentCreationChain(deployment_store)
    
    request_data = {
        "service_name": "api",
        "service_version": "v1.0.0",
        "git_commit_sha": "abc123",
        "git_commit_message": "Release v1",
        "git_author": "bob@example.com",
    }
    
    result = await chain.run(request_data)
    
    assert "error" not in result
    assert result.get("deployment_id").startswith("deploy-")
    assert result.get("service_name") == "api"
    assert result.get("status") == "pending"


@pytest.mark.asyncio
async def test_deployment_creation_chain_validation_error(deployment_store):
    """Test deployment creation with missing required field"""
    chain = DeploymentCreationChain(deployment_store)
    
    request_data = {
        "service_name": "api",
        # Missing service_version, git_commit_sha, git_author
        "git_commit_message": "Release",
    }
    
    result = await chain.run(request_data)
    
    assert "error" in result


@pytest.mark.asyncio
async def test_deployment_lifecycle_chain_staging(deployment_store):
    """Test staging deployment recording through chain"""
    # Create a deployment
    creation_chain = DeploymentCreationChain(deployment_store)
    creation_result = await creation_chain.run({
        "service_name": "api",
        "service_version": "v1.0.0",
        "git_commit_sha": "abc123",
        "git_commit_message": "Release",
        "git_author": "bob@example.com",
    })
    
    deployment_id = creation_result.get("deployment_id")
    
    # Record staging deployment
    lifecycle_chain = DeploymentLifecycleChain(deployment_store)
    result = await lifecycle_chain.run(deployment_id, "staging", {"job_id": "job-123"})
    
    assert "error" not in result
    assert result.get("deployed_to_staging") is True
    assert result.get("status") == "staged"


@pytest.mark.asyncio
async def test_deployment_lifecycle_chain_production(deployment_store):
    """Test production deployment recording through chain"""
    # Create and stage a deployment
    creation_chain = DeploymentCreationChain(deployment_store)
    creation_result = await creation_chain.run({
        "service_name": "api",
        "service_version": "v1.0.0",
        "git_commit_sha": "abc123",
        "git_commit_message": "Release",
        "git_author": "bob@example.com",
    })
    
    deployment_id = creation_result.get("deployment_id")
    
    # Record staging first
    lifecycle_chain = DeploymentLifecycleChain(deployment_store)
    await lifecycle_chain.run(deployment_id, "staging", {"job_id": "job-stage"})
    
    # Record production
    result = await lifecycle_chain.run(deployment_id, "production", {"job_id": "job-prod"})
    
    assert "error" not in result
    assert result.get("deployed_to_production") is True
    assert result.get("status") == "live"


@pytest.mark.asyncio
async def test_deployment_lifecycle_chain_rollback(deployment_store):
    """Test rollback recording through chain"""
    # Create, stage, and deploy to production
    creation_chain = DeploymentCreationChain(deployment_store)
    creation_result = await creation_chain.run({
        "service_name": "api",
        "service_version": "v1.0.0",
        "git_commit_sha": "abc123",
        "git_commit_message": "Release",
        "git_author": "bob@example.com",
    })
    
    deployment_id = creation_result.get("deployment_id")
    
    lifecycle_chain = DeploymentLifecycleChain(deployment_store)
    await lifecycle_chain.run(deployment_id, "staging", {"job_id": "job-stage"})
    await lifecycle_chain.run(deployment_id, "production", {"job_id": "job-prod"})
    
    # Record rollback
    result = await lifecycle_chain.run(
        deployment_id,
        "rollback",
        {
            "rolled_back_to_version": "v0.9.0",
            "reason": "High error rate"
        }
    )
    
    assert "error" not in result
    assert result.get("rolled_back") is True
    assert result.get("status") == "rolled_back"
    assert result.get("rolled_back_to_version") == "v0.9.0"


@pytest.mark.asyncio
async def test_list_deployments_chain_all(deployment_store):
    """Test listing all deployments"""
    # Create some deployments
    creation_chain = DeploymentCreationChain(deployment_store)
    
    for i in range(3):
        await creation_chain.run({
            "service_name": f"service-{i}",
            "service_version": f"v1.0.{i}",
            "git_commit_sha": f"abc{i}",
            "git_commit_message": f"Release {i}",
            "git_author": "bob@example.com",
        })
    
    # List all deployments
    list_chain = ListDeploymentsChain(deployment_store)
    result = await list_chain.run(service_name=None, limit=100)
    
    assert result.get("total") == 3
    assert len(result.get("deployments", [])) == 3


@pytest.mark.asyncio
async def test_list_deployments_chain_by_service(deployment_store):
    """Test listing deployments for a specific service"""
    # Create deployments for different services
    creation_chain = DeploymentCreationChain(deployment_store)
    
    for i in range(3):
        await creation_chain.run({
            "service_name": "api" if i < 2 else "web",
            "service_version": f"v1.0.{i}",
            "git_commit_sha": f"abc{i}",
            "git_commit_message": f"Release {i}",
            "git_author": "bob@example.com",
        })
    
    # List api service deployments
    list_chain = ListDeploymentsChain(deployment_store)
    result = await list_chain.run(service_name="api", limit=50)
    
    assert result.get("service_name") == "api"
    assert result.get("total") == 2
    for deployment in result.get("deployments", []):
        assert deployment.get("service_version") in ["v1.0.0", "v1.0.1"]


# ============================================================================
# End-to-End Workflow Tests
# ============================================================================

@pytest.mark.asyncio
async def test_full_deployment_workflow(job_store, deployment_store):
    """Test complete deployment workflow: create → stage → production"""
    # 1. Create deployment
    deployment_chain = DeploymentCreationChain(deployment_store)
    deploy_result = await deployment_chain.run({
        "service_name": "api",
        "service_version": "v1.0.0",
        "git_commit_sha": "abc123",
        "git_commit_message": "Release v1",
        "git_author": "bob@example.com",
    })
    
    deployment_id = deploy_result.get("deployment_id")
    assert deploy_result.get("status") == "pending"
    
    # 2. Record staging
    lifecycle_chain = DeploymentLifecycleChain(deployment_store)
    staging_result = await lifecycle_chain.run(deployment_id, "staging", {"job_id": "job-stage"})
    
    assert staging_result.get("deployed_to_staging") is True
    assert staging_result.get("status") == "staged"
    
    # 3. Record production
    prod_result = await lifecycle_chain.run(deployment_id, "production", {"job_id": "job-prod"})
    
    assert prod_result.get("deployed_to_production") is True
    assert prod_result.get("status") == "live"
