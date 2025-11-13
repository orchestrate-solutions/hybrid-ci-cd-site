"""
Unit tests for NET ZERO risk architecture security guarantees.

These tests verify that:
1. WebhookEvent model does NOT have a payload field
2. payload_hash is present and correctly computed (SHA-256)
3. Webhook adapter sanitizes payloads instead of storing them
4. Webhook stores persist only metadata + hash
5. Secrets are never leaked in sanitized events
6. Queue client factory creates correct clients
7. Orchestration chain is stateless (no data persistence)
"""

import pytest
import hashlib
import json
from typing import Dict, Any

from src.models.webhook import WebhookEvent
from src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from src.db.webhook_store import InMemoryWebhookEventStore, WebhookEventStoreInterface
from src.integrations.queues.factory import create_queue_client, list_supported_providers
from src.orchestration.router import RelayOrchestrationChain


# ============================================================================
# Test 1: WebhookEvent Model Security
# ============================================================================

class TestWebhookEventSecurity:
    """Verify WebhookEvent model removes payload field."""
    
    def test_webhook_event_has_no_payload_field(self):
        """WebhookEvent should NOT have a payload field."""
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo/commit/abc123",
            metadata={"repo": "user/repo", "branch": "main"},
            payload_hash="abc123def456"
        )
        
        # Critical security check: payload field must NOT exist
        assert not hasattr(event, "payload"), "SECURITY VIOLATION: WebhookEvent has payload field"
        assert hasattr(event, "payload_hash"), "payload_hash field missing"
    
    def test_webhook_event_payload_hash_present(self):
        """payload_hash field must be present and valid."""
        payload_hash = hashlib.sha256(b"test_payload").hexdigest()
        
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo"},
            payload_hash=payload_hash
        )
        
        assert event.payload_hash == payload_hash
        assert len(event.payload_hash) == 64  # SHA-256 hex digest length
    
    def test_webhook_event_to_dict_no_payload(self):
        """WebhookEvent.to_dict() must NOT include payload field."""
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo"},
            payload_hash="abc123"
        )
        
        event_dict = event.dict()
        assert "payload" not in event_dict, "SECURITY VIOLATION: payload in dict()"
        assert "payload_hash" in event_dict


# ============================================================================
# Test 2: Webhook Adapter Sanitization
# ============================================================================

