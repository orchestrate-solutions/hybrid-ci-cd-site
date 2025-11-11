"""
RED PHASE TESTS: GitHub Webhook Integration

These tests define GitHub-specific webhook behavior:
- HMAC-SHA256 signature verification
- Event type extraction from headers
- Field mapping using JSONPath expressions
- Full end-to-end flow

All tests MUST FAIL before implementation.
This validates that UniversalWebhookAdapter works with GitHub payloads.
"""

import pytest
import json
import hmac
import hashlib
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch
import os

try:
    from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
    from backend.src.services.webhook_config_loader import WebhookConfigLoader
    from backend.src.models.webhook import WebhookEvent
except ImportError:
    UniversalWebhookAdapter = None
    WebhookConfigLoader = None
    WebhookEvent = None


# ============================================================================
# FIXTURES: GitHub-specific test data
# ============================================================================

@pytest.fixture
def schemas_dir():
    """Path to schemas directory"""
    return Path(__file__).parent.parent.parent.parent / "schemas"


@pytest.fixture
def tools_dir():
    """Path to tools configs directory"""
    return Path(__file__).parent.parent.parent.parent / "config" / "webhooks" / "tools"


@pytest.fixture
def schema_path(schemas_dir):
    """Path to JSON schema"""
    return schemas_dir / "webhook-config.schema.json"


@pytest.fixture
def github_config_loader(schema_path, tools_dir):
    """GitHub config loader"""
    return WebhookConfigLoader(
        schema_path=str(schema_path),
        tools_dir=str(tools_dir),
        private_tools_dir=str(tools_dir.parent / "tools-private")
    )


@pytest.fixture
def github_push_payload():
    """
    Real-world GitHub push webhook payload.
    
    From: https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
    """
    return {
        "ref": "refs/heads/main",
        "before": "9049503f3fcc2100cd82b4c5273cd665beaae9d1",
        "after": "abc123def456789",
        "repository": {
            "id": 186853002,
            "name": "hybrid-ci-cd-site",
            "full_name": "orchestrate-solutions/hybrid-ci-cd-site",
            "private": False,
            "owner": {
                "name": "orchestrate-solutions",
                "email": None
            },
            "html_url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site",
            "description": "Federated DevOps orchestration platform",
            "fork": False,
            "created_at": 1633564800,
            "updated_at": 1668076800,
            "pushed_at": 1731232800,
            "size": 2048,
            "language": "TypeScript"
        },
        "pusher": {
            "name": "john-doe",
            "email": "john@example.com"
        },
        "sender": {
            "login": "john-doe",
            "id": 12345678,
            "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
            "type": "User"
        },
        "head_commit": {
            "id": "abc123def456789",
            "tree_id": "tree123",
            "distinct": True,
            "message": "feat: add webhook support\n\nAdd config-driven webhook adapter for multiple DevOps tools",
            "timestamp": "2025-11-10T10:00:00Z",
            "url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/commit/abc123def456789",
            "author": {
                "name": "John Doe",
                "email": "john@example.com",
                "username": "john-doe"
            },
            "committer": {
                "name": "John Doe",
                "email": "john@example.com",
                "username": "john-doe"
            },
            "added": ["backend/src/webhook_adapter.py"],
            "removed": [],
            "modified": ["backend/src/models/webhook.py"]
        },
        "commits": [
            {
                "id": "abc123def456789",
                "tree_id": "tree123",
                "distinct": True,
                "message": "feat: add webhook support",
                "timestamp": "2025-11-10T10:00:00Z",
                "url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/commit/abc123def456789",
                "author": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "username": "john-doe"
                }
            }
        ],
        "created": False,
        "deleted": False,
        "forced": False,
        "compare": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/compare/9049503f3fcc2...abc123def456789"
    }


@pytest.fixture
def github_pr_payload():
    """
    Real-world GitHub pull request webhook payload.
    
    From: https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
    """
    return {
        "action": "opened",
        "pull_request": {
            "id": 987654321,
            "number": 42,
            "state": "open",
            "title": "Add GitHub webhook support",
            "body": "This PR adds GitHub webhook integration with config-driven adapter",
            "head": {
                "ref": "feature/webhooks",
                "sha": "feature_sha_12345",
                "repo": {
                    "id": 186853002,
                    "name": "hybrid-ci-cd-site",
                    "full_name": "orchestrate-solutions/hybrid-ci-cd-site",
                    "private": False,
                    "html_url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site"
                }
            },
            "base": {
                "ref": "main",
                "sha": "base_sha_67890",
                "repo": {
                    "id": 186853002,
                    "name": "hybrid-ci-cd-site",
                    "full_name": "orchestrate-solutions/hybrid-ci-cd-site"
                }
            },
            "user": {
                "login": "john-doe",
                "id": 12345678,
                "type": "User"
            },
            "created_at": "2025-11-10T10:00:00Z",
            "updated_at": "2025-11-10T10:30:00Z",
            "html_url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/pull/42"
        },
        "repository": {
            "id": 186853002,
            "name": "hybrid-ci-cd-site",
            "full_name": "orchestrate-solutions/hybrid-ci-cd-site",
            "private": False
        },
        "sender": {
            "login": "john-doe",
            "id": 12345678
        }
    }


