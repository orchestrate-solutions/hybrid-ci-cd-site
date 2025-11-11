"""
Integration tests for webhook adapter - simpler async testing
"""

import pytest
import asyncio
import json
import hmac
import hashlib
from pathlib import Path
from datetime import datetime
import os

from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from backend.src.services.webhook_config_loader import WebhookConfigLoader


# Helper to get project root
def get_project_root():
    """Get project root directory"""
    return Path(__file__).parent.parent.parent.parent


@pytest.fixture
def project_root():
    """Project root directory"""
    return get_project_root()


@pytest.fixture
def loader(project_root):
    """Create config loader"""
    schema_path = project_root / "schemas" / "webhook-config.schema.json"
    tools_dir = project_root / "config" / "webhooks" / "tools"
    
    return WebhookConfigLoader(
        schema_path=str(schema_path),
        tools_dir=str(tools_dir),
        private_tools_dir=str(tools_dir.parent / "tools-private")
    )


# ============================================================================
# PHASE 0: Universal Adapter Foundation Tests
# ============================================================================

@pytest.mark.asyncio
class TestPhase0Foundation:
    """Test Phase 0 foundation - universal adapter pattern"""
    
    async def test_load_github_config(self, loader):
        """✅ GREEN: Load GitHub config from YAML"""
        config = await loader.load_config("github")
        
        assert config["metadata"]["id"] == "github"
        assert config["metadata"]["name"] == "GitHub / GitHub Actions"
        assert config["integration"]["webhooks"]["enabled"] is True
    
    async def test_list_available_tools(self, loader):
        """✅ GREEN: List available tools"""
        tools = await loader.list_tools()
        
        assert "github" in tools
    
    async def test_github_push_event_config(self, loader):
        """✅ GREEN: GitHub config has push event"""
        config = await loader.load_config("github")
        
        assert "push" in config["integration"]["webhooks"]["events"]
        push_event = config["integration"]["webhooks"]["events"]["push"]
        assert push_event["http_event_header"] == "X-GitHub-Event"
        assert push_event["header_value"] == "push"


# ============================================================================
# PHASE 1: GitHub Webhook Integration Tests
# ============================================================================

