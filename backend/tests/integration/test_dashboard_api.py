"""
Integration tests for dashboard API endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from src.main import app
from src.db.dashboard_store import InMemoryJobStore, InMemoryDeploymentStore
from src.dashboard import dashboard_routes


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def client():
    """Create test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
def reset_stores():
    """Reset stores to clean state before each test"""
    # Create fresh stores and replace the global references
    from src.dashboard import dashboard_routes
    dashboard_routes._job_store = InMemoryJobStore()
    dashboard_routes._deployment_store = InMemoryDeploymentStore()
    
    # Re-initialize all chains with fresh stores
    from src.components.chains.dashboard_chains import (
        JobCreationChain, JobExecutionChain, ListJobsChain,
        DeploymentCreationChain, DeploymentLifecycleChain, ListDeploymentsChain
    )
    dashboard_routes._job_creation_chain = JobCreationChain(dashboard_routes._job_store)
    dashboard_routes._job_execution_chain = JobExecutionChain(dashboard_routes._job_store)
    dashboard_routes._list_jobs_chain = ListJobsChain(dashboard_routes._job_store)
    dashboard_routes._deployment_creation_chain = DeploymentCreationChain(dashboard_routes._deployment_store)
    dashboard_routes._deployment_lifecycle_chain = DeploymentLifecycleChain(dashboard_routes._deployment_store)
    dashboard_routes._list_deployments_chain = ListDeploymentsChain(dashboard_routes._deployment_store)
    
    yield
    
    # Reset after test
    dashboard_routes._job_store = InMemoryJobStore()
    dashboard_routes._deployment_store = InMemoryDeploymentStore()
    dashboard_routes._job_creation_chain = JobCreationChain(dashboard_routes._job_store)
    dashboard_routes._job_execution_chain = JobExecutionChain(dashboard_routes._job_store)
    dashboard_routes._list_jobs_chain = ListJobsChain(dashboard_routes._job_store)
    dashboard_routes._deployment_creation_chain = DeploymentCreationChain(dashboard_routes._deployment_store)
    dashboard_routes._deployment_lifecycle_chain = DeploymentLifecycleChain(dashboard_routes._deployment_store)
    dashboard_routes._list_deployments_chain = ListDeploymentsChain(dashboard_routes._deployment_store)


# ============================================================================
# Job Endpoint Tests
# ============================================================================

def test_create_job(client, reset_stores):
    """Test POST /api/dashboard/jobs"""
    response = client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123def456",
            "git_commit_message": "Add feature",
            "git_author": "alice@example.com",
            "tags": {"service": "api"}
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["job_type"] == "test"
    assert data["status"] == "pending"
    assert data["job_id"].startswith("job-")
    assert data["git_commit_sha"] == "abc123d"  # Truncated to 7 chars


def test_list_jobs(client, reset_stores):
    """Test GET /api/dashboard/jobs"""
    # Create a few jobs
    for i in range(3):
        client.post(
            "/api/dashboard/jobs",
            json={
                "job_type": "test",
                "git_repo": "org/repo",
                "git_ref": "main",
                "git_commit_sha": f"abc{i}",
                "git_commit_message": f"Feature {i}",
                "git_author": "alice@example.com"
            }
        )
    
    # List all jobs
    response = client.get("/api/dashboard/jobs")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert data["total"] == 3
    assert len(data["jobs"]) == 3


def test_list_jobs_with_status_filter(client, reset_stores):
    """Test GET /api/dashboard/jobs?status=running"""
    # Create multiple jobs with different statuses
    for i in range(2):
        client.post(
            "/api/dashboard/jobs",
            json={
                "job_type": "test",
                "git_repo": "org/repo",
                "git_ref": "main",
                "git_commit_sha": f"abc{i}",
                "git_commit_message": f"Feature {i}",
                "git_author": "alice@example.com"
            }
        )
    
    # Jobs created with status=pending by default, query for running doesn't match
    response = client.get("/api/dashboard/jobs?status=running")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0  # No running jobs