@pytest.fixture
def github_push_headers(github_push_payload):
    """
    GitHub webhook headers with valid HMAC-SHA256 signature.
    
    GitHub sends: X-Hub-Signature-256: sha256=<hex>
    """
    secret = "test-webhook-secret"
    payload_json = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True)
    payload_bytes = payload_json.encode()
    
    signature = "sha256=" + hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-GitHub-Event": "push",
        "X-Hub-Signature-256": signature,
        "X-GitHub-Delivery": "12345678-1234-1234-1234-123456789012",
        "Content-Type": "application/json",
        "User-Agent": "GitHub-Hookshot/abc123"
    }


@pytest.fixture
def github_pr_headers(github_pr_payload):
    """GitHub webhook headers for PR event"""
    secret = "test-webhook-secret"
    payload_json = json.dumps(github_pr_payload, separators=(',', ':'), sort_keys=True)
    payload_bytes = payload_json.encode()
    
    signature = "sha256=" + hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": signature,
        "X-GitHub-Delivery": "12345678-1234-1234-1234-123456789012",
        "Content-Type": "application/json"
    }


# ============================================================================
# TEST GROUP 1: Load GitHub Config
# ============================================================================

@pytest.mark.asyncio
class TestGitHubConfigLoading:
    """Load and validate GitHub tool config"""
    
    async def test_load_github_config(self, github_config_loader):
        """Load GitHub tool config from YAML"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        
        assert config["metadata"]["id"] == "github"
        assert config["metadata"]["name"] == "GitHub / GitHub Actions"
        assert config["integration"]["webhooks"]["enabled"] is True
    
    async def test_github_config_has_push_event(self, github_config_loader):
        """GitHub config defines push event mapping"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        
        assert "push" in config["integration"]["webhooks"]["events"]
        push_event = config["integration"]["webhooks"]["events"]["push"]
        assert push_event["http_event_header"] == "X-GitHub-Event"
        assert push_event["header_value"] == "push"
        assert "data_mapping" in push_event
    
    async def test_github_config_has_pr_event(self, github_config_loader):
        """GitHub config defines pull_request event mapping"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        
        assert "pull_request" in config["integration"]["webhooks"]["events"]
    
    async def test_github_config_hmac_verification(self, github_config_loader):
        """GitHub config uses HMAC-SHA256 verification"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        
        verification = config["integration"]["webhooks"]["verification"]
        assert verification["method"] == "hmac-sha256"
        assert verification["header"] == "X-Hub-Signature-256"
        assert verification["secret_env_var"] == "GITHUB_WEBHOOK_SECRET"


# ============================================================================
# TEST GROUP 2: HMAC Signature Verification
# ============================================================================

@pytest.mark.asyncio
class TestGitHubSignatureVerification:
    """Verify HMAC-SHA256 signatures for GitHub webhooks"""
    
    async def test_github_verifies_valid_signature(self, github_config_loader, github_push_payload, github_push_headers):
        """Adapter verifies valid HMAC-SHA256 signature"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        payload = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            result = await adapter._verify_signature(payload, github_push_headers)
            assert result is True
    
    async def test_github_rejects_invalid_signature(self, github_config_loader, github_push_payload):
        """Adapter rejects invalid signature"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        payload = json.dumps(github_push_payload).encode()
        
        headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": "sha256=invalid"
        }
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            result = await adapter._verify_signature(payload, headers)
            assert result is False
    
    async def test_github_rejects_wrong_secret(self, github_config_loader, github_push_payload, github_push_headers):
        """Adapter rejects signature with wrong secret"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        payload = json.dumps(github_push_payload).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'wrong-secret'}):
            result = await adapter._verify_signature(payload, github_push_headers)
            assert result is False


# ============================================================================
# TEST GROUP 3: Event Type Extraction
# ============================================================================

@pytest.mark.asyncio
class TestGitHubEventTypeExtraction:
    """Extract event type from GitHub webhook headers"""
    
    async def test_extract_push_event_type(self, github_config_loader, github_push_payload):
        """Extract 'push' event type from headers"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-GitHub-Event": "push"}
        event_type = await adapter._extract_event_type(github_push_payload, headers)
        
        assert event_type == "push"
    
    async def test_extract_pr_event_type(self, github_config_loader, github_pr_payload):
        """Extract 'pull_request' event type from headers"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-GitHub-Event": "pull_request"}
        event_type = await adapter._extract_event_type(github_pr_payload, headers)
        
        assert event_type == "pull_request"
    
    async def test_unknown_event_type_returns_none(self, github_config_loader, github_push_payload):
        """Unknown event type returns None"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-GitHub-Event": "unknown"}
        event_type = await adapter._extract_event_type(github_push_payload, headers)
        
        assert event_type is None