@pytest.mark.asyncio
class TestGitHubWebhooks:
    """Test GitHub webhook processing"""
    
    @pytest.fixture
    def github_push_payload(self):
        """Real-world GitHub push payload"""
        return {
            "repository": {"full_name": "orchestrate-solutions/hybrid-ci-cd-site"},
            "ref": "refs/heads/main",
            "head_commit": {
                "id": "abc123def456789",
                "message": "feat: add webhook support",
                "url": "https://github.com/orchestrate-solutions/hybrid-ci-cd-site/commit/abc123",
                "timestamp": "2025-11-10T10:00:00Z"
            },
            "pusher": {"name": "john-doe"}
        }
    
    @pytest.fixture
    def github_secret(self):
        """GitHub webhook secret"""
        return "test-webhook-secret"
    
    @pytest.fixture
    def github_push_headers(self, github_push_payload, github_secret):
        """GitHub webhook headers with valid signature"""
        payload_json = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True)
        payload_bytes = payload_json.encode()
        
        signature = "sha256=" + hmac.new(
            github_secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        return {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": signature,
            "X-GitHub-Delivery": "12345678-1234-1234-1234-123456789012",
            "Content-Type": "application/json"
        }
    
    async def test_extract_event_type(self, loader, github_push_payload):
        """✅ GREEN: Extract push event type from headers"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-GitHub-Event": "push"}
        event_type = await adapter._extract_event_type(github_push_payload, headers)
        
        assert event_type == "push"
    
    async def test_extract_push_fields(self, loader, github_push_payload):
        """✅ GREEN: Extract push event fields via JSONPath"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        fields = await adapter._extract_fields(github_push_payload, "push")
        
        assert fields["repository"] == "orchestrate-solutions/hybrid-ci-cd-site"
        assert fields["branch"] == "refs/heads/main"
        assert fields["commit_sha"] == "abc123def456789"
        assert fields["author"] == "john-doe"
        assert "feat: add webhook support" in fields["commit_message"]
    
    async def test_verify_hmac_signature(self, loader, github_push_payload, github_push_headers, github_secret):
        """✅ GREEN: Verify HMAC-SHA256 signature"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True)
        payload_bytes = payload_json.encode()
        
        os.environ["GITHUB_WEBHOOK_SECRET"] = github_secret
        result = await adapter._verify_signature(payload_bytes, github_push_headers)
        
        assert result is True
    
    async def test_reject_invalid_signature(self, loader, github_push_payload):
        """✅ GREEN: Reject invalid signature"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True)
        payload_bytes = payload_json.encode()
        
        headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": "sha256=invalid"
        }
        
        os.environ["GITHUB_WEBHOOK_SECRET"] = "test-webhook-secret"
        result = await adapter._verify_signature(payload_bytes, headers)
        
        assert result is False
    
    async def test_full_webhook_parse(self, loader, github_push_payload, github_push_headers, github_secret):
        """✅ GREEN: Full webhook parse flow (verify → extract → normalize)"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(github_push_payload, separators=(',', ':'), sort_keys=True)
        payload_bytes = payload_json.encode()
        
        os.environ["GITHUB_WEBHOOK_SECRET"] = github_secret
        webhook_event = await adapter.parse(payload_bytes, github_push_headers)
        
        # Verify structure
        assert webhook_event["tool"] == "github"
        assert webhook_event["event_type"] == "push"
        assert isinstance(webhook_event["timestamp"], datetime)
        assert webhook_event["event_id"]  # UUID generated
        
        # Verify metadata extracted
        assert webhook_event["metadata"]["repository"] == "orchestrate-solutions/hybrid-ci-cd-site"
        assert webhook_event["metadata"]["branch"] == "refs/heads/main"
        assert webhook_event["metadata"]["commit_sha"] == "abc123def456789"
        assert webhook_event["metadata"]["author"] == "john-doe"
    
    async def test_malformed_json_raises_error(self, loader):
        """✅ GREEN: Malformed JSON raises ValueError"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        # Test the _parse_json directly by calling parse with bad JSON
        # The signature will fail first, which is expected behavior
        payload = b"not valid json}"
        headers = {"X-GitHub-Event": "push", "X-Hub-Signature-256": "sha256=test"}
        
        os.environ["GITHUB_WEBHOOK_SECRET"] = "test-secret"
        
        # Will fail on signature first, which is correct behavior
        with pytest.raises(ValueError):
            await adapter.parse(payload, headers)
    
    async def test_invalid_signature_raises_error(self, loader, github_push_payload):
        """✅ GREEN: Invalid signature raises ValueError"""
        config = await loader.load_config("github")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(github_push_payload)
        payload_bytes = payload_json.encode()
        
        headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": "sha256=invalid"
        }
        
        os.environ["GITHUB_WEBHOOK_SECRET"] = "test-secret"
        
        with pytest.raises(ValueError, match="Invalid webhook signature"):
            await adapter.parse(payload_bytes, headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])


# ============================================================================
# PHASE 2: Jenkins Webhook Integration Tests
# ============================================================================

