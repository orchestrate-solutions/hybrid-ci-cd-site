"""
DynamoDB implementations of job and deployment stores.
"""

import logging
from typing import List, Optional
from datetime import datetime
import aioboto3

from src.db.dashboard_models import Job, Deployment, JobStatus, DeploymentStatus
from src.db.dashboard_store import JobStoreInterface, DeploymentStoreInterface
from src.core.config import settings


logger = logging.getLogger(__name__)


class DynamoDBJobStore(JobStoreInterface):
    """DynamoDB-backed job storage (production)"""
    
    def __init__(self):
        self.session = aioboto3.Session()
        self.table_name = "jobs"
    
    async def _get_table(self):
        """Get DynamoDB table resource"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            return dynamodb.Table(self.table_name)
    
    async def create_job(self, job: Job) -> Job:
        """Create a new job"""
        data = job.to_dict()
        
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            await table.put_item(Item=data)
        
        logger.info(f"Created job {job.job_id}")
        return job
    
    async def get_job(self, job_id: str) -> Optional[Job]:
        """Retrieve a job by ID"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            response = await table.get_item(Key={"job_id": job_id})
        
        if "Item" in response:
            return Job.from_dict(response["Item"])
        return None
    
    async def list_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> List[Job]:
        """List jobs, optionally filtered by status"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            if status:
                # Query by status (requires GSI in production)
                response = await table.query(
                    IndexName="status-created_at-index",
                    KeyConditionExpression="job_status = :status",
                    ExpressionAttributeValues={":status": status.value},
                    ScanIndexForward=False,  # Descending order (newest first)
                    Limit=limit
                )
            else:
                # Scan all items (less efficient, but functional)
                response = await table.scan(Limit=limit * 5)  # Over-fetch for safety
        
        jobs = [Job.from_dict(item) for item in response.get("Items", [])]
        
        # Sort by created_at descending if not using index
        if not status:
            jobs.sort(key=lambda j: j.created_at, reverse=True)
            jobs = jobs[:limit]
        
        return jobs
    
    async def update_job_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
        """Update job status"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            response = await table.update_item(
                Key={"job_id": job_id},
                UpdateExpression="SET #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": status.value,
                    ":updated_at": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Updated job {job_id} status to {status}")
            return Job.from_dict(response["Attributes"])
        return None
    
    async def update_job_execution(self, job_id: str, agent_id: str, exit_code: int, 
                                   duration_seconds: int, logs_url: Optional[str] = None) -> Optional[Job]:
        """Record job execution completion"""
        # Determine status based on exit code
        new_status = JobStatus.SUCCESS if exit_code == 0 else JobStatus.FAILED
        
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            update_expr = "SET agent_id = :agent_id, exit_code = :exit_code, duration_seconds = :duration, #status = :status, completed_at = :completed_at, updated_at = :updated_at"
            expr_vals = {
                ":agent_id": agent_id,
                ":exit_code": exit_code,
                ":duration": duration_seconds,
                ":status": new_status.value,
                ":completed_at": datetime.utcnow().isoformat(),
                ":updated_at": datetime.utcnow().isoformat()
            }
            
            if logs_url:
                update_expr += ", logs_url = :logs_url"
                expr_vals[":logs_url"] = logs_url
            
            response = await table.update_item(
                Key={"job_id": job_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues=expr_vals,
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Recorded execution for job {job_id}: exit_code={exit_code}")
            return Job.from_dict(response["Attributes"])
        return None
    
    async def list_running_jobs(self) -> List[Job]:
        """List all currently running jobs"""
        running_statuses = (JobStatus.PENDING.value, JobStatus.QUEUED.value, JobStatus.RUNNING.value)
        
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            # Scan for running jobs (multiple status values)
            # In production, use BatchGetItem or query multiple GSIs
            response = await table.scan(
                FilterExpression="attribute_exists(#status) AND (#status IN (:pending, :queued, :running))",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":pending": JobStatus.PENDING.value,
                    ":queued": JobStatus.QUEUED.value,
                    ":running": JobStatus.RUNNING.value
                }
            )
        
        jobs = [Job.from_dict(item) for item in response.get("Items", [])]
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs
    
    async def list_jobs_for_agent(self, agent_id: str) -> List[Job]:
        """List jobs assigned to an agent"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            # Query by agent_id (requires GSI)
            response = await table.query(
                IndexName="agent_id-created_at-index",
                KeyConditionExpression="agent_id = :agent_id",
                ExpressionAttributeValues={":agent_id": agent_id},
                ScanIndexForward=False  # Descending order
            )
        
        jobs = [Job.from_dict(item) for item in response.get("Items", [])]
        return jobs


class DynamoDBDeploymentStore(DeploymentStoreInterface):
    """DynamoDB-backed deployment storage (production)"""
    
    def __init__(self):
        self.session = aioboto3.Session()
        self.table_name = "deployments"
    
    async def create_deployment(self, deployment: Deployment) -> Deployment:
        """Create a new deployment"""
        data = deployment.to_dict()
        
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            await table.put_item(Item=data)
        
        logger.info(f"Created deployment {deployment.deployment_id}")
        return deployment
    
    async def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        """Retrieve a deployment by ID"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            response = await table.get_item(Key={"deployment_id": deployment_id})
        
        if "Item" in response:
            return Deployment.from_dict(response["Item"])
        return None
    
    async def list_deployments(self, limit: int = 100) -> List[Deployment]:
        """List all deployments"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            response = await table.scan(Limit=limit * 2)
        
        deployments = [Deployment.from_dict(item) for item in response.get("Items", [])]
        deployments.sort(key=lambda d: d.created_at, reverse=True)
        return deployments[:limit]
    
    async def list_deployments_by_service(self, service_name: str, limit: int = 50) -> List[Deployment]:
        """List deployments for a service"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            # Query by service_name (requires GSI)
            response = await table.query(
                IndexName="service_name-created_at-index",
                KeyConditionExpression="service_name = :service_name",
                ExpressionAttributeValues={":service_name": service_name},
                ScanIndexForward=False,  # Descending order (newest first)
                Limit=limit
            )
        
        deployments = [Deployment.from_dict(item) for item in response.get("Items", [])]
        return deployments
    
    async def update_deployment_status(self, deployment_id: str, status: DeploymentStatus) -> Optional[Deployment]:
        """Update deployment status"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            response = await table.update_item(
                Key={"deployment_id": deployment_id},
                UpdateExpression="SET #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": status.value,
                    ":updated_at": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Updated deployment {deployment_id} status to {status}")
            return Deployment.from_dict(response["Attributes"])
        return None
    
    async def record_staging_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful staging deployment"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            response = await table.update_item(
                Key={"deployment_id": deployment_id},
                UpdateExpression="SET deployed_to_staging = :true, staging_deployed_at = :time, staging_job_id = :job_id, #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":true": True,
                    ":time": datetime.utcnow().isoformat(),
                    ":job_id": job_id,
                    ":status": DeploymentStatus.STAGED.value,
                    ":updated_at": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Recorded staging deployment for {deployment_id}")
            return Deployment.from_dict(response["Attributes"])
        return None
    
    async def record_production_deployment(self, deployment_id: str, job_id: str) -> Optional[Deployment]:
        """Record successful production deployment"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            response = await table.update_item(
                Key={"deployment_id": deployment_id},
                UpdateExpression="SET deployed_to_production = :true, production_deployed_at = :time, production_job_id = :job_id, #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":true": True,
                    ":time": datetime.utcnow().isoformat(),
                    ":job_id": job_id,
                    ":status": DeploymentStatus.LIVE.value,
                    ":updated_at": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Recorded production deployment for {deployment_id}")
            return Deployment.from_dict(response["Attributes"])
        return None
    
    async def record_rollback(self, deployment_id: str, rolled_back_to: str, reason: str) -> Optional[Deployment]:
        """Record rollback"""
        async with self.session.resource("dynamodb", region_name=settings.aws_region) as dynamodb:
            table = dynamodb.Table(self.table_name)
            
            response = await table.update_item(
                Key={"deployment_id": deployment_id},
                UpdateExpression="SET rolled_back = :true, rolled_back_at = :time, rolled_back_to_version = :version, rollback_reason = :reason, #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":true": True,
                    ":time": datetime.utcnow().isoformat(),
                    ":version": rolled_back_to,
                    ":reason": reason,
                    ":status": DeploymentStatus.ROLLED_BACK.value,
                    ":updated_at": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
        
        if "Attributes" in response:
            logger.info(f"Recorded rollback for {deployment_id}: to {rolled_back_to}, reason: {reason}")
            return Deployment.from_dict(response["Attributes"])
        return None
