"""
Queue Client Factory - Config-driven queue provider selection.

Factory pattern for creating queue clients based on user configuration.
Supports AWS SQS, Azure Event Grid, GCP Pub/Sub - all config-driven.

Usage:
    config = {
        'queue': {
            'provider': 'aws_sqs',
            'endpoint': 'https://sqs.us-east-1.amazonaws.com/123456789012/queue',
            'region': 'us-east-1',
            'auth': {'method': 'iam_role', 'role_arn': 'arn:aws:iam::...'}
        }
    }
    client = create_queue_client(config)
    messages = await client.poll_messages()
"""

from typing import Dict, Any
from backend.src.integrations.queues.base import QueueClientInterface


def create_queue_client(config: Dict[str, Any]) -> QueueClientInterface:
    """
    Create queue client based on config.
    
    Config-driven approach enables adding new providers without code changes:
    - AWS SQS: provider = 'aws_sqs'
    - Azure Event Grid: provider = 'azure_eventgrid'
    - GCP Pub/Sub: provider = 'gcp_pubsub'
    
    Args:
        config: Queue configuration dict with:
            - queue.provider: Queue provider ID
            - queue.endpoint: Queue URL/endpoint
            - queue.region: Cloud region (AWS/Azure/GCP)
            - queue.auth: Authentication config (IAM role, service principal, etc.)
    
    Returns:
        QueueClientInterface: Instantiated queue client
    
    Raises:
        ValueError: If provider unsupported or config invalid
    
    Example:
        >>> config = {'queue': {'provider': 'aws_sqs', 'endpoint': '...', ...}}
        >>> client = create_queue_client(config)
        >>> messages = await client.poll_messages()
    """
    if 'queue' not in config:
        raise ValueError("Queue configuration missing in config")
    
    queue_config = config['queue']
    provider = queue_config.get('provider')
    
    if not provider:
        raise ValueError("Queue provider not specified in config")
    
    # Factory mapping: provider ID → client class
    if provider == 'aws_sqs':
        from backend.src.integrations.queues.aws_sqs import AWSSQSClient
        return AWSSQSClient(queue_config)
    
    elif provider == 'azure_eventgrid':
        from backend.src.integrations.queues.azure_eventgrid import AzureEventGridClient
        return AzureEventGridClient(queue_config)
    
    elif provider == 'gcp_pubsub':
        from backend.src.integrations.queues.gcp_pubsub import GCPPubSubClient
        return GCPPubSubClient(queue_config)
    
    else:
        raise ValueError(
            f"Unsupported queue provider: {provider}. "
            f"Supported: aws_sqs, azure_eventgrid, gcp_pubsub"
        )


def list_supported_providers() -> list[str]:
    """
    List all supported queue providers.
    
    Returns:
        List[str]: Provider IDs
    """
    return ['aws_sqs', 'azure_eventgrid', 'gcp_pubsub']


def validate_queue_config(config: Dict[str, Any]) -> bool:
    """
    Validate queue configuration before creating client.
    
    Args:
        config: Queue config dict
    
    Returns:
        bool: True if valid
    
    Raises:
        ValueError: If config invalid
    """
    if 'queue' not in config:
        raise ValueError("Missing 'queue' key in config")
    
    queue = config['queue']
    
    required_fields = ['provider', 'endpoint']
    for field in required_fields:
        if field not in queue:
            raise ValueError(f"Missing required field: queue.{field}")
    
    provider = queue['provider']
    if provider not in list_supported_providers():
        raise ValueError(f"Unsupported provider: {provider}")
    
    return True
