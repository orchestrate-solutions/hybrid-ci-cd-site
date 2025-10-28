"""
CodeUChain links for deployment lifecycle management.
"""

from codeuchain.core import Context, Link
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from src.db.dashboard_models import Deployment, DeploymentStatus
from src.db.dashboard_store import DeploymentStoreInterface


logger = logging.getLogger(__name__)


class CreateDeploymentLink(Link):
    """Link to create a new deployment in the store"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "service_name": str,
            "service_version": str,
            "git_commit_sha": str,
            "git_commit_message": str,
            "git_author": str,
            "build_job_id": str (optional),
            "test_job_id": str (optional)
        }
        
        Output: adds "deployment" key with created Deployment object
        """
        deployment = Deployment(
            service_name=ctx.get("service_name"),
            service_version=ctx.get("service_version"),
            git_commit_sha=ctx.get("git_commit_sha"),
            git_commit_message=ctx.get("git_commit_message"),
            git_author=ctx.get("git_author"),
            build_job_id=ctx.get("build_job_id"),
            test_job_id=ctx.get("test_job_id"),
        )
        
        created_deployment = await self.deployment_store.create_deployment(deployment)
        logger.info(f"Created deployment {created_deployment.deployment_id}")
        
        return ctx.insert("deployment", created_deployment)


class RetrieveDeploymentLink(Link):
    """Link to retrieve a deployment by ID"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "deployment_id": str
        }
        
        Output: adds "deployment" key with Deployment object, or None if not found
        """
        deployment_id = ctx.get("deployment_id")
        deployment = await self.deployment_store.get_deployment(deployment_id)
        
        if deployment:
            logger.info(f"Retrieved deployment {deployment_id}")
        else:
            logger.warning(f"Deployment {deployment_id} not found")
        
        return ctx.insert("deployment", deployment)


class ListDeploymentsLink(Link):
    """Link to list deployments"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "limit": int (optional, default 100)
        }
        
        Output: adds "deployments" key with list of Deployment objects
        """
        limit = ctx.get("limit") or 100
        deployments = await self.deployment_store.list_deployments(limit=limit)
        logger.info(f"Listed {len(deployments)} deployments")
        
        return ctx.insert("deployments", deployments)


class ListDeploymentsByServiceLink(Link):
    """Link to list deployments for a specific service"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "service_name": str,
            "limit": int (optional, default 50)
        }
        
        Output: adds "service_deployments" key with list of Deployment objects
        """
        service_name = ctx.get("service_name")
        limit = ctx.get("limit") or 50
        
        deployments = await self.deployment_store.list_deployments_by_service(service_name, limit=limit)
        logger.info(f"Listed {len(deployments)} deployments for service {service_name}")
        
        return ctx.insert("service_deployments", deployments)


class RecordStagingDeploymentLink(Link):
    """Link to record successful staging deployment"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "deployment_id": str,
            "job_id": str
        }
        
        Output: updates "deployment" with staging deployment info
        """
        deployment_id = ctx.get("deployment_id")
        job_id = ctx.get("job_id")
        
        updated_deployment = await self.deployment_store.record_staging_deployment(deployment_id, job_id)
        
        if updated_deployment:
            logger.info(f"Recorded staging deployment for {deployment_id}")
            return ctx.insert("deployment", updated_deployment)
        else:
            logger.warning(f"Deployment {deployment_id} not found for staging")
            return ctx.insert("deployment", None)


class RecordProductionDeploymentLink(Link):
    """Link to record successful production deployment"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "deployment_id": str,
            "job_id": str
        }
        
        Output: updates "deployment" with production deployment info
        """
        deployment_id = ctx.get("deployment_id")
        job_id = ctx.get("job_id")
        
        updated_deployment = await self.deployment_store.record_production_deployment(deployment_id, job_id)
        
        if updated_deployment:
            logger.info(f"Recorded production deployment for {deployment_id}")
            return ctx.insert("deployment", updated_deployment)
        else:
            logger.warning(f"Deployment {deployment_id} not found for production")
            return ctx.insert("deployment", None)


class RecordRollbackLink(Link):
    """Link to record deployment rollback"""
    
    def __init__(self, deployment_store: DeploymentStoreInterface):
        self.deployment_store = deployment_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "deployment_id": str,
            "rolled_back_to_version": str,
            "reason": str
        }
        
        Output: updates "deployment" with rollback info
        """
        deployment_id = ctx.get("deployment_id")
        rolled_back_to = ctx.get("rolled_back_to_version")
        reason = ctx.get("reason")
        
        updated_deployment = await self.deployment_store.record_rollback(deployment_id, rolled_back_to, reason)
        
        if updated_deployment:
            logger.info(f"Recorded rollback for {deployment_id}")
            return ctx.insert("deployment", updated_deployment)
        else:
            logger.warning(f"Deployment {deployment_id} not found for rollback")
            return ctx.insert("deployment", None)


class SerializeDeploymentLink(Link):
    """Link to serialize a deployment to API response format"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "deployment": Deployment
        }
        
        Output: adds "deployment_response" key with serialized deployment
        """
        deployment: Optional[Deployment] = ctx.get("deployment")
        
        if not deployment:
            return ctx.insert("deployment_response", None)
        
        response = {
            "deployment_id": deployment.deployment_id,
            "service_name": deployment.service_name,
            "service_version": deployment.service_version,
            "status": deployment.status.value,
            "created_at": deployment.created_at.isoformat(),
            "git_commit_sha": deployment.git_commit_sha,
            "git_author": deployment.git_author,
            "deployed_to_staging": deployment.deployed_to_staging,
            "staging_deployed_at": deployment.staging_deployed_at.isoformat() if deployment.staging_deployed_at else None,
            "deployed_to_production": deployment.deployed_to_production,
            "production_deployed_at": deployment.production_deployed_at.isoformat() if deployment.production_deployed_at else None,
            "rolled_back": deployment.rolled_back,
            "rolled_back_to_version": deployment.rolled_back_to_version,
            "rollback_reason": deployment.rollback_reason,
        }
        
        return ctx.insert("deployment_response", response)


class ValidateDeploymentCreationLink(Link):
    """Link to validate deployment creation request"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "service_name": str,
            "service_version": str,
            "git_commit_sha": str,
            "git_author": str
        }
        
        Output: adds "validation_error" if invalid, otherwise None
        """
        errors = []
        
        if not ctx.get("service_name"):
            errors.append("service_name is required")
        if not ctx.get("service_version"):
            errors.append("service_version is required")
        if not ctx.get("git_commit_sha"):
            errors.append("git_commit_sha is required")
        if not ctx.get("git_author"):
            errors.append("git_author is required")
        
        if errors:
            error_msg = "; ".join(errors)
            logger.warning(f"Deployment validation failed: {error_msg}")
            return ctx.insert("validation_error", error_msg)
        
        return ctx.insert("validation_error", None)
