"""Test configuration and fixtures for Hybrid CI/CD NET ZERO tests."""

import pytest
import asyncio
import json
import hashlib
from typing import Dict, Any
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
import uuid

# Try to import main app, but make it optional
MAIN_APP_AVAILABLE = True
try:
    from fastapi.testclient import TestClient
    from moto import mock_aws
    import boto3
    from src.main import app
    from src.core.config import settings
    from src.models.webhook import WebhookEvent
except (ImportError, ModuleNotFoundError) as e:
    MAIN_APP_AVAILABLE = False
    print(f"⚠️  Main app imports unavailable")


# ============================================================================
# Event Loop & Async Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# FastAPI Test Client
# ============================================================================

@pytest.fixture
def client():
    """Create FastAPI test client."""
    if not MAIN_APP_AVAILABLE:
        pytest.skip("Main app not available")
    return TestClient(app)


# ============================================================================
# Mock AWS/DynamoDB Fixtures
# ============================================================================

@pytest.fixture
def mock_dynamodb_table():
    """Create mock DynamoDB table for testing."""
    if not MAIN_APP_AVAILABLE:
        pytest.skip("DynamoDB fixtures not available")
    
    with mock_aws():
        # Create DynamoDB resource
        dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
        
        # Create sessions table
        table = dynamodb.create_table(
            TableName=settings.dynamodb_table_sessions,
            KeySchema=[
                {"AttributeName": "session_id", "KeyType": "HASH"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "session_id", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "created_at", "AttributeType": "N"},
            ],
            BillingMode="PAY_PER_REQUEST",
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "user_id-created_at-index",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                        {"AttributeName": "created_at", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5,
                    },
                }
            ],
            ProvisionedThroughput={
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5,
            },
        )
        
        yield table


# ============================================================================
# NET ZERO Webhook Factories (For Test Data)
# ============================================================================

@pytest.fixture
def webhook_event_factory():
    """Factory for creating WebhookEvent test data."""
    def _create_webhook_event(
        tool: str = "github",
        event_type: str = "push",
        metadata: Dict[str, Any] | None = None,
        payload_hash: str | None = None,
    ) -> Dict[str, Any]:
        """Create a WebhookEvent for testing."""
        if metadata is None:
            metadata = {
                "repository": "user/repo",
                "branch": "main",
                "commit_sha": "abc123def456",
                "sender": "testuser",
                "timestamp": datetime.utcnow().isoformat(),
            }
        
        if payload_hash is None:
            # Generate deterministic hash
            payload_str = json.dumps(metadata, sort_keys=True)
            payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        return {
            "event_id": str(uuid.uuid4()),
            "tool": tool,
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "source_url": f"https://github.com/{metadata.get('repository', 'user/repo')}/webhook",
            "metadata": metadata,
            "payload_hash": payload_hash,
        }
    
    return _create_webhook_event


@pytest.fixture
def relay_metadata_factory():
    """Factory for creating relay registration metadata."""
    def _create_relay_metadata(
        relay_name: str = "Test Relay",
        queue_provider: str = "aws_sqs",
        vault_provider: str = "aws_secrets_manager",
    ) -> Dict[str, Any]:
        """Create relay metadata for testing."""
        return {
            "relay_id": f"relay_{uuid.uuid4().hex[:12]}",
            "relay_name": relay_name,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "queue_config": {
                "provider": queue_provider,
                "queue_url": f"https://sqs.us-east-1.amazonaws.com/123456789012/test-queue",
                "region": "us-east-1",
            },
            "vault_config": {
                "provider": vault_provider,
                "region": "us-east-1",
                "secret_prefix": "hybrid-ci-cd/test/",
            },
            "status": "active",
        }
    
    return _create_relay_metadata


# ============================================================================
# Mock Queue Client Fixtures
# ============================================================================

