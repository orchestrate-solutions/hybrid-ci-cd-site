"""
GCP Pub/Sub Queue Client - Placeholder for future implementation.

This module will implement QueueClientInterface for GCP Pub/Sub.

Config format:
    {
        'provider': 'gcp_pubsub',
        'endpoint': 'projects/PROJECT_ID/subscriptions/SUBSCRIPTION_ID',
        'region': 'us-central1',
        'auth': {
            'method': 'workload_identity',
            'project_id': '...',
            'service_account_email': '...'
        }
    }
"""

from typing import List, Dict, Any
from backend.src.integrations.queues.base import QueueClientInterface


class GCPPubSubClient(QueueClientInterface):
    """
    GCP Pub/Sub queue client (placeholder).
    
    TODO: Implement GCP Pub/Sub integration for Phase 2.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize GCP Pub/Sub client"""
        self.config = config
        raise NotImplementedError(
            "GCP Pub/Sub client not yet implemented. "
            "See AWS SQS implementation for reference pattern."
        )
    
    async def poll_messages(self, max_messages: int = 10, wait_seconds: int = 20) -> List[Dict[str, Any]]:
        """Poll messages from GCP Pub/Sub"""
        raise NotImplementedError("GCP Pub/Sub polling not implemented")
    
    async def send_message(self, message: Dict[str, Any]) -> str:
        """Send message to GCP Pub/Sub"""
        raise NotImplementedError("GCP Pub/Sub send not implemented")
    
    async def delete_message(self, receipt_handle: str) -> bool:
        """Delete message from GCP Pub/Sub"""
        raise NotImplementedError("GCP Pub/Sub delete not implemented")
    
    async def verify_access(self) -> bool:
        """Verify GCP Pub/Sub access"""
        raise NotImplementedError("GCP Pub/Sub access verification not implemented")
    
    async def get_queue_attributes(self) -> Dict[str, Any]:
        """Get GCP Pub/Sub attributes"""
        raise NotImplementedError("GCP Pub/Sub attributes not implemented")