def test_get_job_details(client, reset_stores):
    """Test GET /api/dashboard/jobs/{job_id}"""
    # Create a job
    create_response = client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123",
            "git_commit_message": "Add feature",
            "git_author": "alice@example.com"
        }
    )
    job_id = create_response.json()["job_id"]
    
    # Get job details
    response = client.get(f"/api/dashboard/jobs/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == job_id
    assert data["status"] == "pending"


def test_get_nonexistent_job(client, reset_stores):
    """Test GET /api/dashboard/jobs/{job_id} with invalid ID"""
    response = client.get("/api/dashboard/jobs/nonexistent-job")
    assert response.status_code == 404


def test_complete_job(client, reset_stores):
    """Test PATCH /api/dashboard/jobs/{job_id}/complete"""
    # Create a job
    create_response = client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123",
            "git_commit_message": "Add feature",
            "git_author": "alice@example.com"
        }
    )
    job_id = create_response.json()["job_id"]
    
    # Complete the job
    response = client.patch(
        f"/api/dashboard/jobs/{job_id}/complete",
        json={
            "agent_id": "us-east-1-a",
            "exit_code": 0,
            "duration_seconds": 45,
            "logs_url": "s3://logs/job123.txt"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["exit_code"] == 0
    assert data["duration_seconds"] == 45


def test_complete_job_with_failure(client, reset_stores):
    """Test completing a job with non-zero exit code"""
    # Create a job
    create_response = client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123",
            "git_commit_message": "Add feature",
            "git_author": "alice@example.com"
        }
    )
    job_id = create_response.json()["job_id"]
    
    # Complete with failure
    response = client.patch(
        f"/api/dashboard/jobs/{job_id}/complete",
        json={
            "agent_id": "us-east-1-a",
            "exit_code": 1,
            "duration_seconds": 30
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "failed"
    assert data["exit_code"] == 1


def test_get_running_jobs(client, reset_stores):
    """Test GET /api/dashboard/jobs/running"""
    # Create jobs (default status is pending, which is in the running list)
    for i in range(2):
        client.post(
            "/api/dashboard/jobs",
            json={
                "job_type": "test",
                "git_repo": "org/repo",
                "git_ref": "main",
                "git_commit_sha": f"abc{i}",
                "git_commit_message": f"Feature {i}",
                "git_author": "alice@example.com"
            }
        )
    
    # Get running jobs
    response = client.get("/api/dashboard/jobs/running")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Both jobs are in running status


# ============================================================================
# Deployment Endpoint Tests
# ============================================================================

def test_create_deployment(client, reset_stores):
    """Test POST /api/dashboard/deployments"""
    response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api-backend",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release v1",
            "git_author": "bob@example.com"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["service_name"] == "api-backend"
    assert data["status"] == "pending"
    assert data["deployment_id"].startswith("deploy-")


def test_list_deployments(client, reset_stores):
    """Test GET /api/dashboard/deployments"""
    # Create deployments
    for i in range(2):
        client.post(
            "/api/dashboard/deployments",
            json={
                "service_name": "api-backend",
                "service_version": f"v1.0.{i}",
                "git_commit_sha": f"abc{i}",
                "git_commit_message": f"Release {i}",
                "git_author": "bob@example.com"
            }
        )
    
    # List deployments
    response = client.get("/api/dashboard/deployments")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2


def test_get_deployment_details(client, reset_stores):
    """Test GET /api/dashboard/deployments/{deployment_id}"""
    # Create deployment
    create_response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api-backend",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    deployment_id = create_response.json()["deployment_id"]
    
    # Get details
    response = client.get(f"/api/dashboard/deployments/{deployment_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["deployment_id"] == deployment_id
    assert data["status"] == "pending"


def test_list_deployments_by_service(client, reset_stores):
    """Test GET /api/dashboard/deployments/service/{service_name}"""
    # Create deployments for different services
    client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "a",
            "git_commit_message": "m",
            "git_author": "b"
        }
    )
    client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "web",
            "service_version": "v1.0.0",
            "git_commit_sha": "b",
            "git_commit_message": "m",
            "git_author": "b"
        }
    )
    
    # Get api service deployments
    response = client.get("/api/dashboard/deployments/service/api")
    assert response.status_code == 200
    data = response.json()
    assert data["service_name"] == "api"
    assert len(data["deployments"]) == 1