@pytest.fixture
def mock_queue_client():
    """Create mock AWS SQS queue client."""
    client = AsyncMock()
    client.poll_messages = AsyncMock(return_value=[])
    client.send_message = AsyncMock(return_value={"MessageId": "test-msg-id"})
    client.delete_message = AsyncMock(return_value=True)
    client.verify_access = AsyncMock(return_value=True)
    return client


@pytest.fixture
def mock_queue_client_with_messages():
    """Create mock queue client with test messages."""
    def _mock_messages(count: int = 3) -> list:
        """Generate test messages."""
        messages = []
        for i in range(count):
            messages.append({
                "event_id": f"evt_{uuid.uuid4().hex[:8]}",
                "tool": "github",
                "event_type": "push",
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": {
                    "repository": "test/repo",
                    "branch": "main",
                    "commit_sha": f"sha{i:04d}",
                },
                "payload_hash": hashlib.sha256(f"payload{i}".encode()).hexdigest(),
                "receipt_handle": f"receipt_{i}",
            })
        return messages
    
    client = AsyncMock()
    client.poll_messages = AsyncMock(return_value=_mock_messages(3))
    client.send_message = AsyncMock(return_value={"MessageId": "test-msg-id"})
    client.delete_message = AsyncMock(return_value=True)
    client.verify_access = AsyncMock(return_value=True)
    return client


# ============================================================================
# Orchestration Chain Fixtures
# ============================================================================

@pytest.fixture
def relay_context_factory():
    """Factory for creating orchestration chain context."""
    def _create_context(
        messages: list | None = None,
        routing_config: dict | None = None,
    ) -> Dict[str, Any]:
        """Create CodeUChain context for orchestration."""
        if messages is None:
            messages = [
                {
                    "event_id": str(uuid.uuid4()),
                    "tool": "github",
                    "event_type": "push",
                    "metadata": {"repository": "test/repo", "branch": "main"},
                    "payload_hash": hashlib.sha256(b"test").hexdigest(),
                }
            ]
        
        if routing_config is None:
            routing_config = {
                "github": {
                    "push": {
                        "action": "trigger_build",
                        "target": "build-pipeline",
                    }
                }
            }
        
        return {
            "messages": messages,
            "routing_config": routing_config,
            "queue_config": {
                "provider": "aws_sqs",
                "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/test",
            },
        }
    
    return _create_context


# ============================================================================
# Markers for Organization
# ============================================================================

def pytest_configure(config):
    """Register custom markers."""
    markers = [
        "unit: Unit tests",
        "integration: Integration tests",
        "security: Security tests",
        "webhook: Webhook tests",
        "relay: Relay tests",
        "queue: Queue client tests",
        "orchestration: Orchestration tests",
        "async: Async tests",
        "slow: Slow tests",
    ]
    
    for marker in markers:
        config.addinivalue_line("markers", marker)


# ============================================================================
# Test Utilities
# ============================================================================

@pytest.fixture
def security_checker():
    """Utility for checking security properties."""
    class SecurityChecker:
        @staticmethod
        def check_no_payload_in_dict(obj: Dict[str, Any]) -> bool:
            """Check that 'payload' field is not in dict."""
            return "payload" not in obj
        
        @staticmethod
        def check_has_payload_hash(obj: Dict[str, Any]) -> bool:
            """Check that 'payload_hash' field is present."""
            return "payload_hash" in obj and obj["payload_hash"]
        
        @staticmethod
        def check_no_secrets_in_string(text: str) -> bool:
            """Check that common secret patterns not in string."""
            secret_patterns = [
                "password",
                "secret",
                "token",
                "api_key",
                "api-key",
                "authorization",
                "credential",
                "sk_",
                "ghp_",
                "gho_",
                "ey",  # JWT prefix
            ]
            return not any(pattern in text.lower() for pattern in secret_patterns)
        
        @staticmethod
        def compute_sha256(data: bytes | str) -> str:
            """Compute SHA-256 hash."""
            if isinstance(data, str):
                data = data.encode()
            return hashlib.sha256(data).hexdigest()
    
    return SecurityChecker()
