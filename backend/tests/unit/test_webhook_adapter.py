"""
RED PHASE TESTS: Foundation webhook components.

These tests define the contract for:
- WebhookConfigLoader: Load & validate tool configs
- UniversalWebhookAdapter: Parse payloads using config-driven behavior
- Error handling: Clear error messages for debugging

All tests MUST FAIL before implementation starts.
This is TDD: RED → GREEN → REFACTOR workflow.
"""

import pytest
import json
import hmac
import hashlib
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

# These imports will fail initially - that's expected in RED phase
try:
    from backend.src.services.webhook_config_loader import WebhookConfigLoader
    from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
    from backend.src.models.webhook import WebhookEvent
except ImportError:
    # In RED phase, classes don't exist yet
    WebhookConfigLoader = None
    UniversalWebhookAdapter = None
    WebhookEvent = None


# ============================================================================
# FIXTURES: Test data
# ============================================================================

@pytest.fixture
def schemas_dir():
    """Path to schemas directory"""
    return Path(__file__).parent.parent.parent.parent / "schemas"


@pytest.fixture
def tools_dir(tmp_path):
    """Temporary directory for tool configs"""
    return tmp_path / "tools"


@pytest.fixture
def private_tools_dir(tmp_path):
    """Temporary directory for private tool configs"""
    private = tmp_path / "tools-private"
    private.mkdir()
    return private


@pytest.fixture
def schema_path(schemas_dir):
    """Path to JSON schema"""
    return schemas_dir / "webhook-config.schema.json"


@pytest.fixture
def github_config_dict():
    """Sample GitHub tool config"""
    return {
        "version": "1.0.0",
        "type": "tool",
        "metadata": {
            "id": "github",
            "name": "GitHub / GitHub Actions",
            "category": "version-control",
            "description": "GitHub webhooks"
        },
        "integration": {
            "webhooks": {
                "enabled": True,
                "endpoint": "/api/webhooks/github",
                "verification": {
                    "method": "hmac-sha256",
                    "header": "X-Hub-Signature-256",
                    "secret_env_var": "GITHUB_WEBHOOK_SECRET"
                },
                "events": {
                    "push": {
                        "http_event_header": "X-GitHub-Event",
                        "header_value": "push",
                        "data_mapping": {
                            "event_type": "push",
                            "repository": "$.repository.full_name",
                            "branch": "$.ref",
                            "commit_sha": "$.head_commit.id",
                            "commit_message": "$.head_commit.message",
                            "author": "$.pusher.name",
                            "source_url": "$.head_commit.url"
                        }
                    }
                }
            }
        },
        "features": {
            "auto_job_creation": True
        },
        "contribution": {
            "author": "test",
            "license": "MIT"
        }
    }


@pytest.fixture
def github_push_payload():
    """Sample GitHub push webhook payload"""
    return {
        "repository": {
            "full_name": "orchestrate-solutions/hybrid-ci-cd-site"
        },
        "ref": "refs/heads/main",
        "head_commit": {
            "id": "abc123def456",
            "message": "feat: add webhook support",
            "url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/commit/abc123",
            "timestamp": "2025-11-10T10:00:00Z"
        },
        "pusher": {
            "name": "john-doe"
        }
    }


@pytest.fixture
def github_push_headers(github_push_payload):
    """GitHub webhook headers with valid HMAC signature"""
    secret = "test-webhook-secret"
    payload_json = json.dumps(github_push_payload)
    payload_bytes = payload_json.encode()
    
    signature = "sha256=" + hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-GitHub-Event": "push",
        "X-Hub-Signature-256": signature,
        "Content-Type": "application/json"
    }


# ============================================================================
# TEST GROUP 1: Config Loading
# ============================================================================

