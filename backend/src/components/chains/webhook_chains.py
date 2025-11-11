"""
Webhook Event Chain - CodeUChain for processing webhook events.

Pattern:
1. LoadConfigLink: Load tool config for context
2. ValidateEventLink: Ensure event has required fields
3. RouteEventLink: Route to handlers based on tool/event_type
4. StoreEventLink: Store event for audit trail
5. HandlerLink: Execute handlers (Job creation, Deployment, etc.)

Uses immutable Context flow - CodeUChain standard pattern.
"""

from codeuchain.core import Context, Chain, Link
from typing import Any, Optional
import logging

from backend.src.db.webhook_store import WebhookEventStoreInterface
from backend.src.models.webhook import WebhookEvent

logger = logging.getLogger(__name__)


class ValidateEventLink(Link[dict, dict]):
    """Validate WebhookEvent has required fields"""
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        """
        Validate event structure.
        
        Required fields: event_id, tool, event_type, timestamp, metadata, payload
        """
        event = ctx.get("webhook_event")
        
        if not event:
            raise ValueError("webhook_event required in context")
        
        required_fields = ['event_id', 'tool', 'event_type', 'timestamp', 'metadata', 'payload']
        missing = [f for f in required_fields if f not in event]
        
        if missing:
            raise ValueError(f"Missing required fields: {missing}")
        
        return ctx.insert("validated", True)


class StoreEventLink(Link[dict, dict]):
    """Store webhook event to database"""
    
    def __init__(self, store: WebhookEventStoreInterface):
        self.store = store
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        """Store event and return stored_event_id"""
        event = ctx.get("webhook_event")
        
        if not event:
            return ctx.insert("error", "webhook_event not in context")
        
        try:
            event_id = await self.store.save_event(event)
            logger.info(f"Stored webhook event: {event_id}")
            return ctx.insert("stored_event_id", event_id)
        except Exception as e:
            logger.error(f"Error storing webhook: {e}")
            return ctx.insert("storage_error", str(e))


class RouteEventLink(Link[dict, dict]):
    """Route event to appropriate handlers"""
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        """Route based on tool/event_type combination"""
        event = ctx.get("webhook_event")
        
        if not event:
            return ctx.insert("routing_error", "webhook_event not in context")
        
        tool = event.get('tool')
        event_type = event.get('event_type')
        
        logger.info(f"Routing event: {tool}/{event_type}")
        
        # Insert routing decision for downstream links
        return ctx.insert("route", f"{tool}/{event_type}")


class WebhookEventChain:
    """
    CodeUChain for processing webhook events.
    
    Flow:
    1. ValidateEventLink: Check structure
    2. StoreEventLink: Store to database
    3. RouteEventLink: Determine handlers
    4. Can be extended with more links (e.g., JobCreationLink, DeploymentLink)
    """
    
    def __init__(self, store: WebhookEventStoreInterface):
        """
        Initialize chain with store implementation.
        
        Args:
            store: WebhookEventStore for persistence
        """
        self.chain = Chain()
        
        # Add links in order
        self.chain.add_link(ValidateEventLink(), "validate")
        self.chain.add_link(StoreEventLink(store), "store")
        self.chain.add_link(RouteEventLink(), "route")
        
        # Connect links with predicates
        self.chain.connect("validate", "store", lambda c: c.get("validated") is True)
        self.chain.connect("store", "route", lambda c: c.get("stored_event_id") is not None)
    
    async def run(self, webhook_event: WebhookEvent) -> dict:
        """
        Process webhook event through chain.
        
        Args:
            webhook_event: WebhookEvent to process
        
        Returns:
            dict: Result context with routing and storage results
        """
        ctx = Context({"webhook_event": webhook_event})
        result = await self.chain.run(ctx)
        return result.to_dict()
