"""
CodeUChain Chains for job queue workflows.

Chains compose Links with predicate-based routing:
- Enqueue flow: validate → enqueue → serialize
- Claim flow: claim → (if claimed, mark as CLAIMED)
- Complete flow: complete → (if failed and retries remain, requeue)
"""

from codeuchain.core import Context, Chain
import logging
from typing import Dict, Any

from src.db.queue_store import JobQueueStoreInterface
from src.components.links.queue_links import (
    EnqueueJobLink,
    ClaimJobLink,
    StartJobExecutionLink,
    CompleteJobLink,
    RetryFailedJobLink,
    RequeueExpiredLeasesLink,
    GetQueueStatsLink,
    SerializeJobLink,
    SerializeStatsLink,
)


logger = logging.getLogger(__name__)


class EnqueueChain:
    """Dashboard → Job Queue"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(EnqueueJobLink(queue_store), "enqueue")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Routing: success path
        self.chain.connect("enqueue", "serialize", lambda ctx: ctx.get("error") is None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("error")
        if error:
            return {"error": error}
        
        return result_ctx.get("job_response") or {}


class ClaimChain:
    """Agent claims work from queue"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(ClaimJobLink(queue_store), "claim")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Routing: only serialize if job was claimed
        self.chain.connect("claim", "serialize", lambda ctx: not (ctx.get("no_jobs_available") or True))
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        return result_ctx


class StartChain:
    """Agent marks job as started (CLAIMED → RUNNING)"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(StartJobExecutionLink(queue_store), "start")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Routing: serialize if start succeeds
        self.chain.connect("start", "serialize", lambda ctx: ctx.get("error") is None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("error")
        if error:
            return {"error": error}
        
        return result_ctx.get("job_response") or {}


class CompleteChain:
    """Agent reports completion (RUNNING → COMPLETED/FAILED/RETRYABLE)"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(CompleteJobLink(queue_store), "complete")
        self.chain.add_link(RetryFailedJobLink(queue_store), "check_retry")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        # Routing: if failed, try to retry
        self.chain.connect("complete", "check_retry", lambda ctx: (
            ctx.get("error") is None and 
            (ctx.get("job") or {}).get("status") == "failed"
        ))
        
        # Routing: serialize after complete or retry decision
        self.chain.connect("complete", "serialize", lambda ctx: ctx.get("error") is None)
        self.chain.connect("check_retry", "serialize", lambda ctx: True)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("error")
        if error:
            return {"error": error}
        
        retried = not (result_ctx.get("cannot_retry") or False)
        
        return {
            "job": result_ctx.get("job_response") or {},
            "retried": retried,
        }


class MaintenanceChain:
    """Periodic maintenance: requeue expired leases"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(RequeueExpiredLeasesLink(queue_store), "requeue")
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("error")
        if error:
            return {"error": error}
        
        return {"requeued_count": result_ctx.get("requeued_count") or 0}


class StatsChain:
    """Get queue statistics"""
    
    def __init__(self, queue_store: JobQueueStoreInterface):
        self.chain = Chain()
        
        # Links
        self.chain.add_link(GetQueueStatsLink(queue_store), "stats")
        self.chain.add_link(SerializeStatsLink(), "serialize")
        
        # Routing: serialize stats
        self.chain.connect("stats", "serialize", lambda ctx: ctx.get("error") is None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        error = result_ctx.get("error")
        if error:
            return {"error": error}
        
        return {"stats": result_ctx.get("stats_response") or {}}
