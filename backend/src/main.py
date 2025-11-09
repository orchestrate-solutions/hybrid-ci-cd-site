"""FastAPI application for the hybrid CI/CD backend."""

from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

from src.core.config import settings
from src.db.session_store import InMemorySessionStore, DynamoDBSessionStore, SessionStoreInterface
from src.db.models import SessionToken
from src.dashboard import router as dashboard_router
from src.agents.agent_routes import router as agent_router
from src.db.queue_store import InMemoryJobQueueStore
from src.queue.queue_routes import create_queue_router
from src.api.deployments import router as deployments_router
from src.api.config import router as config_router
from src.api.incidents import router as incidents_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize session store
# Use DynamoDB in production, in-memory in development
if settings.environment == "production":
    session_store: SessionStoreInterface = DynamoDBSessionStore()
else:
    session_store: SessionStoreInterface = InMemorySessionStore()

# Initialize queue store
# Use in-memory for now, can be swapped with SQS/Kinesis/RabbitMQ adapter later
queue_store = InMemoryJobQueueStore()


# Register routers
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(agent_router, prefix="/api", tags=["agents"])
app.include_router(deployments_router, prefix="/api", tags=["deployments"])
app.include_router(config_router, prefix="/api", tags=["config"])
app.include_router(incidents_router, prefix="/api", tags=["incidents"])
queue_router = create_queue_router(queue_store)
app.include_router(queue_router)


# ============================================================================
# Models
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str


class InfoResponse(BaseModel):
    """App info response."""
    name: str
    version: str
    environment: str


class CreateSessionRequest(BaseModel):
    """Request to create a session."""
    user_id: str
    provider: str  # "google" or "github"
    oauth_tokens: dict
    user_info: dict


class CreateSessionResponse(BaseModel):
    """Response for session creation."""
    session_id: str
    user_id: str
    provider: str
    created_at: int
    expires_at: int


class ValidateSessionRequest(BaseModel):
    """Request to validate a session."""
    session_id: str


class ValidateSessionResponse(BaseModel):
    """Response for session validation."""
    valid: bool
    user_id: Optional[str] = None
    provider: Optional[str] = None
    expires_at: Optional[int] = None


class AgentHeartbeatRequest(BaseModel):
    """Agent heartbeat data."""
    agent_id: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    jobs_queued: int
    jobs_completed: int
    uptime_seconds: int


class AgentConfigResponse(BaseModel):
    """Agent configuration."""
    agent_id: str
    workload_identity_secret: str
    deployment_targets: list[dict]
    schedule_interval_seconds: int


# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
    )


@app.get("/info", response_model=InfoResponse)
async def get_info():
    """Get app info."""
    return InfoResponse(
        name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )


# ============================================================================
# Session Endpoints
# ============================================================================

@app.post("/auth/session", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new session."""
    logger.info(f"Creating session for user {request.user_id} via {request.provider}")
    
    session = await session_store.create_session(
        user_id=request.user_id,
        provider=request.provider,
        oauth_tokens=request.oauth_tokens,
        user_info=request.user_info,
    )
    
    # Return response (client will set cookie from header)
    return CreateSessionResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        provider=session.provider,
        created_at=session.created_at,
        expires_at=session.expires_at,
    )


@app.post("/auth/validate", response_model=ValidateSessionResponse)
async def validate_session(request: ValidateSessionRequest):
    """Validate a session."""
    logger.info(f"Validating session {request.session_id}")
    
    session = await session_store.validate_session(request.session_id)
    
    if not session:
        return ValidateSessionResponse(valid=False)
    
    return ValidateSessionResponse(
        valid=True,
        user_id=session.user_id,
        provider=session.provider,
        expires_at=session.expires_at,
    )


@app.post("/auth/logout")
async def logout(session_id: str):
    """Logout (invalidate) a session."""
    logger.info(f"Logging out session {session_id}")
    
    await session_store.invalidate_session(session_id)
    return {"status": "logged out"}


# ============================================================================
# Agent Endpoints
# ============================================================================

@app.get("/agents/{agent_id}/config", response_model=AgentConfigResponse)
async def get_agent_config(agent_id: str):
    """Get configuration for an agent."""
    logger.info(f"Retrieving config for agent {agent_id}")
    
    # TODO: Implement workload identity validation
    # TODO: Retrieve from DynamoDB
    
    return AgentConfigResponse(
        agent_id=agent_id,
        workload_identity_secret="TODO",
        deployment_targets=[],
        schedule_interval_seconds=300,
    )


@app.post("/agents/{agent_id}/heartbeat")
async def agent_heartbeat(agent_id: str, heartbeat: AgentHeartbeatRequest):
    """Receive agent heartbeat."""
    logger.info(f"Heartbeat from agent {agent_id}: CPU={heartbeat.cpu_percent}%, MEM={heartbeat.memory_percent}%")
    
    # TODO: Store metrics in DynamoDB
    # TODO: Update agent status
    # TODO: Trigger auto-scaling if needed
    
    return {
        "status": "received",
        "next_check_interval": 30,  # Check in 30 seconds
    }


# ============================================================================
# Job Endpoints (Future)
# ============================================================================

@app.get("/jobs")
async def list_jobs(status: Optional[str] = None, limit: int = 10):
    """List recent jobs."""
    logger.info(f"Listing jobs with status filter: {status}")
    
    # TODO: Query DynamoDB for jobs
    
    return {"jobs": [], "total": 0}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get job details and logs."""
    logger.info(f"Retrieving job {job_id}")
    
    # TODO: Query DynamoDB for job
    # TODO: Return logs from S3
    
    return {"job_id": job_id, "status": "TODO"}


@app.post("/jobs")
async def create_job(git_ref: str):
    """Queue a new job."""
    logger.info(f"Queueing job for git ref: {git_ref}")
    
    # TODO: Create job in DynamoDB
    # TODO: Add to queue
    # TODO: Notify waiting agents
    
    return {"job_id": "TODO", "status": "queued"}


# ============================================================================
# Error Handling
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle value errors."""
    logger.error(f"Value error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
