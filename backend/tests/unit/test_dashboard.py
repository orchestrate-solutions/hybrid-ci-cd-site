"""
Unit tests for dashboard models and stores.
"""

import pytest
from datetime import datetime, timedelta
from src.db.dashboard_models import (
    Job, Deployment, JobStatus, DeploymentStatus, JobSummary, DeploymentSummary
)
from src.db.dashboard_store import InMemoryJobStore, InMemoryDeploymentStore


# ============================================================================
# Job Model Tests
# ============================================================================

def test_job_creation():
    """Test creating a job"""
    job = Job(
        job_type="test",
        git_repo="org/repo",
        git_ref="main",
        git_commit_sha="abc123",
        git_commit_message="Add feature",
        git_author="alice@example.com"
    )
    
    assert job.job_id.startswith("job-")
    assert job.status == JobStatus.PENDING
    assert job.job_type == "test"
    assert job.git_repo == "org/repo"


def test_job_lifecycle():
    """Test job state transitions"""
    job = Job(
        job_type="test",
        git_repo="org/repo",
        git_ref="main",
        git_commit_sha="abc123",
        git_commit_message="Add feature",
        git_author="alice@example.com"
    )
    
    assert job.is_running()
    assert not job.is_terminal()
    assert not job.is_complete()
    
    job.status = JobStatus.RUNNING
    assert job.is_running()
    
    job.status = JobStatus.SUCCESS
    assert job.is_terminal()
    assert job.is_complete()
    assert not job.is_running()


def test_job_to_dict():
    """Test serialization to DynamoDB format"""
    job = Job(
        job_type="build",
        git_repo="org/repo",
        git_ref="main",
        git_commit_sha="abc123def456",
        git_commit_message="Add feature",
        git_author="alice@example.com",
        status=JobStatus.SUCCESS,
        exit_code=0,
        duration_seconds=45
    )
    
    data = job.to_dict()
    assert data["job_type"] == "build"
    assert data["status"] == "success"
    assert data["exit_code"] == 0
    assert isinstance(data["created_at"], str)


def test_job_from_dict():
    """Test deserialization from DynamoDB format"""
    now = datetime.utcnow()
    data = {
        "job_id": "job-test123",
        "job_type": "test",
        "status": "success",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "git_repo": "org/repo",
        "git_ref": "main",
        "git_commit_sha": "abc123",
        "git_commit_message": "Add feature",
        "git_author": "alice@example.com",
        "exit_code": 0,
        "duration_seconds": 30,
    }
    
    job = Job.from_dict(data)
    assert job.job_id == "job-test123"
    assert job.status == JobStatus.SUCCESS
    assert job.exit_code == 0


# ============================================================================
# Deployment Model Tests
# ============================================================================

def test_deployment_creation():
    """Test creating a deployment"""
    deployment = Deployment(
        service_name="api-backend",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release v1",
        git_author="bob@example.com"
    )
    
    assert deployment.deployment_id.startswith("deploy-")
    assert deployment.status == DeploymentStatus.PENDING
    assert deployment.service_name == "api-backend"
    assert not deployment.deployed_to_staging
    assert not deployment.deployed_to_production


def test_deployment_lifecycle():
    """Test deployment through environments"""
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com"
    )
    
    # Start in pending
    assert deployment.status == DeploymentStatus.PENDING
    assert not deployment.is_live_in_production()
    
    # Deploy to staging
    deployment.deployed_to_staging = True
    deployment.staging_deployed_at = datetime.utcnow()
    deployment.status = DeploymentStatus.STAGED
    
    assert deployment.deployed_to_staging
    assert not deployment.deployed_to_production
    assert not deployment.is_live_in_production()
    
    # Deploy to production
    deployment.deployed_to_production = True
    deployment.production_deployed_at = datetime.utcnow()
    deployment.status = DeploymentStatus.LIVE
    
    assert deployment.is_live_in_production()