def test_record_staging_deployment(client, reset_stores):
    """Test POST /api/dashboard/deployments/{id}/staging"""
    # Create deployment
    create_response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    deployment_id = create_response.json()["deployment_id"]
    
    # Record staging
    response = client.post(
        f"/api/dashboard/deployments/{deployment_id}/staging",
        json={"job_id": "job-deploy1"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["deployed_to_staging"] is True
    assert data["status"] == "staged"


def test_record_production_deployment(client, reset_stores):
    """Test POST /api/dashboard/deployments/{id}/production"""
    # Create deployment
    create_response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    deployment_id = create_response.json()["deployment_id"]
    
    # Record production
    response = client.post(
        f"/api/dashboard/deployments/{deployment_id}/production",
        json={"job_id": "job-deploy2"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["deployed_to_production"] is True
    assert data["status"] == "live"


def test_record_rollback(client, reset_stores):
    """Test POST /api/dashboard/deployments/{id}/rollback"""
    # Create and progress deployment
    create_response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    deployment_id = create_response.json()["deployment_id"]
    
    # Record rollback
    response = client.post(
        f"/api/dashboard/deployments/{deployment_id}/rollback",
        json={
            "rolled_back_to_version": "v0.9.0",
            "reason": "High error rate"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["rolled_back"] is True
    assert data["status"] == "rolled_back"
    assert data["rolled_back_to_version"] == "v0.9.0"


# ============================================================================
# Dashboard Summary Tests
# ============================================================================

def test_dashboard_summary(client, reset_stores):
    """Test GET /api/dashboard/summary"""
    # Create some jobs and deployments
    client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123",
            "git_commit_message": "Feature",
            "git_author": "alice@example.com"
        }
    )
    
    client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    
    # Get summary
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    
    assert "jobs_running" in data
    assert "jobs_failed_today" in data
    assert "deployments_today" in data
    assert "recent_jobs" in data
    assert "recent_deployments" in data
    
    assert data["jobs_running"] == 1
    assert data["deployments_today"] == 1


# ============================================================================
# End-to-End Workflow Tests
# ============================================================================

def test_job_creation_and_completion_workflow(client, reset_stores):
    """Test complete job lifecycle: create → complete → query"""
    # 1. Create job
    create_response = client.post(
        "/api/dashboard/jobs",
        json={
            "job_type": "test",
            "git_repo": "org/repo",
            "git_ref": "main",
            "git_commit_sha": "abc123",
            "git_commit_message": "Add feature",
            "git_author": "alice@example.com"
        }
    )
    assert create_response.status_code == 200
    job_id = create_response.json()["job_id"]
    
    # 2. Verify job is in running list
    running_response = client.get("/api/dashboard/jobs/running")
    assert running_response.status_code == 200
    running_jobs = running_response.json()
    assert len(running_jobs) == 1
    assert running_jobs[0]["job_id"] == job_id
    
    # 3. Complete job
    complete_response = client.patch(
        f"/api/dashboard/jobs/{job_id}/complete",
        json={
            "agent_id": "us-east-1-a",
            "exit_code": 0,
            "duration_seconds": 30
        }
    )
    assert complete_response.status_code == 200
    
    # 4. Verify job is no longer running
    running_response = client.get("/api/dashboard/jobs/running")
    running_jobs = running_response.json()
    assert len(running_jobs) == 0
    
    # 5. Query completed job
    detail_response = client.get(f"/api/dashboard/jobs/{job_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "success"


def test_deployment_workflow_staging_to_production(client, reset_stores):
    """Test deployment through environments"""
    # 1. Create deployment
    create_response = client.post(
        "/api/dashboard/deployments",
        json={
            "service_name": "api",
            "service_version": "v1.0.0",
            "git_commit_sha": "abc123",
            "git_commit_message": "Release",
            "git_author": "bob@example.com"
        }
    )
    deployment_id = create_response.json()["deployment_id"]
    
    # 2. Record staging
    staging_response = client.post(
        f"/api/dashboard/deployments/{deployment_id}/staging",
        json={"job_id": "job-stage"}
    )
    assert staging_response.json()["status"] == "staged"
    
    # 3. Record production
    prod_response = client.post(
        f"/api/dashboard/deployments/{deployment_id}/production",
        json={"job_id": "job-prod"}
    )
    assert prod_response.json()["status"] == "live"
    
    # 4. Verify in service history
    history_response = client.get("/api/dashboard/deployments/service/api")
    assert history_response.json()["deployments"][0]["deployed_to_production"] is True
