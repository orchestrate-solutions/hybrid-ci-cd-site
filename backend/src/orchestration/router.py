"""
Relay orchestration router using CodeUChain.

This module implements stateless orchestration for the NET ZERO risk architecture:
1. PollUserQueueLink - Poll user's SQS/EventBridge/Pub/Sub queue for metadata
2. ApplyRoutingRulesLink - Apply config-driven routing rules to events
3. SendDecisionsLink - Send routing decisions back to user's queue

NO DATA PERSISTENCE: All operations are stateless. We never store webhook payloads,
secrets, or sensitive metadata. User owns the queue, we only read/write decisions.
"""

from codeuchain.core import Context, Chain, Link
from typing import Dict, Any, List, Optional
import logging

from src.integrations.queues.base import QueueClientInterface
from src.integrations.queues.factory import create_queue_client

logger = logging.getLogger(__name__)


class PollUserQueueLink(Link[dict, dict]):
    """
    Poll user's queue for webhook metadata events.
    
    Context Input:
    - queue_config: dict (provider, queue_url, role_arn, region)
    - max_messages: int (default: 10)
    - wait_seconds: int (default: 20 for long-polling)
    
    Context Output:
    - messages: List[dict] (relay_id, event_id, tool, event_type, metadata)
    - queue_client: QueueClientInterface (for downstream links)
    """
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        queue_config = ctx.get("queue_config") or {}
        max_messages = ctx.get("max_messages") or 10
        wait_seconds = ctx.get("wait_seconds") or 20
        
        if not queue_config:
            logger.error("No queue_config provided")
            return ctx.insert("error", "queue_config required")
        
        try:
            # Create queue client (factory pattern)
            queue_client = create_queue_client(queue_config)
            
            # Verify access before polling
            if not await queue_client.verify_access():
                logger.error(f"Failed to verify access to queue: {queue_config.get('queue_url')}")
                return ctx.insert("error", "queue_access_denied")
            
            # Poll messages (long-polling)
            messages = await queue_client.poll_messages(
                max_messages=max_messages,
                wait_seconds=wait_seconds
            )
            
            logger.info(f"Polled {len(messages)} messages from user queue")
            
            # Store messages and client in context
            ctx = ctx.insert("messages", messages)
            ctx = ctx.insert("queue_client", queue_client)
            
            return ctx
            
        except Exception as e:
            logger.error(f"Error polling user queue: {e}")
            return ctx.insert("error", f"poll_failed: {str(e)}")


class ApplyRoutingRulesLink(Link[dict, dict]):
    """
    Apply config-driven routing rules to polled messages.
    
    Context Input:
    - messages: List[dict] (from PollUserQueueLink)
    - routing_config: dict (tool-specific routing rules)
    
    Context Output:
    - routing_decisions: List[dict] (event_id, action, target, metadata)
    
    Routing rules format (example):
    {
        "github-actions": {
            "push": {"action": "trigger_build", "target": "build-pipeline"},
            "pull_request": {"action": "run_tests", "target": "test-pipeline"}
        },
        "terraform": {
            "plan_completed": {"action": "notify", "target": "slack-channel"}
        }
    }
    
    NOTE: No business logic here - just rule matching. Rules come from user's config.
    """
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        messages = ctx.get("messages") or []
        routing_config = ctx.get("routing_config") or {}
        
        if not messages:
            logger.info("No messages to route")
            return ctx.insert("routing_decisions", [])
        
        routing_decisions = []
        
        for msg in messages:
            tool = msg.get("tool")
            event_type = msg.get("event_type")
            event_id = msg.get("event_id")
            metadata = msg.get("metadata") or {}
            
            # Look up routing rule for this tool + event type
            tool_rules = routing_config.get(tool) or {}
            rule = tool_rules.get(event_type)
            
            if not rule:
                logger.warning(f"No routing rule for {tool}/{event_type}, skipping")
                routing_decisions.append({
                    "event_id": event_id,
                    "action": "no_rule",
                    "target": None,
                    "metadata": metadata
                })
                continue
            
            # Apply rule (stateless transformation)
            decision = {
                "event_id": event_id,
                "action": rule.get("action"),
                "target": rule.get("target"),
                "metadata": {
                    **metadata,
                    "tool": tool,
                    "event_type": event_type,
                    "rule_matched": True
                }
            }
            
            routing_decisions.append(decision)
            logger.info(f"Routed {event_id}: {rule.get('action')} → {rule.get('target')}")
        
        return ctx.insert("routing_decisions", routing_decisions)


