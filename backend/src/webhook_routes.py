"""
FastAPI Webhook Router - Universal endpoint for all DevOps tools.

Single dynamic endpoint: POST /api/webhooks/<tool_id>

Flow:
1. Load tool config (defines verification, parsing, mapping)
2. Create adapter with config
3. Verify signature
4. Parse payload
5. Route to handler chain (CodeUChain)
6. Return result or error

No tool-specific routes - all behavior defined in YAML configs.
"""

from typing import Optional
from fastapi import APIRouter, Request, HTTPException
import logging

from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from backend.src.services.webhook_config_loader import WebhookConfigLoader
from backend.src.db.webhook_store import WebhookEventStoreInterface
from backend.src.components.chains.webhook_chains import WebhookEventChain

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])

# Module-level state (set by init_webhook_routes)
_config_loader: Optional[WebhookConfigLoader] = None
_event_store: Optional[WebhookEventStoreInterface] = None
_event_chain: Optional[WebhookEventChain] = None


def init_webhook_routes(
    config_loader: WebhookConfigLoader,
    event_store: WebhookEventStoreInterface,
    event_chain: WebhookEventChain
) -> None:
    """
    Initialize webhook router with dependencies.
    
    Call this once during app startup to configure webhook handling.
    
    Args:
        config_loader: WebhookConfigLoader instance
        event_store: WebhookEventStore implementation
        event_chain: CodeUChain for processing events
    """
    global _config_loader, _event_store, _event_chain
    _config_loader = config_loader
    _event_store = event_store
    _event_chain = event_chain
    
    logger.info("Webhook routes initialized")


@router.post("/api/webhooks/{tool_id}")
async def receive_webhook(tool_id: str, request: Request):
    """
    Universal webhook endpoint for all tools.
    
    This single endpoint handles webhooks from GitHub, Jenkins, Terraform,
    Prometheus, and any custom tool via config-driven behavior.
    
    Process:
    1. Load tool config (if not cached)
    2. Read raw body for signature verification
    3. Create adapter with config
    4. Verify signature using method from config
    5. Parse payload and normalize to WebhookEvent
    6. Run through CodeUChain for routing and storage
    7. Return success or error
    
    Args:
        tool_id: Tool identifier (e.g., "github", "jenkins", "prometheus")
        request: FastAPI Request with headers and body
    
    Returns:
        dict: {
            "status": "accepted",
            "event_id": "<uuid>",
            "tool": "<tool_id>",
            "message": "Event received and queued"
        }
    
    Raises:
        HTTPException(404): Tool not found
        HTTPException(400): Bad request (malformed payload, invalid signature)
        HTTPException(401): Unauthorized (invalid signature)
        HTTPException(500): Internal server error
    """
    if not _config_loader or not _event_store or not _event_chain:
        raise HTTPException(
            status_code=500,
            detail="Webhook routes not initialized. Call init_webhook_routes() on startup."
        )
    
    try:
        # Step 1: Load tool config
        logger.debug(f"Loading config for tool: {tool_id}")
        config = await _config_loader.load_config(tool_id)
        
        # Step 2: Read raw body for signature verification
        body = await request.body()
        headers = dict(request.headers)
        
        # Step 3: Create adapter
        adapter = UniversalWebhookAdapter(config)
        
        # Step 4 & 5: Verify and parse payload
        logger.debug(f"Parsing webhook for tool: {tool_id}")
        webhook_event = await adapter.parse(body, headers)
        
        logger.info(
            f"Webhook received",
            extra={
                "tool": tool_id,
                "event_type": webhook_event['event_type'],
                "event_id": webhook_event['event_id']
            }
        )
        
        # Step 6: Store event
        event_id = await _event_store.save_event(webhook_event)
        
        # Step 7: Run through chain (non-blocking)
        # In production, this would be async/queued
        try:
            result = await _event_chain.run(webhook_event)
        except Exception as e:
            logger.error(f"Error processing webhook: {e}", exc_info=True)
            result = {"error": str(e)}
        
        # Step 8: Return success
        return {
            "status": "accepted",
            "event_id": event_id,
            "tool": tool_id,
            "event_type": webhook_event['event_type'],
            "message": "Event received and queued for processing"
        }
    
    except FileNotFoundError as e:
        logger.warning(f"Tool not found: {tool_id}")
        raise HTTPException(
            status_code=404,
            detail=f"Tool not found: {tool_id}"
        )
    
    except ValueError as e:
        error_msg = str(e)
        
        # Categorize error for appropriate HTTP status
        if "Invalid webhook signature" in error_msg:
            logger.warning(f"Invalid signature for tool {tool_id}")
            raise HTTPException(
                status_code=401,
                detail="Invalid webhook signature"
            )
        else:
            logger.warning(f"Bad request for tool {tool_id}: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
    
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error processing webhook"
        )


@router.get("/api/webhooks")
async def list_webhook_tools():
    """
    List all available webhook tools.
    
    Returns:
        dict: {
            "tools": ["github", "jenkins", "terraform", "prometheus"],
            "count": 4
        }
    
    Raises:
        HTTPException(500): If routes not initialized
    """
    if not _config_loader:
        raise HTTPException(
            status_code=500,
            detail="Webhook routes not initialized"
        )
    
    try:
        tools = await _config_loader.list_tools()
        return {
            "tools": tools,
            "count": len(tools)
        }
    except Exception as e:
        logger.error(f"Error listing tools: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error listing available tools"
        )


@router.get("/api/webhooks/{tool_id}/health")
async def check_webhook_tool(tool_id: str):
    """
    Check if webhook tool is configured and ready.
    
    Args:
        tool_id: Tool identifier
    
    Returns:
        dict: {
            "tool": "<tool_id>",
            "status": "ready",
            "endpoint": "/api/webhooks/<tool_id>"
        }
    
    Raises:
        HTTPException(404): Tool not found
        HTTPException(500): Misconfigured tool
    """
    if not _config_loader:
        raise HTTPException(
            status_code=500,
            detail="Webhook routes not initialized"
        )
    
    try:
        config = await _config_loader.load_config(tool_id)
        
        endpoint = config['integration']['webhooks'].get('endpoint', f'/api/webhooks/{tool_id}')
        
        return {
            "tool": tool_id,
            "status": "ready",
            "endpoint": endpoint,
            "verification": config['integration']['webhooks']['verification']['method']
        }
    
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Tool not found: {tool_id}"
        )
    
    except Exception as e:
        logger.error(f"Error checking tool {tool_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error checking tool status: {e}"
        )
