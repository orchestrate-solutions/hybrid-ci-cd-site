"""
Dashboard data store interfaces and in-memory implementations.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from src.db.dashboard_models import Job, Deployment, JobStatus, DeploymentStatus


logger = logging.getLogger(__name__)


class JobStoreInterface(ABC):
    """Abstract interface for job storage"""
    
    @abstractmethod
    async def create_job(self, job: Job) -> Job:
        """Create a new job"""
        pass
    
    @abstractmethod
    async def get_job(self, job_id: str) -> Optional[Job]:
        """Retrieve a job by ID"""
        pass
    
    @abstractmethod
    async def list_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> List[Job]:
        """List jobs, optionally filtered by status"""
        pass
    
    @abstractmethod
    async def update_job_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
        """Update job status"""
        pass
    
    @abstractmethod
    async def update_job_execution(self, job_id: str, agent_id: str, exit_code: int, 
                                   duration_seconds: int, logs_url: Optional[str] = None) -> Optional[Job]:
        """Record job execution completion"""
        pass
    
    @abstractmethod
    async def list_running_jobs(self) -> List[Job]:
        """List all currently running jobs"""
        pass
    
    @abstractmethod
    async def list_jobs_for_agent(self, agent_id: str) -> List[Job]:
        """List jobs assigned to an agent"""
        pass


class DeploymentStoreInterface(ABC):
    """Abstract interface for deployment storage"""
    
    @abstractmethod
    async def create_deployment(self, deployment: Deployment) -> Deployment:
        """Create a new deployment"""
        pass
    
    @abstractmethod
    async def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        """Retrieve a deployment by ID"""
        pass
    
    @abstractmethod
    async def list_deployments(self, limit: int = 100) -> List[Deployment]:
        """List all deployments"""
        pass
    
    @abstractmethod
    async def list_deployments_by_service(self, service_name: str, limit: int = 50) -> List[Deployment]:
        """List deployments for a service"""
        pass
    
    @abstractmethod
    async def update_deployment_status(self, deployment_id: str, status: DeploymentStatus) -> Optional[Deployment]:
        """Update deployment status"""
        pass
    
    @abstractmethod
    async def record_staging_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful staging deployment"""
        pass
    
    @abstractmethod
    async def record_production_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful production deployment"""
        pass
    
    @abstractmethod
    async def record_rollback(self, deployment_id: str, rolled_back_to: str, reason: str) -> Optional[Deployment]:
        """Record rollback"""
        pass


class InMemoryJobStore(JobStoreInterface):
    """In-memory job storage implementation (development/testing)"""
    
    def __init__(self):
        self._jobs: Dict[str, Job] = {}
    
    async def create_job(self, job: Job) -> Job:
        """Create a new job"""
        self._jobs[job.job_id] = job
        logger.info(f"Created job {job.job_id}")
        return job
    
    async def get_job(self, job_id: str) -> Optional[Job]:
        """Retrieve a job by ID"""
        return self._jobs.get(job_id)
    
    async def list_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> List[Job]:
        """List jobs, optionally filtered by status"""
        jobs = list(self._jobs.values())
        
        if status:
            jobs = [j for j in jobs if j.status == status]
        
        # Sort by created_at descending (newest first)
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs[:limit]
    
    async def update_job_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
        """Update job status"""
        job = self._jobs.get(job_id)
        if job:
            job.status = status
            job.updated_at = datetime.utcnow()
            logger.info(f"Updated job {job_id} status to {status}")
            return job
        return None
    
    async def update_job_execution(self, job_id: str, agent_id: str, exit_code: int, 
                                   duration_seconds: int, logs_url: Optional[str] = None) -> Optional[Job]:
        """Record job execution completion"""
        job = self._jobs.get(job_id)
        if job:
            job.agent_id = agent_id
            job.exit_code = exit_code
            job.duration_seconds = duration_seconds
            job.logs_url = logs_url
            job.completed_at = datetime.utcnow()
            job.status = JobStatus.SUCCESS if exit_code == 0 else JobStatus.FAILED
            job.updated_at = datetime.utcnow()
            logger.info(f"Recorded execution for job {job_id}: exit_code={exit_code}")
            return job
        return None
    
    async def list_running_jobs(self) -> List[Job]:
        """List all currently running jobs"""
        running_statuses = (JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING)
        jobs = [j for j in self._jobs.values() if j.status in running_statuses]
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs
    
    async def list_jobs_for_agent(self, agent_id: str) -> List[Job]:
        """List jobs assigned to an agent"""
        jobs = [j for j in self._jobs.values() if j.agent_id == agent_id]
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs


class InMemoryDeploymentStore(DeploymentStoreInterface):
    """In-memory deployment storage implementation (development/testing)"""
    
    def __init__(self):
        self._deployments: Dict[str, Deployment] = {}
    
    async def create_deployment(self, deployment: Deployment) -> Deployment:
        """Create a new deployment"""
        self._deployments[deployment.deployment_id] = deployment
        logger.info(f"Created deployment {deployment.deployment_id}")
        return deployment
    
    async def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        """Retrieve a deployment by ID"""
        return self._deployments.get(deployment_id)
    
    async def list_deployments(self, limit: int = 100) -> List[Deployment]:
        """List all deployments"""
        deployments = list(self._deployments.values())
        deployments.sort(key=lambda d: d.created_at, reverse=True)
        return deployments[:limit]
    
    async def list_deployments_by_service(self, service_name: str, limit: int = 50) -> List[Deployment]:
        """List deployments for a service"""
        deployments = [d for d in self._deployments.values() if d.service_name == service_name]
        deployments.sort(key=lambda d: d.created_at, reverse=True)
        return deployments[:limit]
    
    async def update_deployment_status(self, deployment_id: str, status: DeploymentStatus) -> Optional[Deployment]:
        """Update deployment status"""
        deployment = self._deployments.get(deployment_id)
        if deployment:
            deployment.status = status
            deployment.updated_at = datetime.utcnow()
            logger.info(f"Updated deployment {deployment_id} status to {status}")
            return deployment
        return None
    
    async def record_staging_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful staging deployment"""
        deployment = self._deployments.get(deployment_id)
        if deployment:
            deployment.deployed_to_staging = True
            deployment.staging_deployed_at = datetime.utcnow()
            deployment.staging_job_id = job_id
            deployment.status = DeploymentStatus.STAGED
            deployment.updated_at = datetime.utcnow()
            logger.info(f"Recorded staging deployment for {deployment_id}")
            return deployment
        return None
    
    async def record_production_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful production deployment"""
        deployment = self._deployments.get(deployment_id)
        if deployment:
            deployment.deployed_to_production = True
            deployment.production_deployed_at = datetime.utcnow()
            deployment.production_job_id = job_id
            deployment.status = DeploymentStatus.LIVE
            deployment.updated_at = datetime.utcnow()
            logger.info(f"Recorded production deployment for {deployment_id}")
            return deployment
        return None
    
    async def record_rollback(self, deployment_id: str, rolled_back_to: str, reason: str) -> Optional[Deployment]:
        """Record rollback"""
        deployment = self._deployments.get(deployment_id)
        if deployment:
            deployment.rolled_back = True
            deployment.rolled_back_at = datetime.utcnow()
            deployment.rolled_back_to_version = rolled_back_to
            deployment.rollback_reason = reason
            deployment.status = DeploymentStatus.ROLLED_BACK
            deployment.updated_at = datetime.utcnow()
            logger.info(f"Recorded rollback for {deployment_id}: to {rolled_back_to}, reason: {reason}")
            return deployment
        return None
