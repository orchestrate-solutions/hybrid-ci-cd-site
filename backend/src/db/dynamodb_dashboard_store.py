"""
DynamoDB implementations of dashboard stores (Job and Deployment tracking).
"""

import boto3
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

from src.db.dashboard_models import Job, Deployment, JobStatus, DeploymentStatus
from src.db.dashboard_store import JobStoreInterface, DeploymentStoreInterface
from src.core.config import settings


logger = logging.getLogger(__name__)

# DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)


class DynamoDBJobStore(JobStoreInterface):
    """DynamoDB-backed job store (production)"""
    
    def __init__(self, table_name: str = "hybrid-ci-cd-jobs"):
        self.table = dynamodb.Table(table_name)
        self.table_name = table_name
        logger.info(f"Initialized DynamoDBJobStore with table {table_name}")
    
    async def create_job(self, job: Job) -> Job:
        """Create a new job"""
        item = {
            "job_id": job.job_id,
            "job_type": job.job_type,
            "status": job.status.value,
            "created_at": int(job.created_at.timestamp()),
            "updated_at": int(job.updated_at.timestamp() if job.updated_at else datetime.utcnow().timestamp()),
            "git_repo": job.git_repo,
            "git_ref": job.git_ref,
            "git_commit_sha": job.git_commit_sha,
            "git_commit_message": job.git_commit_message,
            "git_author": job.git_author,
            "tags": job.tags or {},
            "agent_id": job.agent_id or "",
            "exit_code": Decimal(str(job.exit_code)) if job.exit_code is not None else Decimal("0"),
            "duration_seconds": Decimal(str(job.duration_seconds)) if job.duration_seconds is not None else Decimal("0"),
            "logs_url": job.logs_url or "",
            "error_message": job.error_message or "",
            "completed_at": int(job.completed_at.timestamp()) if job.completed_at else 0,
        }
        
        self.table.put_item(Item=item)
        logger.info(f"Created job {job.job_id} in DynamoDB")
        return job
    
    async def get_job(self, job_id: str) -> Optional[Job]:
        """Retrieve a job by ID"""
        response = self.table.get_item(Key={"job_id": job_id})
        
        if "Item" not in response:
            return None
        
        return self._parse_job_item(response["Item"])
    
    async def list_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> List[Job]:
        """List jobs, optionally filtered by status"""
        if status:
            # Query by GSI (status-created_at)
            response = self.table.query(
                IndexName="status-created_at-index",
                KeyConditionExpression="job_status = :status",
                ExpressionAttributeValues={":status": status.value},
                ScanIndexForward=False,  # Descending order (newest first)
                Limit=limit
            )
        else:
            # Scan all jobs, sorted by created_at descending
            response = self.table.scan(Limit=limit)
            items = response.get("Items", [])
            items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
            response["Items"] = items[:limit]
        
        jobs = [self._parse_job_item(item) for item in response.get("Items", [])]
        return jobs
    
    async def update_job_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
        """Update job status"""
        now = int(datetime.utcnow().timestamp())
        
        response = self.table.update_item(
            Key={"job_id": job_id},
            UpdateExpression="SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "job_status"},
            ExpressionAttributeValues={
                ":status": status.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Updated job {job_id} status to {status}")
            return self._parse_job_item(response["Attributes"])
        
        return None
    
    async def update_job_execution(self, job_id: str, agent_id: str, exit_code: int,
                                   duration_seconds: int, logs_url: Optional[str] = None) -> Optional[Job]:
        """Record job execution completion"""
        now = int(datetime.utcnow().timestamp())
        new_status = JobStatus.SUCCESS if exit_code == 0 else JobStatus.FAILED
        
        response = self.table.update_item(
            Key={"job_id": job_id},
            UpdateExpression="SET agent_id = :agent_id, exit_code = :exit_code, duration_seconds = :duration, "
                           "logs_url = :logs_url, completed_at = :completed_at, #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "job_status"},
            ExpressionAttributeValues={
                ":agent_id": agent_id,
                ":exit_code": Decimal(str(exit_code)),
                ":duration": Decimal(str(duration_seconds)),
                ":logs_url": logs_url or "",
                ":completed_at": now,
                ":status": new_status.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Recorded execution for job {job_id}: exit_code={exit_code}")
            return self._parse_job_item(response["Attributes"])
        
        return None
    
    async def list_running_jobs(self) -> List[Job]:
        """List all currently running jobs"""
        running_statuses = ("PENDING", "QUEUED", "RUNNING")
        
        jobs = []
        for status_val in running_statuses:
            response = self.table.query(
                IndexName="status-created_at-index",
                KeyConditionExpression="job_status = :status",
                ExpressionAttributeValues={":status": status_val},
                ScanIndexForward=False
            )
            jobs.extend([self._parse_job_item(item) for item in response.get("Items", [])])
        
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs
    
    async def list_jobs_for_agent(self, agent_id: str) -> List[Job]:
        """List jobs assigned to an agent"""
        response = self.table.query(
            IndexName="agent_id-created_at-index",
            KeyConditionExpression="agent_id = :agent_id",
            ExpressionAttributeValues={":agent_id": agent_id},
            ScanIndexForward=False
        )
        
        jobs = [self._parse_job_item(item) for item in response.get("Items", [])]
        return jobs
    
    def _parse_job_item(self, item: Dict[str, Any]) -> Job:
        """Convert DynamoDB item to Job object"""
        completed_at = None
        if item.get("completed_at", 0) > 0:
            completed_at = datetime.fromtimestamp(item.get("completed_at", 0))
        
        return Job(
            job_id=item.get("job_id"),
            job_type=item.get("job_type"),
            status=JobStatus(item.get("job_status", "pending")),
            created_at=datetime.fromtimestamp(item.get("created_at", 0)),
            git_repo=item.get("git_repo"),
            git_ref=item.get("git_ref"),
            git_commit_sha=item.get("git_commit_sha"),
            git_commit_message=item.get("git_commit_message"),
            git_author=item.get("git_author"),
            tags=item.get("tags", {}),
            agent_id=item.get("agent_id") or None,
            exit_code=int(item.get("exit_code", 0)) if item.get("exit_code") else None,
            duration_seconds=int(item.get("duration_seconds", 0)) if item.get("duration_seconds") else None,
            logs_url=item.get("logs_url") or None,
            error_message=item.get("error_message") or None,
            completed_at=completed_at
        )


class DynamoDBDeploymentStore(DeploymentStoreInterface):
    """DynamoDB-backed deployment store (production)"""
    
    def __init__(self, table_name: str = "hybrid-ci-cd-deployments"):
        self.table = dynamodb.Table(table_name)
        self.table_name = table_name
        logger.info(f"Initialized DynamoDBDeploymentStore with table {table_name}")
    
    async def create_deployment(self, deployment: Deployment) -> Deployment:
        """Create a new deployment"""
        item = {
            "deployment_id": deployment.deployment_id,
            "service_name": deployment.service_name,
            "service_version": deployment.service_version,
            "status": deployment.status.value,
            "created_at": int(deployment.created_at.timestamp()),
            "updated_at": int(deployment.updated_at.timestamp() if deployment.updated_at else datetime.utcnow().timestamp()),
            "git_commit_sha": deployment.git_commit_sha,
            "git_commit_message": deployment.git_commit_message,
            "git_author": deployment.git_author,
            "build_job_id": deployment.build_job_id or "",
            "test_job_id": deployment.test_job_id or "",
            "deployed_to_staging": deployment.deployed_to_staging,
            "staging_deployed_at": int(deployment.staging_deployed_at.timestamp()) if deployment.staging_deployed_at else 0,
            "staging_job_id": deployment.staging_job_id or "",
            "deployed_to_production": deployment.deployed_to_production,
            "production_deployed_at": int(deployment.production_deployed_at.timestamp()) if deployment.production_deployed_at else 0,
            "production_job_id": deployment.production_job_id or "",
            "rolled_back": deployment.rolled_back,
            "rolled_back_at": int(deployment.rolled_back_at.timestamp()) if deployment.rolled_back_at else 0,
            "rolled_back_to_version": deployment.rolled_back_to_version or "",
            "rollback_reason": deployment.rollback_reason or "",
        }
        
        self.table.put_item(Item=item)
        logger.info(f"Created deployment {deployment.deployment_id} in DynamoDB")
        return deployment
    
    async def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        """Retrieve a deployment by ID"""
        response = self.table.get_item(Key={"deployment_id": deployment_id})
        
        if "Item" not in response:
            return None
        
        return self._parse_deployment_item(response["Item"])
    
    async def list_deployments(self, limit: int = 100) -> List[Deployment]:
        """List all deployments"""
        response = self.table.scan(Limit=limit)
        
        items = response.get("Items", [])
        items.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        
        deployments = [self._parse_deployment_item(item) for item in items[:limit]]
        return deployments
    
    async def list_deployments_by_service(self, service_name: str, limit: int = 50) -> List[Deployment]:
        """List deployments for a service"""
        response = self.table.query(
            IndexName="service_name-created_at-index",
            KeyConditionExpression="service_name = :service_name",
            ExpressionAttributeValues={":service_name": service_name},
            ScanIndexForward=False,  # Descending order (newest first)
            Limit=limit
        )
        
        deployments = [self._parse_deployment_item(item) for item in response.get("Items", [])]
        return deployments
    
    async def update_deployment_status(self, deployment_id: str, status: DeploymentStatus) -> Optional[Deployment]:
        """Update deployment status"""
        now = int(datetime.utcnow().timestamp())
        
        response = self.table.update_item(
            Key={"deployment_id": deployment_id},
            UpdateExpression="SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "deployment_status"},
            ExpressionAttributeValues={
                ":status": status.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Updated deployment {deployment_id} status to {status}")
            return self._parse_deployment_item(response["Attributes"])
        
        return None
    
    async def record_staging_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful staging deployment"""
        now = int(datetime.utcnow().timestamp())
        
        response = self.table.update_item(
            Key={"deployment_id": deployment_id},
            UpdateExpression="SET deployed_to_staging = :deployed, staging_deployed_at = :deployed_at, "
                           "staging_job_id = :job_id, #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "deployment_status"},
            ExpressionAttributeValues={
                ":deployed": True,
                ":deployed_at": now,
                ":job_id": job_id,
                ":status": DeploymentStatus.STAGED.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Recorded staging deployment for {deployment_id}")
            return self._parse_deployment_item(response["Attributes"])
        
        return None
    
    async def record_production_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful production deployment"""
        now = int(datetime.utcnow().timestamp())
        
        response = self.table.update_item(
            Key={"deployment_id": deployment_id},
            UpdateExpression="SET deployed_to_production = :deployed, production_deployed_at = :deployed_at, "
                           "production_job_id = :job_id, #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "deployment_status"},
            ExpressionAttributeValues={
                ":deployed": True,
                ":deployed_at": now,
                ":job_id": job_id,
                ":status": DeploymentStatus.LIVE.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Recorded production deployment for {deployment_id}")
            return self._parse_deployment_item(response["Attributes"])
        
        return None
    
    async def record_rollback(self, deployment_id: str, rolled_back_to: str, reason: str) -> Optional[Deployment]:
        """Record rollback"""
        now = int(datetime.utcnow().timestamp())
        
        response = self.table.update_item(
            Key={"deployment_id": deployment_id},
            UpdateExpression="SET rolled_back = :rolled_back, rolled_back_at = :rolled_back_at, "
                           "rolled_back_to_version = :rolled_back_to, rollback_reason = :reason, "
                           "#status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "deployment_status"},
            ExpressionAttributeValues={
                ":rolled_back": True,
                ":rolled_back_at": now,
                ":rolled_back_to": rolled_back_to,
                ":reason": reason,
                ":status": DeploymentStatus.ROLLED_BACK.value,
                ":updated_at": now
            },
            ReturnValues="ALL_NEW"
        )
        
        if "Attributes" in response:
            logger.info(f"Recorded rollback for {deployment_id}: to {rolled_back_to}, reason: {reason}")
            return self._parse_deployment_item(response["Attributes"])
        
        return None
    
    def _parse_deployment_item(self, item: Dict[str, Any]) -> Deployment:
        """Convert DynamoDB item to Deployment object"""
        staging_deployed_at = None
        if item.get("staging_deployed_at", 0) > 0:
            staging_deployed_at = datetime.fromtimestamp(item.get("staging_deployed_at", 0))
        
        production_deployed_at = None
        if item.get("production_deployed_at", 0) > 0:
            production_deployed_at = datetime.fromtimestamp(item.get("production_deployed_at", 0))
        
        rolled_back_at = None
        if item.get("rolled_back_at", 0) > 0:
            rolled_back_at = datetime.fromtimestamp(item.get("rolled_back_at", 0))
        
        return Deployment(
            deployment_id=item.get("deployment_id"),
            service_name=item.get("service_name"),
            service_version=item.get("service_version"),
            status=DeploymentStatus(item.get("deployment_status", "pending")),
            created_at=datetime.fromtimestamp(item.get("created_at", 0)),
            git_commit_sha=item.get("git_commit_sha"),
            git_commit_message=item.get("git_commit_message"),
            git_author=item.get("git_author"),
            build_job_id=item.get("build_job_id") or None,
            test_job_id=item.get("test_job_id") or None,
            deployed_to_staging=item.get("deployed_to_staging", False),
            staging_deployed_at=staging_deployed_at,
            staging_job_id=item.get("staging_job_id") or None,
            deployed_to_production=item.get("deployed_to_production", False),
            production_deployed_at=production_deployed_at,
            production_job_id=item.get("production_job_id") or None,
            rolled_back=item.get("rolled_back", False),
            rolled_back_at=rolled_back_at,
            rolled_back_to_version=item.get("rolled_back_to_version") or None,
            rollback_reason=item.get("rollback_reason") or None
        )
