"""
Multi-cloud queue integrations for NET ZERO risk architecture.

This package provides config-driven queue clients for:
- AWS SQS (Simple Queue Service)
- Azure Event Grid
- GCP Pub/Sub

All implementations follow QueueClientInterface for consistent behavior.
"""

from backend.src.integrations.queues.base import QueueClientInterface
from backend.src.integrations.queues.factory import (
    create_queue_client,
    list_supported_providers,
    validate_queue_config
)

__all__ = [
    'QueueClientInterface',
    'create_queue_client',
    'list_supported_providers',
    'validate_queue_config',
]
