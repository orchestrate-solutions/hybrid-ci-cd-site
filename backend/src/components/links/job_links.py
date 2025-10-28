"""
CodeUChain links for job lifecycle management.
"""

from codeuchain.core import Context, Link
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from src.db.dashboard_models import Job, JobStatus
from src.db.dashboard_store import JobStoreInterface


logger = logging.getLogger(__name__)


class CreateJobLink(Link):
    """Link to create a new job in the store"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job_type": str,
            "git_repo": str,
            "git_ref": str,
            "git_commit_sha": str,
            "git_commit_message": str,
            "git_author": str,
            "tags": Dict[str, str] (optional)
        }
        
        Output: adds "job" key with created Job object
        """
        job = Job(
            job_type=ctx.get("job_type"),
            git_repo=ctx.get("git_repo"),
            git_ref=ctx.get("git_ref"),
            git_commit_sha=ctx.get("git_commit_sha"),
            git_commit_message=ctx.get("git_commit_message"),
            git_author=ctx.get("git_author"),
            tags=ctx.get("tags") or {}
        )
        
        created_job = await self.job_store.create_job(job)
        logger.info(f"Created job {created_job.job_id}")
        
        return ctx.insert("job", created_job)


class RetrieveJobLink(Link):
    """Link to retrieve a job by ID"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job_id": str
        }
        
        Output: adds "job" key with Job object, or None if not found
        """
        job_id = ctx.get("job_id")
        job = await self.job_store.get_job(job_id)
        
        if job:
            logger.info(f"Retrieved job {job_id}")
        else:
            logger.warning(f"Job {job_id} not found")
        
        return ctx.insert("job", job)


class ListJobsLink(Link):
    """Link to list jobs with optional filtering"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "status": str (optional),
            "limit": int (optional, default 100)
        }
        
        Output: adds "jobs" key with list of Job objects
        """
        status_str = ctx.get("status")
        status = JobStatus(status_str) if status_str else None
        limit = ctx.get("limit") or 100
        
        jobs = await self.job_store.list_jobs(status=status, limit=limit)
        logger.info(f"Listed {len(jobs)} jobs")
        
        return ctx.insert("jobs", jobs)


class UpdateJobStatusLink(Link):
    """Link to update job status"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job_id": str,
            "status": str (JobStatus enum value)
        }
        
        Output: updates "job" key with status change
        """
        job_id = ctx.get("job_id")
        status_str = ctx.get("status")
        status = JobStatus(status_str)
        
        updated_job = await self.job_store.update_job_status(job_id, status)
        
        if updated_job:
            logger.info(f"Updated job {job_id} to status {status}")
            return ctx.insert("job", updated_job)
        else:
            logger.warning(f"Job {job_id} not found for status update")
            return ctx.insert("job", None)


class RecordJobExecutionLink(Link):
    """Link to record job execution completion"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job_id": str,
            "agent_id": str,
            "exit_code": int,
            "duration_seconds": int,
            "logs_url": str (optional),
            "logs_summary": str (optional),
            "error_message": str (optional)
        }
        
        Output: updates "job" with execution results
        """
        job_id = ctx.get("job_id")
        agent_id = ctx.get("agent_id")
        exit_code = ctx.get("exit_code")
        duration_seconds = ctx.get("duration_seconds")
        logs_url = ctx.get("logs_url")
        
        updated_job = await self.job_store.update_job_execution(
            job_id=job_id,
            agent_id=agent_id,
            exit_code=exit_code,
            duration_seconds=duration_seconds,
            logs_url=logs_url
        )
        
        if updated_job:
            logger.info(f"Recorded execution for job {job_id}: exit_code={exit_code}")
            return ctx.insert("job", updated_job)
        else:
            logger.warning(f"Job {job_id} not found for execution recording")
            return ctx.insert("job", None)


class ListRunningJobsLink(Link):
    """Link to list all currently running jobs"""
    
    def __init__(self, job_store: JobStoreInterface):
        self.job_store = job_store
    
    async def call(self, ctx: Context) -> Context:
        """
        Input: no specific requirements
        Output: adds "running_jobs" key with list of running Job objects
        """
        running_jobs = await self.job_store.list_running_jobs()
        logger.info(f"Found {len(running_jobs)} running jobs")
        
        return ctx.insert("running_jobs", running_jobs)


class SerializeJobLink(Link):
    """Link to serialize a job to API response format"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job": Job
        }
        
        Output: adds "job_response" key with serialized job
        """
        job: Optional[Job] = ctx.get("job")
        
        if not job:
            return ctx.insert("job_response", None)
        
        response = {
            "job_id": job.job_id,
            "job_type": job.job_type,
            "status": job.status.value,
            "created_at": job.created_at.isoformat(),
            "git_repo": job.git_repo,
            "git_ref": job.git_ref,
            "git_commit_sha": job.git_commit_sha,
            "git_author": job.git_author,
            "agent_id": job.agent_id,
            "exit_code": job.exit_code,
            "duration_seconds": job.duration_seconds,
            "logs_url": job.logs_url,
            "error_message": job.error_message,
        }
        
        return ctx.insert("job_response", response)


class ValidateJobCreationLink(Link):
    """Link to validate job creation request"""
    
    async def call(self, ctx: Context) -> Context:
        """
        Input context shape:
        {
            "job_type": str,
            "git_repo": str,
            "git_commit_sha": str,
            "git_author": str
        }
        
        Output: adds "validation_error" if invalid, otherwise None
        """
        errors = []
        
        if not ctx.get("job_type"):
            errors.append("job_type is required")
        if not ctx.get("git_repo"):
            errors.append("git_repo is required")
        if not ctx.get("git_commit_sha"):
            errors.append("git_commit_sha is required")
        if not ctx.get("git_author"):
            errors.append("git_author is required")
        
        if errors:
            error_msg = "; ".join(errors)
            logger.warning(f"Job validation failed: {error_msg}")
            return ctx.insert("validation_error", error_msg)
        
        return ctx.insert("validation_error", None)