def test_deployment_rollback():
    """Test rollback recording"""
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com",
        deployed_to_production=True,
        status=DeploymentStatus.LIVE
    )
    
    deployment.rolled_back = True
    deployment.rolled_back_at = datetime.utcnow()
    deployment.rolled_back_to_version = "v0.9.0"
    deployment.rollback_reason = "High error rate"
    deployment.status = DeploymentStatus.ROLLED_BACK
    
    assert deployment.rolled_back
    assert deployment.rolled_back_to_version == "v0.9.0"
    assert deployment.status == DeploymentStatus.ROLLED_BACK


# ============================================================================
# InMemoryJobStore Tests
# ============================================================================

@pytest.mark.asyncio
async def test_job_store_create():
    """Test creating a job in store"""
    store = InMemoryJobStore()
    job = Job(
        job_type="test",
        git_repo="org/repo",
        git_ref="main",
        git_commit_sha="abc123",
        git_commit_message="Add feature",
        git_author="alice@example.com"
    )
    
    created = await store.create_job(job)
    assert created.job_id == job.job_id
    assert created.job_type == "test"


@pytest.mark.asyncio
async def test_job_store_get():
    """Test retrieving a job from store"""
    store = InMemoryJobStore()
    job = Job(
        job_type="test",
        git_repo="org/repo",
        git_ref="main",
        git_commit_sha="abc123",
        git_commit_message="Add feature",
        git_author="alice@example.com"
    )
    
    await store.create_job(job)
    retrieved = await store.get_job(job.job_id)
    
    assert retrieved is not None
    assert retrieved.job_id == job.job_id


@pytest.mark.asyncio
async def test_job_store_list():
    """Test listing jobs from store"""
    store = InMemoryJobStore()
    
    # Create multiple jobs
    for i in range(3):
        job = Job(
            job_type="test",
            git_repo="org/repo",
            git_ref="main",
            git_commit_sha=f"abc{i}",
            git_commit_message=f"Feature {i}",
            git_author="alice@example.com"
        )
        await store.create_job(job)
    
    jobs = await store.list_jobs()
    assert len(jobs) == 3


@pytest.mark.asyncio
async def test_job_store_list_filtered():
    """Test listing jobs filtered by status"""
    store = InMemoryJobStore()
    
    # Create jobs with different statuses
    job1 = Job(job_type="test", git_repo="r", git_ref="m", git_commit_sha="a", git_commit_message="m", git_author="a")
    job1.status = JobStatus.PENDING
    
    job2 = Job(job_type="test", git_repo="r", git_ref="m", git_commit_sha="b", git_commit_message="m", git_author="a")
    job2.status = JobStatus.RUNNING
    
    await store.create_job(job1)
    await store.create_job(job2)
    
    running = await store.list_jobs(status=JobStatus.RUNNING)
    assert len(running) == 1
    assert running[0].status == JobStatus.RUNNING


@pytest.mark.asyncio
async def test_job_store_update_status():
    """Test updating job status"""
    store = InMemoryJobStore()
    job = Job(
        job_type="test",
        git_repo="r",
        git_ref="m",
        git_commit_sha="a",
        git_commit_message="m",
        git_author="a"
    )
    
    await store.create_job(job)
    updated = await store.update_job_status(job.job_id, JobStatus.RUNNING)
    
    assert updated is not None
    assert updated.status == JobStatus.RUNNING


@pytest.mark.asyncio
async def test_job_store_update_execution():
    """Test recording job execution"""
    store = InMemoryJobStore()
    job = Job(
        job_type="test",
        git_repo="r",
        git_ref="m",
        git_commit_sha="a",
        git_commit_message="m",
        git_author="a"
    )
    
    await store.create_job(job)
    updated = await store.update_job_execution(
        job.job_id,
        agent_id="us-east-1-a",
        exit_code=0,
        duration_seconds=45,
        logs_url="s3://logs/job.txt"
    )
    
    assert updated is not None
    assert updated.exit_code == 0
    assert updated.duration_seconds == 45
    assert updated.status == JobStatus.SUCCESS


