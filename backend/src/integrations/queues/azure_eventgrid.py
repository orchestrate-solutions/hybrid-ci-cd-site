"""
Azure Event Grid Queue Client - Placeholder for future implementation.

This module will implement QueueClientInterface for Azure Event Grid.

Config format:
    {
        'provider': 'azure_eventgrid',
        'endpoint': 'https://TOPIC-NAME.REGION.eventgrid.azure.net/api/events',
        'region': 'eastus',
        'auth': {
            'method': 'service_principal',
            'tenant_id': '...',
            'client_id': '...',
            'client_secret_vault_path': 'azure_keyvault://...'
        }
    }
"""

from typing import List, Dict, Any
from backend.src.integrations.queues.base import QueueClientInterface


class AzureEventGridClient(QueueClientInterface):
    """
    Azure Event Grid queue client (placeholder).
    
    TODO: Implement Azure Event Grid integration for Phase 2.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Azure Event Grid client"""
        self.config = config
        raise NotImplementedError(
            "Azure Event Grid client not yet implemented. "
            "See AWS SQS implementation for reference pattern."
        )
    
    async def poll_messages(self, max_messages: int = 10, wait_seconds: int = 20) -> List[Dict[str, Any]]:
        """Poll messages from Azure Event Grid"""
        raise NotImplementedError("Azure Event Grid polling not implemented")
    
    async def send_message(self, message: Dict[str, Any]) -> str:
        """Send message to Azure Event Grid"""
        raise NotImplementedError("Azure Event Grid send not implemented")
    
    async def delete_message(self, receipt_handle: str) -> bool:
        """Delete message from Azure Event Grid"""
        raise NotImplementedError("Azure Event Grid delete not implemented")
    
    async def verify_access(self) -> bool:
        """Verify Azure Event Grid access"""
        raise NotImplementedError("Azure Event Grid access verification not implemented")
    
    async def get_queue_attributes(self) -> Dict[str, Any]:
        """Get Azure Event Grid attributes"""
        raise NotImplementedError("Azure Event Grid attributes not implemented")