# ============================================================================
# TEST GROUP 4: Field Extraction
# ============================================================================

@pytest.mark.asyncio
class TestGitHubFieldExtraction:
    """Extract fields from GitHub payloads using JSONPath"""
    
    async def test_extract_push_fields(self, github_config_loader, github_push_payload):
        """Extract fields from push event"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        fields = await adapter._extract_fields(github_push_payload, "push")
        
        assert fields["repository"] == "orchestrate-solutions/hybrid-ci-cd-site"
        assert fields["branch"] == "refs/heads/main"
        assert fields["commit_sha"] == "abc123def456789"
        assert fields["author"] == "john-doe"
        assert "feat: add webhook support" in fields["commit_message"]
    
    async def test_extract_pr_fields(self, github_config_loader, github_pr_payload):
        """Extract fields from pull_request event"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        fields = await adapter._extract_fields(github_pr_payload, "pull_request")
        
        assert fields["repository"] == "orchestrate-solutions/hybrid-ci-cd-site"
        assert fields["branch"] == "feature/webhooks"
        assert fields["action"] == "opened"
        assert fields["pr_number"] == 42
        assert fields["author"] == "john-doe"
    
    async def test_missing_fields_are_none(self, github_config_loader):
        """Missing optional fields are set to None"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        minimal_payload = {
            "repository": {"full_name": "org/repo"},
            "ref": "refs/heads/main"
        }
        
        fields = await adapter._extract_fields(minimal_payload, "push")
        
        # Required fields extracted
        assert fields["repository"] == "org/repo"
        assert fields["branch"] == "refs/heads/main"
        # Missing optional fields are None
        assert fields["commit_sha"] is None
        assert fields["author"] is None


# ============================================================================
# TEST GROUP 5: Full Webhook Parse Flow
# ============================================================================

@pytest.mark.asyncio
class TestGitHubFullFlow:
    """Full GitHub webhook parse flow"""
    
    async def test_parse_push_event(self, github_config_loader, github_push_payload, github_push_headers):
        """Full flow: verify → extract → normalize (push)"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            webhook_event = await adapter.parse(payload, github_push_headers)
            
            # Check structure
            assert webhook_event['event_id']  # UUID generated
            assert webhook_event['tool'] == 'github'
            assert webhook_event['event_type'] == 'push'
            assert isinstance(webhook_event['timestamp'], datetime)
            
            # Check metadata
            assert webhook_event['metadata']['repository'] == 'orchestrate-solutions/hybrid-ci-cd-site'
            assert webhook_event['metadata']['branch'] == 'refs/heads/main'
            assert webhook_event['metadata']['commit_sha'] == 'abc123def456789'
            assert webhook_event['metadata']['author'] == 'john-doe'
            
            # Check payload is stored
            assert webhook_event['payload'] == github_push_payload
    
    async def test_parse_pr_event(self, github_config_loader, github_pr_payload, github_pr_headers):
        """Full flow: verify → extract → normalize (PR)"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload = json.dumps(github_pr_payload, separators=(',', ':'), sort_keys=True).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            webhook_event = await adapter.parse(payload, github_pr_headers)
            
            assert webhook_event['tool'] == 'github'
            assert webhook_event['event_type'] == 'pull_request'
            assert webhook_event['metadata']['pr_number'] == 42
            assert webhook_event['metadata']['action'] == 'opened'


# ============================================================================
# TEST GROUP 6: Error Handling
# ============================================================================

@pytest.mark.asyncio
class TestGitHubErrorHandling:
    """GitHub webhook error handling"""
    
    async def test_invalid_signature_raises_error(self, github_config_loader, github_push_payload):
        """Invalid signature raises ValueError"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload = json.dumps(github_push_payload).encode()
        headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": "sha256=invalid"
        }
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            with pytest.raises(ValueError, match="Invalid webhook signature"):
                await adapter.parse(payload, headers)
    
    async def test_malformed_json_raises_error(self, github_config_loader):
        """Malformed JSON raises ValueError"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload = b"not json}"
        headers = {"X-GitHub-Event": "push"}
        
        with pytest.raises(ValueError, match="Malformed JSON"):
            await adapter.parse(payload, headers)
    
    async def test_unknown_event_type_raises_error(self, github_config_loader, github_push_payload):
        """Unknown event type raises ValueError"""
        pytest.skip("RED PHASE: Testing implementation")
        
        config = await github_config_loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload = json.dumps(github_push_payload).encode()
        headers = {"X-GitHub-Event": "unknown_event"}
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            # Signature might pass, but event type determination should fail
            with pytest.raises(ValueError, match="Could not determine event type"):
                await adapter.parse(payload, headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
