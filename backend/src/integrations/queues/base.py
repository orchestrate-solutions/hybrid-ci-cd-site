"""
Queue Client Interface - Abstract base for multi-cloud queue integrations.

This module defines the interface for queue clients (AWS SQS, Azure Event Grid,
GCP Pub/Sub) using the Strategy pattern for config-driven queue provider selection.

ARCHITECTURE: User-Owned Queue Model (NET ZERO Risk)
- User creates queue in their cloud account (AWS/Azure/GCP)
- User grants provider read-only IAM access
- Provider polls queue for metadata (no full payloads)
- Provider sends routing decisions back to queue
- Provider stores NOTHING (stateless orchestration)
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class QueueClientInterface(ABC):
    """
    Abstract interface for queue clients (AWS SQS, Azure, GCP).
    
    All implementations must support:
    - Polling messages (read-only access to user's queue)
    - Sending messages (routing decisions back to user's queue)
    - Access verification (check IAM/RBAC permissions)
    
    Config-driven via factory pattern - no hard-coded providers.
    """
    
    @abstractmethod
    async def poll_messages(self, max_messages: int = 10, wait_seconds: int = 20) -> List[Dict[str, Any]]:
        """
        Poll messages from user's queue (read-only).
        
        Uses long-polling to minimize API calls and latency.
        
        Args:
            max_messages: Maximum number of messages to retrieve (1-10)
            wait_seconds: Long-polling wait time (0-20 seconds)
        
        Returns:
            List[Dict]: Messages from queue, each with:
                - message_id: Unique message identifier
                - relay_id: Relay that sent this message (for verification)
                - event_id: Webhook event UUID
                - tool: Tool identifier (github, jenkins, etc.)
                - event_type: Event type (push, build_completed, etc.)
                - timestamp: ISO format timestamp
                - metadata: Tool-specific extracted fields
                - receipt_handle: Queue-specific handle for deletion
        
        Raises:
            Exception: If queue access fails
        """
        pass
    
    @abstractmethod
    async def send_message(self, message: Dict[str, Any]) -> str:
        """
        Send routing decision back to user's queue.
        
        Args:
            message: Routing decision message containing:
                - event_id: Original event UUID
                - action: Action to perform (e.g., "trigger_job_X")
                - params: Action parameters (job_id, environment, etc.)
                - timestamp: Decision timestamp
        
        Returns:
            str: Message ID from queue provider
        
        Raises:
            Exception: If message send fails
        """
        pass
    
    @abstractmethod
    async def delete_message(self, receipt_handle: str) -> bool:
        """
        Delete message from queue (after processing).
        
        Args:
            receipt_handle: Queue-specific message handle
        
        Returns:
            bool: True if deleted successfully
        
        Raises:
            Exception: If deletion fails
        """
        pass
    
    @abstractmethod
    async def verify_access(self) -> bool:
        """
        Verify provider has required access to user's queue.
        
        Checks:
        - Read permission (ReceiveMessage, GetQueueAttributes)
        - Write permission (SendMessage)
        - Queue exists and is accessible
        
        Returns:
            bool: True if all permissions verified
        
        Raises:
            Exception: If access check fails
        """
        pass
    
    @abstractmethod
    async def get_queue_attributes(self) -> Dict[str, Any]:
        """
        Get queue metadata (for monitoring/debugging).
        
        Returns:
            Dict: Queue attributes (approximate message count, etc.)
        
        Raises:
            Exception: If attributes retrieval fails
        """
        pass