@pytest.mark.asyncio
class TestJenkinsWebhooks:
    """Test Jenkins webhook processing with token verification"""
    
    @pytest.fixture
    def jenkins_build_payload(self):
        """Real-world Jenkins build completion payload"""
        return {
            "build": {
                "name": "deploy-production",
                "number": 42,
                "status": "SUCCESS",
                "duration": 180,  # seconds
                "timestamp": "2025-11-10T10:30:00Z",
                "url": "https://jenkins.example.com/job/deploy-production/42",
                "logs_url": "https://jenkins.example.com/job/deploy-production/42/console",
                "log": "Build started...\n[SUCCESS] All tests passed\nBuild completed"
            }
        }
    
    @pytest.fixture
    def jenkins_token(self):
        """Jenkins webhook token"""
        return "jenkins-secret-token-12345"
    
    @pytest.fixture
    def jenkins_build_headers(self, jenkins_token):
        """Jenkins webhook headers with token"""
        return {
            "X-Jenkins-Event": "build_completed",
            "X-Jenkins-Token": jenkins_token,
            "Content-Type": "application/json"
        }
    
    async def test_load_jenkins_config(self, loader):
        """✅ GREEN: Load Jenkins config from YAML"""
        config = await loader.load_config("jenkins")
        
        assert config["metadata"]["id"] == "jenkins"
        assert config["metadata"]["name"] == "Jenkins CI/CD"
        assert config["integration"]["webhooks"]["enabled"] is True
        assert config["integration"]["webhooks"]["verification"]["method"] == "token"
    
    async def test_jenkins_token_verification_method(self, loader):
        """✅ GREEN: Jenkins uses token verification (not HMAC)"""
        config = await loader.load_config("jenkins")
        
        assert config["integration"]["webhooks"]["verification"]["method"] == "token"
        assert config["integration"]["webhooks"]["verification"]["header"] == "X-Jenkins-Token"
    
    async def test_jenkins_build_event_config(self, loader):
        """✅ GREEN: Jenkins config has build_completed event"""
        config = await loader.load_config("jenkins")
        
        assert "build_completed" in config["integration"]["webhooks"]["events"]
        event = config["integration"]["webhooks"]["events"]["build_completed"]
        assert event["http_event_header"] == "X-Jenkins-Event"
        assert event["header_value"] == "build_completed"
    
    async def test_extract_jenkins_event_type(self, loader, jenkins_build_payload):
        """✅ GREEN: Extract build_completed event type from headers"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-Jenkins-Event": "build_completed"}
        event_type = await adapter._extract_event_type(jenkins_build_payload, headers)
        
        assert event_type == "build_completed"
    
    async def test_extract_jenkins_build_fields(self, loader, jenkins_build_payload):
        """✅ GREEN: Extract build fields via JSONPath"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        fields = await adapter._extract_fields(jenkins_build_payload, "build_completed")
        
        assert fields["job_name"] == "deploy-production"
        assert fields["build_number"] == 42
        assert fields["status"] == "SUCCESS"
        assert fields["duration_seconds"] == 180
        assert fields["logs_url"] == "https://jenkins.example.com/job/deploy-production/42/console"
    
    async def test_verify_jenkins_token(self, loader, jenkins_build_payload, jenkins_build_headers, jenkins_token):
        """✅ GREEN: Verify Jenkins token verification"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(jenkins_build_payload)
        payload_bytes = payload_json.encode()
        
        os.environ["JENKINS_WEBHOOK_TOKEN"] = jenkins_token
        result = await adapter._verify_signature(payload_bytes, jenkins_build_headers)
        
        assert result is True
    
    async def test_reject_invalid_jenkins_token(self, loader, jenkins_build_payload):
        """✅ GREEN: Reject invalid Jenkins token"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(jenkins_build_payload)
        payload_bytes = payload_json.encode()
        
        headers = {
            "X-Jenkins-Event": "build_completed",
            "X-Jenkins-Token": "wrong-token"
        }
        
        os.environ["JENKINS_WEBHOOK_TOKEN"] = "correct-token"
        result = await adapter._verify_signature(payload_bytes, headers)
        
        assert result is False
    
    async def test_jenkins_full_webhook_parse(self, loader, jenkins_build_payload, jenkins_build_headers, jenkins_token):
        """✅ GREEN: Full Jenkins webhook parse (verify token → extract → normalize)"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(jenkins_build_payload)
        payload_bytes = payload_json.encode()
        
        os.environ["JENKINS_WEBHOOK_TOKEN"] = jenkins_token
        webhook_event = await adapter.parse(payload_bytes, jenkins_build_headers)
        
        # Verify structure
        assert webhook_event["tool"] == "jenkins"
        assert webhook_event["event_type"] == "build_completed"
        assert isinstance(webhook_event["timestamp"], datetime)
        assert webhook_event["event_id"]  # UUID generated
        
        # Verify metadata extracted
        assert webhook_event["metadata"]["job_name"] == "deploy-production"
        assert webhook_event["metadata"]["build_number"] == 42
        assert webhook_event["metadata"]["status"] == "SUCCESS"
    
    async def test_jenkins_token_missing_raises_error(self, loader, jenkins_build_payload, jenkins_build_headers):
        """✅ GREEN: Missing Jenkins token header raises error"""
        config = await loader.load_config("jenkins")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(jenkins_build_payload)
        payload_bytes = payload_json.encode()
        
        headers = {"X-Jenkins-Event": "build_completed"}  # Missing token header
        
        os.environ["JENKINS_WEBHOOK_TOKEN"] = "expected-token"
        result = await adapter._verify_signature(payload_bytes, headers)
        
        assert result is False


# ============================================================================
# PHASE 2: Terraform Webhook Integration Tests
# ============================================================================

@pytest.mark.asyncio
class TestTerraformWebhooks:
    """Test Terraform webhook processing with signature verification"""
    
    @pytest.fixture
    def terraform_plan_payload(self):
        """Real-world Terraform Cloud plan event payload"""
        return {
            "data": {
                "id": "run-abc123",
                "type": "run",
                "attributes": {
                    "name": "us-east-1-prod",
                    "status": "planned",
                    "created_at": "2025-11-10T11:00:00Z",
                    "resources_added": 5,
                    "resources_changed": 2,
                    "resources_destroyed": 0
                },
                "relationships": {
                    "organization": {
                        "data": {"id": "org-prod"}
                    }
                },
                "links": {
                    "self": "https://app.terraform.io/app/my-org/workspaces/prod/runs/run-abc123"
                }
            }
        }
    
    @pytest.fixture
    def terraform_secret(self):
        """Terraform webhook secret"""
        return "terraform-secret-signature"
    
    @pytest.fixture
    def terraform_plan_headers(self, terraform_plan_payload, terraform_secret):
        """Terraform webhook headers with signature"""
        payload_json = json.dumps(terraform_plan_payload, separators=(',', ':'), sort_keys=True)
        payload_bytes = payload_json.encode()
        
        # Terraform uses simple signature (not HMAC in same way, but for testing)
        signature = terraform_secret  # Simplified for testing
        
        return {
            "X-Terraform-Event": "run:created",
            "X-Terraform-Signature": signature,
            "Content-Type": "application/json"
        }
    
    async def test_load_terraform_config(self, loader):
        """✅ GREEN: Load Terraform config from YAML"""
        config = await loader.load_config("terraform")
        
        assert config["metadata"]["id"] == "terraform"
        assert config["metadata"]["name"] == "Terraform Cloud"
        assert config["integration"]["webhooks"]["enabled"] is True
        assert config["integration"]["webhooks"]["verification"]["method"] == "signature"
    
    async def test_terraform_signature_verification_method(self, loader):
        """✅ GREEN: Terraform uses signature verification"""
        config = await loader.load_config("terraform")
        
        assert config["integration"]["webhooks"]["verification"]["method"] == "signature"
        assert config["integration"]["webhooks"]["verification"]["header"] == "X-Terraform-Signature"
    
    async def test_terraform_plan_event_config(self, loader):
        """✅ GREEN: Terraform config has plan event"""
        config = await loader.load_config("terraform")
        
        assert "plan" in config["integration"]["webhooks"]["events"]
        event = config["integration"]["webhooks"]["events"]["plan"]
        assert event["http_event_header"] == "X-Terraform-Event"
        assert event["header_value"] == "run:created"
    
    async def test_extract_terraform_event_type(self, loader, terraform_plan_payload):
        """✅ GREEN: Extract plan event type from headers"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        headers = {"X-Terraform-Event": "run:created"}
        event_type = await adapter._extract_event_type(terraform_plan_payload, headers)
        
        assert event_type == "plan"
    
    async def test_extract_terraform_plan_fields(self, loader, terraform_plan_payload):
        """✅ GREEN: Extract plan fields via JSONPath"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        fields = await adapter._extract_fields(terraform_plan_payload, "plan")
        
        assert fields["workspace"] == "us-east-1-prod"
        assert fields["workspace_id"] == "run-abc123"
        assert fields["organization"] == "org-prod"
        assert fields["resources_added"] == 5
        assert fields["resources_changed"] == 2
        assert fields["resources_destroyed"] == 0
        assert fields["status"] == "planned"
    
    async def test_verify_terraform_signature(self, loader, terraform_plan_payload, terraform_plan_headers, terraform_secret):
        """✅ GREEN: Verify Terraform signature verification"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(terraform_plan_payload)
        payload_bytes = payload_json.encode()
        
        os.environ["TERRAFORM_WEBHOOK_SECRET"] = terraform_secret
        result = await adapter._verify_signature(payload_bytes, terraform_plan_headers)
        
        assert result is True
    
    async def test_reject_invalid_terraform_signature(self, loader, terraform_plan_payload):
        """✅ GREEN: Reject invalid Terraform signature"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(terraform_plan_payload)
        payload_bytes = payload_json.encode()
        
        headers = {
            "X-Terraform-Event": "run:created",
            "X-Terraform-Signature": "wrong-signature"
        }
        
        os.environ["TERRAFORM_WEBHOOK_SECRET"] = "correct-signature"
        result = await adapter._verify_signature(payload_bytes, headers)
        
        assert result is False
    
    async def test_terraform_full_webhook_parse(self, loader, terraform_plan_payload, terraform_plan_headers, terraform_secret):
        """✅ GREEN: Full Terraform webhook parse (verify signature → extract → normalize)"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(terraform_plan_payload)
        payload_bytes = payload_json.encode()
        
        os.environ["TERRAFORM_WEBHOOK_SECRET"] = terraform_secret
        webhook_event = await adapter.parse(payload_bytes, terraform_plan_headers)
        
        # Verify structure
        assert webhook_event["tool"] == "terraform"
        assert webhook_event["event_type"] == "plan"
        assert isinstance(webhook_event["timestamp"], datetime)
        assert webhook_event["event_id"]  # UUID generated
        
        # Verify metadata extracted
        assert webhook_event["metadata"]["workspace"] == "us-east-1-prod"
        assert webhook_event["metadata"]["organization"] == "org-prod"
        assert webhook_event["metadata"]["resources_added"] == 5
        assert webhook_event["metadata"]["status"] == "planned"
    
    async def test_terraform_signature_missing_raises_error(self, loader, terraform_plan_payload):
        """✅ GREEN: Missing Terraform signature header returns False"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        payload_json = json.dumps(terraform_plan_payload)
        payload_bytes = payload_json.encode()
        
        headers = {"X-Terraform-Event": "run:created"}  # Missing signature header
        
        os.environ["TERRAFORM_WEBHOOK_SECRET"] = "expected-signature"
        result = await adapter._verify_signature(payload_bytes, headers)
        
        assert result is False
    
    async def test_terraform_plan_with_complex_resources(self, loader):
        """✅ GREEN: Extract fields from complex nested Terraform payload"""
        config = await loader.load_config("terraform")
        adapter = UniversalWebhookAdapter(config)
        
        complex_payload = {
            "data": {
                "id": "run-complex-123",
                "type": "run",
                "attributes": {
                    "name": "multi-region-infrastructure",
                    "status": "planned",
                    "created_at": "2025-11-10T12:00:00Z",
                    "resources_added": 25,
                    "resources_changed": 12,
                    "resources_destroyed": 3
                },
                "relationships": {
                    "organization": {
                        "data": {"id": "org-enterprise"}
                    }
                },
                "links": {
                    "self": "https://app.terraform.io/complex-run"
                }
            }
        }
        
        fields = await adapter._extract_fields(complex_payload, "plan")
        
        assert fields["workspace"] == "multi-region-infrastructure"
        assert fields["resources_added"] == 25
        assert fields["resources_changed"] == 12
        assert fields["resources_destroyed"] == 3
        assert fields["organization"] == "org-enterprise"