@pytest.mark.asyncio
class TestConfigLoader:
    """WebhookConfigLoader tests"""
    
    async def test_loader_loads_yaml_config(self, schema_path, tools_dir, github_config_dict):
        """ConfigLoader loads YAML config from tools directory"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        # Create YAML file
        import yaml
        config_file = tools_dir / "github.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(github_config_dict, f)
        
        # Load it
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(tools_dir)
        )
        config = await loader.load_config("github")
        
        assert config["metadata"]["id"] == "github"
        assert config["integration"]["webhooks"]["enabled"] is True
    
    async def test_loader_validates_against_schema(self, schema_path, tools_dir):
        """ConfigLoader validates config against JSON schema"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        # Invalid config (missing required field)
        invalid_config = {"version": "1.0.0"}
        
        import yaml
        config_file = tools_dir / "invalid.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(invalid_config, f)
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(tools_dir)
        )
        
        with pytest.raises(ValueError, match="Invalid webhook config"):
            await loader.load_config("invalid")
    
    async def test_loader_checks_private_directory(self, schema_path, tools_dir, private_tools_dir, github_config_dict):
        """ConfigLoader checks private tools directory if not in public"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        import yaml
        config_file = private_tools_dir / "github.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(github_config_dict, f)
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(private_tools_dir)
        )
        config = await loader.load_config("github")
        
        assert config["metadata"]["id"] == "github"
    
    async def test_loader_returns_file_not_found_error(self, schema_path, tools_dir):
        """ConfigLoader returns FileNotFoundError for missing config"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(tools_dir)
        )
        
        with pytest.raises(FileNotFoundError, match="Tool config not found"):
            await loader.load_config("nonexistent")
    
    async def test_loader_lists_available_tools(self, schema_path, tools_dir, github_config_dict):
        """ConfigLoader lists all available tools"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        import yaml
        
        # Create two tool configs
        for tool_id in ["github", "jenkins"]:
            config = github_config_dict.copy()
            config["metadata"]["id"] = tool_id
            config_file = tools_dir / f"{tool_id}.yaml"
            with open(config_file, 'w') as f:
                yaml.dump(config, f)
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(tools_dir)
        )
        tools = await loader.list_tools()
        
        assert "github" in tools
        assert "jenkins" in tools


# ============================================================================
# TEST GROUP 2: Signature Verification
# ============================================================================

@pytest.mark.asyncio
class TestWebhookSignatureVerification:
    """Signature verification tests"""
    
    async def test_adapter_verifies_hmac_sha256_signature(self, github_config_dict, github_push_payload):
        """Adapter verifies HMAC-SHA256 signature"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        payload = json.dumps(github_push_payload).encode()
        
        secret = "test-webhook-secret"
        signature = "sha256=" + hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': secret}):
            headers = {
                "X-GitHub-Event": "push",
                "X-Hub-Signature-256": signature
            }
            
            # Should not raise - signature is valid
            result = await adapter._verify_signature(payload, headers)
            assert result is True
    
    async def test_adapter_rejects_invalid_hmac_signature(self, github_config_dict, github_push_payload):
        """Adapter rejects invalid HMAC-SHA256 signature"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        payload = json.dumps(github_push_payload).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'correct-secret'}):
            headers = {
                "X-GitHub-Event": "push",
                "X-Hub-Signature-256": "sha256=invalid"
            }
            
            result = await adapter._verify_signature(payload, headers)
            assert result is False
    
    async def test_adapter_verifies_token(self, github_config_dict):
        """Adapter verifies token verification method"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        config = github_config_dict.copy()
        config['integration']['webhooks']['verification']['method'] = 'token'
        config['integration']['webhooks']['verification']['header'] = 'X-Token'
        
        adapter = UniversalWebhookAdapter(config)
        payload = b'{}' 
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'secret-token'}):
            headers = {"X-Token": "secret-token"}
            result = await adapter._verify_signature(payload, headers)
            assert result is True


# ============================================================================
# TEST GROUP 3: Event Type Extraction
# ============================================================================

@pytest.mark.asyncio
class TestEventTypeExtraction:
    """Event type extraction tests"""
    
    async def test_adapter_extracts_push_event_type(self, github_config_dict, github_push_payload):
        """Adapter extracts 'push' event type from headers"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        headers = {"X-GitHub-Event": "push"}
        
        event_type = await adapter._extract_event_type(github_push_payload, headers)
        assert event_type == "push"
    
    async def test_adapter_returns_none_for_unknown_event_type(self, github_config_dict, github_push_payload):
        """Adapter returns None for unknown event type"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        headers = {"X-GitHub-Event": "unknown"}
        
        event_type = await adapter._extract_event_type(github_push_payload, headers)
        assert event_type is None


# ============================================================================
# TEST GROUP 4: Field Extraction (JSONPath)
# ============================================================================

@pytest.mark.asyncio
class TestFieldExtraction:
    """Field extraction using JSONPath expressions"""
    
    async def test_adapter_extracts_fields_using_jsonpath(self, github_config_dict, github_push_payload):
        """Adapter extracts fields using data_mapping JSONPath expressions"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        fields = await adapter._extract_fields(github_push_payload, "push")
        
        assert fields["repository"] == "orchestrate-solutions/hybrid-ci-cd-site"
        assert fields["branch"] == "refs/heads/main"
        assert fields["commit_sha"] == "abc123def456"
        assert fields["author"] == "john-doe"
    
    async def test_adapter_handles_missing_fields(self, github_config_dict):
        """Adapter handles missing fields gracefully"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        incomplete_payload = {"repository": {"full_name": "org/repo"}}
        
        # Should not crash, should set missing fields to None
        fields = await adapter._extract_fields(incomplete_payload, "push")
        assert fields["repository"] == "org/repo"
        assert fields["branch"] is None


# ============================================================================
# TEST GROUP 5: Payload Normalization
# ============================================================================

