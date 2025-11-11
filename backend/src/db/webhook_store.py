"""
Webhook Event Store - Interface and implementations.

Interface:
- WebhookEventStoreInterface: Abstract base (testable)
- InMemoryWebhookEventStore: For development/testing
- DynamoDBWebhookEventStore: For production

This pattern enables testing with in-memory store while using
DynamoDB in production - same code, different store.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Any
from datetime import datetime
from backend.src.models.webhook import WebhookEvent


class WebhookEventStoreInterface(ABC):
    """Interface for storing webhook events"""
    
    @abstractmethod
    async def save_event(self, event: WebhookEvent) -> str:
        """
        Save webhook event to store.
        
        Args:
            event: WebhookEvent to save
        
        Returns:
            str: Event ID (usually from event['event_id'])
        
        Raises:
            Exception: If save fails
        """
        pass
    
    @abstractmethod
    async def get_event(self, event_id: str) -> Optional[WebhookEvent]:
        """
        Retrieve event by ID.
        
        Args:
            event_id: Event UUID
        
        Returns:
            WebhookEvent or None if not found
        """
        pass
    
    @abstractmethod
    async def list_events(self, tool: str, limit: int = 100) -> List[WebhookEvent]:
        """
        List recent events for a tool.
        
        Args:
            tool: Tool ID (e.g., "github", "jenkins")
            limit: Maximum number of events to return
        
        Returns:
            List of WebhookEvent, most recent first
        """
        pass
    
    @abstractmethod
    async def list_events_by_type(self, event_type: str, limit: int = 100) -> List[WebhookEvent]:
        """
        List events by type.
        
        Args:
            event_type: Event type (e.g., "push", "build_completed")
            limit: Maximum number of events to return
        
        Returns:
            List of WebhookEvent, most recent first
        """
        pass
    
    @abstractmethod
    async def delete_event(self, event_id: str) -> bool:
        """
        Delete event by ID.
        
        Args:
            event_id: Event UUID
        
        Returns:
            bool: True if deleted, False if not found
        """
        pass


class InMemoryWebhookEventStore(WebhookEventStoreInterface):
    """
    In-memory webhook event store.
    
    Perfect for testing and development.
    Data is lost on restart.
    """
    
    def __init__(self):
        """Initialize in-memory store"""
        self.events: dict[str, WebhookEvent] = {}
    
    async def save_event(self, event: WebhookEvent) -> str:
        """Save event to memory"""
        event_id = event['event_id']
        self.events[event_id] = event
        return event_id
    
    async def get_event(self, event_id: str) -> Optional[WebhookEvent]:
        """Retrieve event from memory"""
        return self.events.get(event_id)
    
    async def list_events(self, tool: str, limit: int = 100) -> List[WebhookEvent]:
        """List events for tool, sorted by timestamp"""
        events = [
            e for e in self.events.values()
            if e['tool'] == tool
        ]
        # Sort by timestamp, most recent first
        events.sort(key=lambda e: e['timestamp'], reverse=True)
        return events[:limit]
    
    async def list_events_by_type(self, event_type: str, limit: int = 100) -> List[WebhookEvent]:
        """List events by type, sorted by timestamp"""
        events = [
            e for e in self.events.values()
            if e['event_type'] == event_type
        ]
        # Sort by timestamp, most recent first
        events.sort(key=lambda e: e['timestamp'], reverse=True)
        return events[:limit]
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete event from memory"""
        if event_id in self.events:
            del self.events[event_id]
            return True
        return False
    
    def clear(self):
        """Clear all events (for testing)"""
        self.events.clear()


class DynamoDBWebhookEventStore(WebhookEventStoreInterface):
    """
    DynamoDB webhook event store (production).
    
    Requirements:
    - DynamoDB table: webhook_events
    - Partition key: event_id (String)
    - GSI1: tool (String) + timestamp (String)
    - TTL: expires_at (30 days)
    """
    
    def __init__(self, table_name: str = "webhook_events", dynamodb_resource: Optional[Any] = None):
        """
        Initialize DynamoDB store.
        
        Args:
            table_name: DynamoDB table name
            dynamodb_resource: Boto3 DynamoDB resource (optional, will use default)
        """
        self.table_name = table_name
        
        if dynamodb_resource is None:
            import boto3
            dynamodb_resource = boto3.resource('dynamodb')
        
        self.table = dynamodb_resource.Table(table_name)
    
    async def save_event(self, event: WebhookEvent) -> str:
        """Save event to DynamoDB"""
        event_id = event['event_id']
        
        # Prepare item for DynamoDB
        item = {
            'event_id': event_id,
            'tool': event['tool'],
            'event_type': event['event_type'],
            'timestamp': event['timestamp'].isoformat(),
            'source_url': event['source_url'],
            'metadata': event['metadata'],
            'payload': event['payload'],
            'created_at': datetime.utcnow().isoformat(),
        }
        
        # Set TTL (30 days from now)
        from datetime import timedelta
        ttl = datetime.utcnow() + timedelta(days=30)
        item['expires_at'] = int(ttl.timestamp())
        
        # Put item
        self.table.put_item(Item=item)
        return event_id
    
    async def get_event(self, event_id: str) -> Optional[WebhookEvent]:
        """Retrieve event from DynamoDB"""
        response = self.table.get_item(Key={'event_id': event_id})
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        
        # Convert back to WebhookEvent
        return {
            'event_id': item['event_id'],
            'tool': item['tool'],
            'event_type': item['event_type'],
            'timestamp': datetime.fromisoformat(item['timestamp']),
            'source_url': item['source_url'],
            'metadata': item.get('metadata', {}),
            'payload': item.get('payload', {})
        }
    
    async def list_events(self, tool: str, limit: int = 100) -> List[WebhookEvent]:
        """List events for tool from DynamoDB (uses GSI)"""
        # Note: This requires GSI on (tool, timestamp)
        # Implementation would use query() on GSI
        # Placeholder for now - full impl depends on DynamoDB setup
        raise NotImplementedError("DynamoDB GSI queries not fully implemented yet")
    
    async def list_events_by_type(self, event_type: str, limit: int = 100) -> List[WebhookEvent]:
        """List events by type from DynamoDB (requires scan)"""
        # Note: Scan is expensive, should use filtering or secondary index
        # Placeholder for now
        raise NotImplementedError("DynamoDB type queries not fully implemented yet")
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete event from DynamoDB"""
        self.table.delete_item(Key={'event_id': event_id})
        return True
