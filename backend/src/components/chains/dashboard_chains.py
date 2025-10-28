"""
CodeUChain chains for dashboard workflows.
"""

from codeuchain.core import Context, Chain
from typing import Dict, Any

from src.components.links.job_links import (
    ValidateJobCreationLink, CreateJobLink, RetrieveJobLink, ListJobsLink,
    UpdateJobStatusLink, RecordJobExecutionLink, ListRunningJobsLink,
    SerializeJobLink
)
from src.components.links.deployment_links import (
    ValidateDeploymentCreationLink, CreateDeploymentLink, RetrieveDeploymentLink,
    ListDeploymentsLink, ListDeploymentsByServiceLink, RecordStagingDeploymentLink,
    RecordProductionDeploymentLink, RecordRollbackLink, SerializeDeploymentLink
)
from src.db.dashboard_store import JobStoreInterface, DeploymentStoreInterface


class JobCreationChain:
    """
    Chain to create a new job:
    1. Validate job creation request
    2. Create job in store
    3. Serialize job for response
    """
    
    def __init__(self, job_store: JobStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ValidateJobCreationLink(), "validate")
        self.chain.add_link(CreateJobLink(job_store), "create")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Validation error predicate: only proceed to create if no validation error
        self.chain.connect("validate", "create", lambda ctx: ctx.get("validation_error") is None)
        
        # Connect create to serialize
        self.chain.connect("create", "serialize", lambda ctx: ctx.get("job") is not None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        # Return either error or job response
        error = result_ctx.get("validation_error")
        if error:
            return {"error": error}
        
        return result_ctx.get("job_response") or {}


class JobExecutionChain:
    """
    Chain to record job execution:
    1. Retrieve job
    2. Record execution (updates status to success/failed)
    3. Serialize job for response
    """
    
    def __init__(self, job_store: JobStoreInterface):
        self.chain = Chain()
        self.chain.add_link(RetrieveJobLink(job_store), "retrieve")
        self.chain.add_link(RecordJobExecutionLink(job_store), "record_execution")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Connect retrieve to record_execution only if job exists
        self.chain.connect("retrieve", "record_execution", lambda ctx: ctx.get("job") is not None)
        
        # Connect record_execution to serialize
        self.chain.connect("record_execution", "serialize", lambda ctx: ctx.get("job") is not None)
    
    async def run(self, job_id: str, execution_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with job ID and execution data"""
        data = {"job_id": job_id, **execution_data}
        ctx = Context(data)
        result_ctx = await self.chain.run(ctx)
        
        if result_ctx.get("job") is None:
            return {"error": f"Job {job_id} not found"}
        
        return result_ctx.get("job_response") or {}


class ListJobsChain:
    """
    Chain to list jobs:
    1. List jobs from store with optional filter
    2. Serialize each job for response
    """
    
    def __init__(self, job_store: JobStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ListJobsLink(job_store), "list")
    
    async def run(self, status: str = None, limit: int = 100) -> Dict[str, Any]:
        """Run the chain with optional filters"""
        data = {"limit": limit}
        if status:
            data["status"] = status
        
        ctx = Context(data)
        result_ctx = await self.chain.run(ctx)
        
        jobs = result_ctx.get("jobs") or []
        return {
            "jobs": [
                {
                    "job_id": j.job_id,
                    "job_type": j.job_type,
                    "status": j.status.value,
                    "created_at": j.created_at.isoformat(),
                    "git_commit_sha": j.git_commit_sha[:12],
                    "git_author": j.git_author,
                    "duration_seconds": j.duration_seconds,
                    "exit_code": j.exit_code,
                }
                for j in jobs
            ],
            "total": len(jobs),
            "limit": limit
        }


class DeploymentCreationChain:
    """
    Chain to create a new deployment:
    1. Validate deployment creation request
    2. Create deployment in store
    3. Serialize deployment for response
    """
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ValidateDeploymentCreationLink(), "validate")
        self.chain.add_link(CreateDeploymentLink(deployment_store), "create")
        self.chain.add_link(SerializeDeploymentLink(), "serialize")
        
        # Validation error predicate
        self.chain.connect("validate", "create", lambda ctx: ctx.get("validation_error") is None)
        
        # Connect create to serialize
        self.chain.connect("create", "serialize", lambda ctx: ctx.get("deployment") is not None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("validation_error")
        if error:
            return {"error": error}
        
        return result_ctx.get("deployment_response") or {}


class DeploymentLifecycleChain:
    """
    Chain for deployment state transitions:
    1. Retrieve deployment
    2. Record staging/production/rollback (based on input type)
    3. Serialize deployment for response
    
    NOTE: We create three separate chains instead of trying to route all paths through one chain,
    since CodeUChain evaluates all outgoing predicates from a node.
    """
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def run(self, deployment_id: str, operation: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the appropriate chain for the deployment lifecycle operation.
        
        operation: "staging", "production", or "rollback"
        data: additional data for the operation (e.g., job_id, reason)
        """
        request_data = {"deployment_id": deployment_id, **data}
        
        if operation == "staging":
            chain = Chain()
            chain.add_link(RetrieveDeploymentLink(self.deployment_store), "retrieve")
            chain.add_link(RecordStagingDeploymentLink(self.deployment_store), "record_staging")
            chain.add_link(SerializeDeploymentLink(), "serialize")
            
            chain.connect("retrieve", "record_staging", lambda ctx: ctx.get("deployment") is not None)
            chain.connect("record_staging", "serialize", lambda ctx: ctx.get("deployment") is not None)
            
        elif operation == "production":
            chain = Chain()
            chain.add_link(RetrieveDeploymentLink(self.deployment_store), "retrieve")
            chain.add_link(RecordProductionDeploymentLink(self.deployment_store), "record_production")
            chain.add_link(SerializeDeploymentLink(), "serialize")
            
            chain.connect("retrieve", "record_production", lambda ctx: ctx.get("deployment") is not None)
            chain.connect("record_production", "serialize", lambda ctx: ctx.get("deployment") is not None)
            
        elif operation == "rollback":
            chain = Chain()
            chain.add_link(RetrieveDeploymentLink(self.deployment_store), "retrieve")
            chain.add_link(RecordRollbackLink(self.deployment_store), "record_rollback")
            chain.add_link(SerializeDeploymentLink(), "serialize")
            
            chain.connect("retrieve", "record_rollback", lambda ctx: ctx.get("deployment") is not None)
            chain.connect("record_rollback", "serialize", lambda ctx: ctx.get("deployment") is not None)
        else:
            return {"error": f"Unknown operation: {operation}"}
        
        ctx = Context(request_data)
        result_ctx = await chain.run(ctx)
        
        if result_ctx.get("deployment") is None:
            return {"error": f"Deployment {deployment_id} not found"}
        
        return result_ctx.get("deployment_response") or {}


class ListDeploymentsChain:
    """
    Chain to list deployments:
    - List all deployments, or
    - List deployments for a specific service
    """
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ListDeploymentsLink(deployment_store), "list_all")
        self.chain.add_link(ListDeploymentsByServiceLink(deployment_store), "list_by_service")
        
        # Route based on whether service_name is provided
        self.chain.connect("list_all", "list_by_service", lambda ctx: False)  # Don't do both
        self.chain.connect("list_by_service", "list_all", lambda ctx: False)
    
    async def run(self, service_name: str = None, limit: int = 100) -> Dict[str, Any]:
        """Run the chain with optional service filter"""
        if service_name:
            data = {"service_name": service_name, "limit": min(limit, 50)}
        else:
            data = {"limit": limit}
        
        ctx = Context(data)
        result_ctx = await self.chain.run(ctx)
        
        if service_name:
            deployments = result_ctx.get("service_deployments") or []
            return {
                "service_name": service_name,
                "deployments": [
                    {
                        "deployment_id": d.deployment_id,
                        "service_version": d.service_version,
                        "status": d.status.value,
                        "created_at": d.created_at.isoformat(),
                        "deployed_to_staging": d.deployed_to_staging,
                        "deployed_to_production": d.deployed_to_production,
                        "rolled_back": d.rolled_back,
                    }
                    for d in deployments
                ],
                "total": len(deployments),
            }
        else:
            deployments = result_ctx.get("deployments") or []
            return {
                "deployments": [
                    {
                        "deployment_id": d.deployment_id,
                        "service_name": d.service_name,
                        "service_version": d.service_version,
                        "status": d.status.value,
                        "created_at": d.created_at.isoformat(),
                        "git_commit_sha": d.git_commit_sha[:12],
                        "deployed_to_staging": d.deployed_to_staging,
                        "deployed_to_production": d.deployed_to_production,
                        "rolled_back": d.rolled_back,
                    }
                    for d in deployments
                ],
                "total": len(deployments),
                "limit": limit
            }