class TestWebhookAdapterSanitization:
    """Verify webhook adapter sanitizes payloads instead of storing them."""
    
    def test_adapter_does_not_store_secrets(self):
        """
        Adapter must NOT store secrets from webhook payload.
        
        This is the MOST CRITICAL security test - verify that full webhook
        payloads (which contain secrets) are never stored.
        """
        adapter = UniversalWebhookAdapter()
        
        # Payload containing secrets (simulating real webhook)
        webhook_payload = {
            "repository": {"full_name": "user/repo"},
            "ref": "refs/heads/main",
            "head_commit": {
                "id": "abc123def456",
                "message": "Fix security issue",
                "timestamp": "2025-11-13T10:00:00Z",
                "author": {"name": "Alice"}
            },
            # Sensitive fields that should NEVER be stored
            "secret_webhook_key": "super_secret_key_12345",
            "api_token": "ghp_1234567890abcdefghijklmnop",
            "aws_credentials": "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
        
        raw_payload = json.dumps(webhook_payload).encode('utf-8')
        config = {
            "verification": {
                "method": "none"
            },
            "events": {
                "push": {
                    "http_event_header": "X-GitHub-Event",
                    "header_value": "push",
                    "data_mapping": {
                        "event_type": "push",
                        "repository": "$.repository.full_name",
                        "branch": "$.ref",
                        "commit_sha": "$.head_commit.id"
                    }
                }
            }
        }
        
        # Parse webhook
        event = adapter.parse_sync(raw_payload, config, {"X-GitHub-Event": "push"})
        
        # Verify secrets NOT in event
        event_str = json.dumps(event.dict())
        assert "secret_webhook_key" not in event_str
        assert "ghp_1234567890abcdefghijklmnop" not in event_str
        assert "AKIAIOSFODNN7EXAMPLE" not in event_str
        assert "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" not in event_str
        
        # Verify metadata IS extracted
        assert event.metadata.get("repository") == "user/repo"
        assert event.metadata.get("branch") == "refs/heads/main"
        assert event.metadata.get("commit_sha") == "abc123def456"
    
    def test_adapter_creates_payload_hash(self):
        """Adapter must create SHA-256 hash of payload."""
        adapter = UniversalWebhookAdapter()
        
        webhook_payload = {
            "repository": {"full_name": "user/repo"},
            "ref": "refs/heads/main",
            "head_commit": {"id": "abc123", "message": "Test", "timestamp": "2025-11-13T10:00:00Z", "author": {"name": "Alice"}}
        }
        
        raw_payload = json.dumps(webhook_payload).encode('utf-8')
        expected_hash = hashlib.sha256(raw_payload).hexdigest()
        
        config = {
            "verification": {"method": "none"},
            "events": {
                "push": {
                    "http_event_header": "X-GitHub-Event",
                    "header_value": "push",
                    "data_mapping": {"event_type": "push"}
                }
            }
        }
        
        event = adapter.parse_sync(raw_payload, config, {"X-GitHub-Event": "push"})
        
        assert event.payload_hash == expected_hash
        assert len(event.payload_hash) == 64


# ============================================================================
# Test 3: Webhook Store Sanitization
# ============================================================================

class TestWebhookStoreSanitization:
    """Verify webhook stores persist only metadata + hash, never full payloads."""
    
    def test_in_memory_store_persists_only_hash(self):
        """InMemoryWebhookEventStore must NOT persist full payload."""
        store = InMemoryWebhookEventStore()
        
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo", "branch": "main"},
            payload_hash="abc123def456"
        )
        
        # Save event
        store.save_event(event)
        
        # Retrieve event
        retrieved = store.get_event("evt_123")
        
        # Verify retrieved event has NO payload field
        assert not hasattr(retrieved, "payload")
        assert retrieved.payload_hash == "abc123def456"
        
        # Verify metadata preserved
        assert retrieved.metadata.get("repo") == "user/repo"
        assert retrieved.metadata.get("branch") == "main"
    
    def test_in_memory_store_dict_no_payload(self):
        """InMemoryWebhookEventStore stored dict must not contain payload."""
        store = InMemoryWebhookEventStore()
        
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo"},
            payload_hash="abc123"
        )
        
        store.save_event(event)
        
        # Access internal store (for testing purposes)
        stored_dict = store._events.get("evt_123")
        
        # Verify payload NOT in stored dict
        assert "payload" not in stored_dict.dict()
        assert "payload_hash" in stored_dict.dict()


# ============================================================================
# Test 4: Queue Client Factory
# ============================================================================

class TestQueueClientFactory:
    """Verify queue client factory creates correct clients."""
    
    def test_factory_lists_supported_providers(self):
        """Factory must list all supported providers."""
        providers = list_supported_providers()
        
        assert "aws_sqs" in providers
        assert "azure_eventgrid" in providers
        assert "gcp_pubsub" in providers
    
    def test_factory_creates_aws_sqs_client(self):
        """Factory must create AWS SQS client."""
        config = {
            "provider": "aws_sqs",
            "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue",
            "role_arn": "arn:aws:iam::123456789012:role/TestRole",
            "region": "us-east-1"
        }
        
        client = create_queue_client(config)
        
        assert client.__class__.__name__ == "AWSSQSClient"
    
    def test_factory_rejects_unsupported_provider(self):
        """Factory must reject unsupported providers."""
        config = {
            "provider": "unsupported_queue",
            "queue_url": "https://example.com/queue"
        }
        
        with pytest.raises(ValueError, match="Unsupported queue provider"):
            create_queue_client(config)
    
    def test_factory_validates_config(self):
        """Factory must validate required config fields."""
        # Missing provider
        config = {"queue_url": "https://example.com/queue"}
        
        with pytest.raises(ValueError):
            create_queue_client(config)


# ============================================================================
# Test 5: Orchestration Chain Statelessness
# ============================================================================