class SendDecisionsLink(Link[dict, dict]):
    """
    Send routing decisions back to user's queue.
    
    Context Input:
    - routing_decisions: List[dict] (from ApplyRoutingRulesLink)
    - queue_client: QueueClientInterface (from PollUserQueueLink)
    - messages: List[dict] (original messages, for receipt handles)
    
    Context Output:
    - sent_count: int (number of decisions sent)
    - deleted_count: int (number of messages deleted from queue)
    
    NOTE: We send decisions back to user's queue, then delete original messages.
    User's relay consumes decisions and executes actions in their infrastructure.
    """
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        routing_decisions = ctx.get("routing_decisions") or []
        queue_client = ctx.get("queue_client")
        messages = ctx.get("messages") or []
        
        if not queue_client:
            logger.error("No queue_client in context")
            return ctx.insert("error", "queue_client_missing")
        
        if not routing_decisions:
            logger.info("No routing decisions to send")
            return ctx.insert("sent_count", 0).insert("deleted_count", 0)
        
        sent_count = 0
        deleted_count = 0
        
        try:
            # Send each decision back to user's queue
            for decision in routing_decisions:
                await queue_client.send_message(decision)
                sent_count += 1
            
            logger.info(f"Sent {sent_count} routing decisions to user queue")
            
            # Delete original messages from queue (processed)
            for msg in messages:
                receipt_handle = msg.get("receipt_handle")
                if receipt_handle:
                    await queue_client.delete_message(receipt_handle)
                    deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} processed messages from user queue")
            
            ctx = ctx.insert("sent_count", sent_count)
            ctx = ctx.insert("deleted_count", deleted_count)
            
            return ctx
            
        except Exception as e:
            logger.error(f"Error sending decisions: {e}")
            return ctx.insert("error", f"send_failed: {str(e)}")


class RelayOrchestrationChain:
    """
    Stateless orchestration chain for relay polling and routing.
    
    Flow:
    1. Poll user's queue (PollUserQueueLink)
    2. Apply routing rules (ApplyRoutingRulesLink)
    3. Send decisions back (SendDecisionsLink)
    
    This chain is STATELESS - no data is persisted. All operations are
    read-only on user's queue, followed by write-back of decisions.
    
    Example usage:
    
        chain = RelayOrchestrationChain()
        result = await chain.run({
            "queue_config": {
                "provider": "aws_sqs",
                "queue_url": "https://sqs.us-east-1.amazonaws.com/...",
                "role_arn": "arn:aws:iam::123456789012:role/RelayPollerRole",
                "region": "us-east-1"
            },
            "routing_config": {
                "github-actions": {
                    "push": {"action": "trigger_build", "target": "build-pipeline"}
                }
            }
        })
    """
    
    def __init__(self):
        self.chain = Chain()
        
        # Add links (immutable context flow)
        self.chain.add_link(PollUserQueueLink(), "poll_queue")
        self.chain.add_link(ApplyRoutingRulesLink(), "apply_rules")
        self.chain.add_link(SendDecisionsLink(), "send_decisions")
        
        # Connect links (conditional routing)
        # Only apply rules if we have messages
        self.chain.connect(
            "poll_queue", 
            "apply_rules", 
            lambda c: len(c.get("messages") or []) > 0 and c.get("error") is None
        )
        
        # Only send decisions if we have routing decisions
        self.chain.connect(
            "apply_rules",
            "send_decisions",
            lambda c: len(c.get("routing_decisions") or []) > 0
        )
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the orchestration chain.
        
        Args:
            request_data: dict with:
                - queue_config: Queue connection details
                - routing_config: Tool-specific routing rules
                - max_messages: Optional max messages to poll (default: 10)
                - wait_seconds: Optional long-polling wait time (default: 20)
        
        Returns:
            dict with:
                - sent_count: Number of decisions sent
                - deleted_count: Number of messages deleted
                - error: Error message if any
        """
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        # Extract results
        error = result_ctx.get("error")
        if error:
            logger.error(f"Orchestration chain failed: {error}")
            return {"error": error, "sent_count": 0, "deleted_count": 0}
        
        sent_count = result_ctx.get("sent_count") or 0
        deleted_count = result_ctx.get("deleted_count") or 0
        
        return {
            "sent_count": sent_count,
            "deleted_count": deleted_count,
            "error": None
        }