@pytest.mark.asyncio
async def test_job_store_list_running():
    """Test listing running jobs"""
    store = InMemoryJobStore()
    
    # Create running and completed jobs
    job1 = Job(job_type="test", git_repo="r", git_ref="m", git_commit_sha="a", git_commit_message="m", git_author="a")
    job1.status = JobStatus.RUNNING
    
    job2 = Job(job_type="test", git_repo="r", git_ref="m", git_commit_sha="b", git_commit_message="m", git_author="a")
    job2.status = JobStatus.SUCCESS
    
    await store.create_job(job1)
    await store.create_job(job2)
    
    running = await store.list_running_jobs()
    assert len(running) == 1
    assert running[0].status == JobStatus.RUNNING


# ============================================================================
# InMemoryDeploymentStore Tests
# ============================================================================

@pytest.mark.asyncio
async def test_deployment_store_create():
    """Test creating a deployment in store"""
    store = InMemoryDeploymentStore()
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com"
    )
    
    created = await store.create_deployment(deployment)
    assert created.deployment_id == deployment.deployment_id


@pytest.mark.asyncio
async def test_deployment_store_list():
    """Test listing deployments from store"""
    store = InMemoryDeploymentStore()
    
    for i in range(3):
        deployment = Deployment(
            service_name="api",
            service_version=f"v1.0.{i}",
            git_commit_sha=f"abc{i}",
            git_commit_message=f"Release {i}",
            git_author="bob@example.com"
        )
        await store.create_deployment(deployment)
    
    deployments = await store.list_deployments()
    assert len(deployments) == 3


@pytest.mark.asyncio
async def test_deployment_store_by_service():
    """Test listing deployments by service"""
    store = InMemoryDeploymentStore()
    
    # Create deployments for different services
    deploy1 = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="a",
        git_commit_message="m",
        git_author="b"
    )
    deploy2 = Deployment(
        service_name="web",
        service_version="v1.0.0",
        git_commit_sha="b",
        git_commit_message="m",
        git_author="b"
    )
    
    await store.create_deployment(deploy1)
    await store.create_deployment(deploy2)
    
    api_deploys = await store.list_deployments_by_service("api")
    assert len(api_deploys) == 1
    assert api_deploys[0].service_name == "api"


@pytest.mark.asyncio
async def test_deployment_store_record_staging():
    """Test recording staging deployment"""
    store = InMemoryDeploymentStore()
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com"
    )
    
    await store.create_deployment(deployment)
    updated = await store.record_staging_deployment(deployment.deployment_id, "job-123")
    
    assert updated is not None
    assert updated.deployed_to_staging is True
    assert updated.status == DeploymentStatus.STAGED
    assert updated.staging_job_id == "job-123"


@pytest.mark.asyncio
async def test_deployment_store_record_production():
    """Test recording production deployment"""
    store = InMemoryDeploymentStore()
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com"
    )
    
    await store.create_deployment(deployment)
    updated = await store.record_production_deployment(deployment.deployment_id, "job-456")
    
    assert updated is not None
    assert updated.deployed_to_production is True
    assert updated.status == DeploymentStatus.LIVE
    assert updated.production_job_id == "job-456"


@pytest.mark.asyncio
async def test_deployment_store_record_rollback():
    """Test recording rollback"""
    store = InMemoryDeploymentStore()
    deployment = Deployment(
        service_name="api",
        service_version="v1.0.0",
        git_commit_sha="abc123",
        git_commit_message="Release",
        git_author="bob@example.com",
        deployed_to_production=True,
        status=DeploymentStatus.LIVE
    )
    
    await store.create_deployment(deployment)
    updated = await store.record_rollback(
        deployment.deployment_id,
        "v0.9.0",
        "High error rate"
    )
    
    assert updated is not None
    assert updated.rolled_back is True
    assert updated.status == DeploymentStatus.ROLLED_BACK
    assert updated.rolled_back_to_version == "v0.9.0"
    assert updated.rollback_reason == "High error rate"