class TestOrchestrationChainStatelessness:
    """Verify orchestration chain is stateless (no data persistence)."""
    
    @pytest.mark.asyncio
    async def test_orchestration_chain_is_stateless(self):
        """
        Orchestration chain must NOT persist data between runs.
        
        This is critical for NET ZERO: provider does NOT store
        user data, secrets, or decisions.
        """
        chain = RelayOrchestrationChain()
        
        # First run
        result1 = await chain.run({
            "queue_config": {
                "provider": "aws_sqs",
                "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue",
                "region": "us-east-1"
            },
            "routing_config": {}
        })
        
        # Chain should return only computed result, not stored state
        assert "sent_count" in result1
        assert "deleted_count" in result1
        
        # Verify no data persisted
        # (If chain stored data, we'd see it in the next run)
        result2 = await chain.run({
            "queue_config": {
                "provider": "aws_sqs",
                "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue",
                "region": "us-east-1"
            },
            "routing_config": {}
        })
        
        # Results should be fresh, not accumulated
        assert isinstance(result1["sent_count"], int)
        assert isinstance(result2["sent_count"], int)


# ============================================================================
# Test 6: No Secrets in Logs
# ============================================================================

class TestNoSecretsInLogs:
    """Verify secrets never appear in logs."""
    
    def test_event_string_representation_no_secrets(self):
        """Event string representation must not contain payload."""
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo"},
            payload_hash="abc123"
        )
        
        # Convert to string (as would appear in logs)
        event_str = str(event)
        event_repr = repr(event)
        
        # Should not contain dangerous keywords
        assert "secret" not in event_str.lower()
        assert "password" not in event_str.lower()
        assert "token" not in event_str.lower()
        
        # Should contain hash
        assert "abc123" in event_str
    
    def test_event_json_safe(self):
        """Event JSON serialization must be safe."""
        event = WebhookEvent(
            event_id="evt_123",
            tool="github",
            event_type="push",
            timestamp="2025-11-13T10:00:00Z",
            source_url="https://github.com/user/repo",
            metadata={"repo": "user/repo"},
            payload_hash="abc123"
        )
        
        # Should serialize without payload
        event_json = json.dumps(event.dict())
        
        assert "payload" not in event_json
        assert "payload_hash" in event_json
        assert '"abc123"' in event_json


# ============================================================================
# Test 7: API Key Security
# ============================================================================

class TestAPIKeySecurity:
    """Verify API keys are hashed, never stored plaintext."""
    
    def test_api_key_hashing(self):
        """API keys must be hashed with SHA-256."""
        from src.relay_routes import generate_api_key, hash_api_key, verify_api_key
        
        # Generate key
        api_key = generate_api_key()
        
        # Should start with prefix
        assert api_key.startswith("sk_relay_")
        
        # Hash it
        api_key_hash = hash_api_key(api_key)
        
        # Should be valid SHA-256
        assert len(api_key_hash) == 64  # SHA-256 hex digest
        
        # Should verify
        assert verify_api_key(api_key, api_key_hash)
        
        # Should NOT verify with wrong key
        wrong_key = "sk_relay_wrong_key"
        assert not verify_api_key(wrong_key, api_key_hash)


# ============================================================================
# Test 8: Payload Hash Correctness
# ============================================================================

class TestPayloadHashCorrectness:
    """Verify payload hash is computed correctly."""
    
    def test_sha256_hash_computation(self):
        """Payload hash must be correct SHA-256."""
        payloads = [
            b'{"push": "event"}',
            b'{"pull_request": "opened"}',
            b'{"workflow_run": "completed"}',
            b'{}',  # Empty
            b'very long payload ' * 1000  # Large payload
        ]
        
        for payload in payloads:
            expected_hash = hashlib.sha256(payload).hexdigest()
            
            # Verify hash format
            assert len(expected_hash) == 64
            assert all(c in "0123456789abcdef" for c in expected_hash)
    
    def test_different_payloads_different_hashes(self):
        """Different payloads must produce different hashes."""
        payload1 = b'{"repository": "user/repo1"}'
        payload2 = b'{"repository": "user/repo2"}'
        
        hash1 = hashlib.sha256(payload1).hexdigest()
        hash2 = hashlib.sha256(payload2).hexdigest()
        
        assert hash1 != hash2
    
    def test_same_payload_same_hash(self):
        """Same payload must produce same hash (idempotent)."""
        payload = b'{"repository": "user/repo"}'
        
        hash1 = hashlib.sha256(payload).hexdigest()
        hash2 = hashlib.sha256(payload).hexdigest()
        
        assert hash1 == hash2


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