@pytest.mark.asyncio
class TestPayloadNormalization:
    """Webhook payload normalization to WebhookEvent"""
    
    async def test_adapter_normalizes_to_webhook_event(self, github_config_dict, github_push_payload, github_push_headers):
        """Adapter normalizes payload to WebhookEvent format"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        payload = json.dumps(github_push_payload).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            webhook_event = await adapter.parse(payload, github_push_headers)
            
            # Verify structure
            assert webhook_event['event_id']  # UUID generated
            assert webhook_event['tool'] == 'github'
            assert webhook_event['event_type'] == 'push'
            assert isinstance(webhook_event['timestamp'], datetime)
            assert webhook_event['metadata']['repository'] == 'orchestrate-solutions/hybrid-ci-cd-site'
            assert webhook_event['payload'] == github_push_payload


# ============================================================================
# TEST GROUP 6: Error Handling
# ============================================================================

@pytest.mark.asyncio
class TestErrorHandling:
    """Error handling and edge cases"""
    
    async def test_adapter_handles_malformed_json(self, github_config_dict):
        """Adapter handles malformed JSON payload"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        malformed_payload = b"not json}"
        headers = {"X-GitHub-Event": "push"}
        
        with pytest.raises(ValueError, match="Malformed JSON"):
            await adapter.parse(malformed_payload, headers)
    
    async def test_adapter_raises_on_invalid_signature(self, github_config_dict, github_push_payload):
        """Adapter raises ValueError for invalid signature"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        payload = json.dumps(github_push_payload).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'wrong-secret'}):
            headers = {
                "X-GitHub-Event": "push",
                "X-Hub-Signature-256": "sha256=invalid"
            }
            
            with pytest.raises(ValueError, match="Invalid webhook signature"):
                await adapter.parse(payload, headers)
    
    async def test_adapter_raises_on_unknown_event_type(self, github_config_dict, github_push_payload):
        """Adapter raises ValueError when event type cannot be determined"""
        pytest.skip("RED PHASE: Waiting for UniversalWebhookAdapter implementation")
        
        adapter = UniversalWebhookAdapter(github_config_dict)
        payload = json.dumps(github_push_payload).encode()
        headers = {"X-GitHub-Event": "unknown"}
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            # Without proper signature verification setup, should still fail on unknown event
            with pytest.raises(ValueError, match="Could not determine event type"):
                await adapter.parse(payload, headers)


# ============================================================================
# TEST GROUP 7: Config Validation
# ============================================================================

@pytest.mark.asyncio
class TestConfigValidation:
    """Config validation tests"""
    
    async def test_validator_accepts_valid_config(self, schema_path, github_config_dict):
        """Validator accepts valid config"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir="/tmp",
            private_tools_dir="/tmp"
        )
        
        # Should not raise
        loader.validate_config(github_config_dict)
    
    async def test_validator_rejects_missing_required_fields(self, schema_path):
        """Validator rejects config missing required fields"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        invalid_config = {"version": "1.0.0"}
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir="/tmp",
            private_tools_dir="/tmp"
        )
        
        with pytest.raises(ValueError, match="Invalid webhook config"):
            loader.validate_config(invalid_config)
    
    async def test_validator_rejects_invalid_id_format(self, schema_path, github_config_dict):
        """Validator rejects invalid tool ID format"""
        pytest.skip("RED PHASE: Waiting for WebhookConfigLoader implementation")
        
        config = github_config_dict.copy()
        config['metadata']['id'] = 'Invalid_ID'  # Uppercase not allowed
        
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir="/tmp",
            private_tools_dir="/tmp"
        )
        
        with pytest.raises(ValueError):
            loader.validate_config(config)


# ============================================================================
# TEST GROUP 8: Integration
# ============================================================================

@pytest.mark.asyncio
class TestIntegration:
    """End-to-end integration tests"""
    
    async def test_full_webhook_parse_flow(self, schema_path, tools_dir, github_config_dict, github_push_payload, github_push_headers):
        """Full flow: load config → verify → parse → normalize"""
        pytest.skip("RED PHASE: Waiting for implementation")
        
        import yaml
        
        # Write config to file
        config_file = tools_dir / "github.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(github_config_dict, f)
        
        # Load via loader
        loader = WebhookConfigLoader(
            schema_path=str(schema_path),
            tools_dir=str(tools_dir),
            private_tools_dir=str(tools_dir)
        )
        config = await loader.load_config("github")
        
        # Parse via adapter
        adapter = UniversalWebhookAdapter(config)
        payload = json.dumps(github_push_payload).encode()
        
        with patch.dict('os.environ', {'GITHUB_WEBHOOK_SECRET': 'test-webhook-secret'}):
            webhook_event = await adapter.parse(payload, github_push_headers)
            
            # Verify complete flow
            assert webhook_event['tool'] == 'github'
            assert webhook_event['event_type'] == 'push'
            assert webhook_event['metadata']['repository'] == 'orchestrate-solutions/hybrid-ci-cd-site'


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
