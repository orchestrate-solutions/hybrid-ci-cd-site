# Webhook Implementation Plan: Config-Driven Tool Integration

**Document Version**: 1.0  
**Created**: 2025-11-10  
**Status**: Ready for Implementation (Phase 0 starting)  
**Branch**: `feat/webhook-adapter`  
**Total Duration**: 12 hours across 4 phases  
**Test Coverage Target**: 90+ tests (Phase 0-4), 100% on new code  

---

## Executive Summary

This document outlines the implementation plan for building a **universal webhook adapter system** that enables configuration-driven integration with GitHub, Jenkins, Terraform, and Prometheus without modifying Python code for each new tool.

### Core Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   WEBHOOK REQUEST FLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub/Jenkins/Terraform/Prometheus sends webhook          │
│           ↓                                                  │
│  POST /api/webhooks/<tool_id>                               │
│           ↓                                                  │
│  Load tool config from YAML (config/webhooks/tools/)        │
│           ↓                                                  │
│  UniversalWebhookAdapter.parse() [ONE CLASS FOR ALL TOOLS]  │
│    • Verify signature (config defines method)               │
│    • Extract fields (config defines JSON path mappings)     │
│    • Normalize to WebhookEvent                              │
│           ↓                                                  │
│  CodeUChain WebhookEventChain routes event                  │
│           ↓                                                  │
│  Store event + trigger handlers (Job, Deployment, Alert)    │
│           ↓                                                  │
│  Return 200 OK {event_id, status}                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Aspect | Traditional | Config-Driven (This Plan) |
|--------|-------------|--------------------------|
| **Adding new tool** | Write Python class + tests + routes | Copy YAML config, no code changes |
| **Verification methods** | Hardcoded (GitHub=HMAC, Jenkins=token) | Config specifies method |
| **Field extraction** | Custom parsing logic per tool | JSON path expressions in config |
| **Community contributions** | Requires PR review of Python code | Users add configs, lower barrier |
| **Schema versioning** | Break existing code on upgrades | Config versioning handles it |
| **Extensibility** | Bounded (limited to built-in tools) | Unbounded (any tool via config) |

---

## Phase 0: Foundation - Universal Adapter Pattern (3 hours)

**Goal**: Build the single reusable adapter and validation infrastructure all tools will use.

### 0.1: Test-Driven Design (RED Phase)

**File**: `backend/tests/unit/test_webhook_adapter.py`

```python
# Tests that MUST FAIL before implementation

def test_webhook_config_loader_loads_yaml():
    """WebhookConfigLoader loads and parses YAML configs"""
    # loader.load_config("github") should return ToolConfig dict

def test_webhook_config_loader_validates_schema():
    """ConfigLoader validates config against JSON schema"""
    # Invalid config should raise ValidationError

def test_universal_adapter_parses_github_push():
    """UniversalWebhookAdapter transforms GitHub payload → WebhookEvent"""
    # Config defines data_mapping, adapter uses it to extract fields

def test_universal_adapter_parses_jenkins_build():
    """Same adapter handles Jenkins payloads (config defines differences)"""
    # Proves adapter is tool-agnostic

def test_universal_adapter_verifies_hmac_signature():
    """Adapter verifies HMAC-SHA256 signature (config specifies method)"""
    # Invalid signature rejected

def test_universal_adapter_verifies_token_signature():
    """Adapter handles token verification (different method, same interface)"""
    # Proves verification is config-driven

def test_config_validator_validates_against_schema():
    """ConfigValidator validates user configs against JSON schema"""
    # Users can validate their own configs before deployment

def test_invalid_config_raises_clear_error():
    """Missing required fields → clear error message"""
    # Helps users debug

def test_adapter_error_handling_malformed_payload():
    """Adapter handles malformed JSON gracefully"""
    # Returns error context, doesn't crash

def test_adapter_error_handling_missing_required_field():
    """Adapter handles missing data_mapping fields"""
    # Returns error with field name, helps debugging
```

**Expected Result**: All 10 tests FAIL (classes don't exist yet) ✗

### 0.2: Define WebhookEvent Model

**File**: `backend/src/models/webhook.py`

```python
from typing import TypedDict
from datetime import datetime

class WebhookEvent(TypedDict):
    """Universal webhook event format - all tools normalize to this"""
    event_id: str              # UUID, generated by adapter
    tool: str                  # "github", "jenkins", "terraform", "prometheus"
    event_type: str            # "push", "build_completed", "plan", "alert_fired"
    timestamp: datetime        # When event occurred
    source_url: str            # Link to event in original tool (for UI)
    metadata: dict             # Tool-specific fields (repo, branch, job_name, etc.)
    payload: dict              # Original vendor payload (for debugging, audit trail)

# Tool-agnostic event types
class PushEvent(TypedDict):
    """GitHub push or Git push event"""
    repository: str
    branch: str
    commit_sha: str
    commit_message: str
    author: str

class BuildCompletedEvent(TypedDict):
    """Jenkins, CircleCI, GitHub Actions build completion"""
    job_name: str
    build_number: int
    status: str  # "SUCCESS", "FAILURE", "UNSTABLE"
    duration_seconds: int
    logs_url: str

class PlanEvent(TypedDict):
    """Terraform Cloud plan event"""
    workspace: str
    resources_added: int
    resources_changed: int
    resources_destroyed: int
    plan_url: str

class AlertEvent(TypedDict):
    """Prometheus AlertManager alert"""
    alert_name: str
    severity: str  # "critical", "warning", "info"
    status: str    # "firing", "resolved"
    labels: dict
    annotations: dict
```

### 0.3: Create JSON Schema for Tool Configs

**File**: `schemas/webhook-config.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Webhook Tool Configuration Schema",
  "type": "object",
  "required": ["version", "type", "metadata", "integration"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Config schema version (semantic versioning)"
    },
    "type": {
      "type": "string",
      "enum": ["tool", "schema", "iac", "plugin"],
      "description": "What type of configuration this is"
    },
    "metadata": {
      "type": "object",
      "required": ["id", "name", "category"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "Unique identifier (e.g., 'github', 'jenkins')"
        },
        "name": {
          "type": "string",
          "description": "Display name (e.g., 'GitHub / GitHub Actions')"
        },
        "category": {
          "type": "string",
          "enum": ["version-control", "ci-cd", "cloud", "iac", "config-mgmt", 
                   "containerization", "orchestration", "monitoring", "logging", 
                   "security", "service-mesh", "testing", "artifacts", "collaboration", 
                   "gitops", "developer-env"],
          "description": "DevOps tool category"
        },
        "description": {
          "type": "string"
        }
      }
    },
    "integration": {
      "type": "object",
      "required": ["webhooks"],
      "properties": {
        "webhooks": {
          "type": "object",
          "required": ["enabled", "endpoint", "verification"],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "endpoint": {
              "type": "string",
              "pattern": "^/api/webhooks/[a-z0-9-]+$"
            },
            "verification": {
              "type": "object",
              "required": ["method"],
              "properties": {
                "method": {
                  "type": "string",
                  "enum": ["hmac-sha256", "token", "signature", "none"],
                  "description": "Signature verification method"
                },
                "header": {
                  "type": "string",
                  "description": "Header containing signature (e.g., 'X-Hub-Signature-256')"
                },
                "secret_env_var": {
                  "type": "string",
                  "description": "Environment variable name containing secret"
                }
              }
            },
            "events": {
              "type": "object",
              "description": "Event type definitions and mappings",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "http_event_header": {
                    "type": "string",
                    "description": "HTTP header to check for event type"
                  },
                  "header_value": {
                    "type": "string",
                    "description": "Header value indicating this event type"
                  },
                  "data_mapping": {
                    "type": "object",
                    "description": "JSON path expressions mapping vendor fields to internal fields",
                    "additionalProperties": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "features": {
      "type": "object",
      "description": "Optional feature flags",
      "properties": {
        "auto_job_creation": { "type": "boolean" },
        "auto_deployment": { "type": "boolean" },
        "caching": { "type": "boolean" }
      }
    },
    "contribution": {
      "type": "object",
      "description": "Attribution and contribution metadata",
      "properties": {
        "author": { "type": "string" },
        "license": { "type": "string" },
        "allow_forks": { "type": "boolean" }
      }
    }
  }
}
```

### 0.4: Implement UniversalWebhookAdapter

**File**: `backend/src/components/adapters/webhook_adapter.py`

```python
import hmac
import hashlib
import json
from typing import TypedDict, Optional, Any
from datetime import datetime
import uuid
from jsonpath_ng import parse as jsonpath_parse
from backend.src.models.webhook import WebhookEvent

class UniversalWebhookAdapter:
    """
    Single adapter that handles ALL webhook tools via config-driven behavior.
    
    - Signature verification: defined in config
    - Field extraction: JSON path expressions in config
    - Event routing: config specifies event types
    
    No tool-specific code - all differences are in YAML configs.
    """
    
    def __init__(self, config: dict):
        """Initialize adapter with tool config"""
        self.config = config
        self.tool_id = config['metadata']['id']
        self.tool_name = config['metadata']['name']
    
    async def parse(self, payload: bytes, headers: dict) -> WebhookEvent:
        """
        Parse webhook payload → internal WebhookEvent format
        
        Steps:
        1. Verify signature (method from config)
        2. Parse JSON payload
        3. Extract event type (header from config)
        4. Map fields using JSON path expressions (from config)
        5. Normalize to WebhookEvent
        6. Return or raise if invalid
        """
        # Step 1: Verify signature
        if not await self._verify_signature(payload, headers):
            raise ValueError(f"Invalid webhook signature for {self.tool_id}")
        
        # Step 2: Parse JSON
        try:
            payload_dict = json.loads(payload)
        except json.JSONDecodeError as e:
            raise ValueError(f"Malformed JSON payload: {e}")
        
        # Step 3: Extract event type
        event_type = await self._extract_event_type(payload_dict, headers)
        if not event_type:
            raise ValueError(f"Could not determine event type for {self.tool_id}")
        
        # Step 4: Map fields using config's data_mapping
        metadata = await self._extract_fields(payload_dict, event_type)
        
        # Step 5: Normalize to WebhookEvent
        source_url = metadata.pop('source_url', f"{self.tool_id}://event")
        
        webhook_event: WebhookEvent = {
            'event_id': str(uuid.uuid4()),
            'tool': self.tool_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow(),
            'source_url': source_url,
            'metadata': metadata,
            'payload': payload_dict
        }
        
        return webhook_event
    
    async def _verify_signature(self, payload: bytes, headers: dict) -> bool:
        """Verify signature using method from config"""
        method = self.config['integration']['webhooks']['verification']['method']
        
        if method == 'hmac-sha256':
            return await self._verify_hmac_sha256(payload, headers)
        elif method == 'token':
            return await self._verify_token(headers)
        elif method == 'signature':
            return await self._verify_signature_header(payload, headers)
        elif method == 'none':
            return True
        else:
            raise ValueError(f"Unknown verification method: {method}")
    
    async def _verify_hmac_sha256(self, payload: bytes, headers: dict) -> bool:
        """Verify HMAC-SHA256 signature"""
        secret_env_var = self.config['integration']['webhooks']['verification'].get('secret_env_var')
        if not secret_env_var:
            raise ValueError("secret_env_var required for hmac-sha256 verification")
        
        import os
        secret = os.getenv(secret_env_var)
        if not secret:
            raise ValueError(f"Environment variable {secret_env_var} not set")
        
        header_name = self.config['integration']['webhooks']['verification']['header']
        signature = headers.get(header_name)
        if not signature:
            return False
        
        expected = "sha256=" + hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)
    
    async def _verify_token(self, headers: dict) -> bool:
        """Verify token verification"""
        secret_env_var = self.config['integration']['webhooks']['verification'].get('secret_env_var')
        if not secret_env_var:
            raise ValueError("secret_env_var required for token verification")
        
        import os
        token = os.getenv(secret_env_var)
        header_name = self.config['integration']['webhooks']['verification']['header']
        provided_token = headers.get(header_name)
        
        return hmac.compare_digest(token, provided_token or '')
    
    async def _verify_signature_header(self, payload: bytes, headers: dict) -> bool:
        """Verify signature header (e.g., Terraform)"""
        secret_env_var = self.config['integration']['webhooks']['verification'].get('secret_env_var')
        import os
        secret = os.getenv(secret_env_var)
        
        header_name = self.config['integration']['webhooks']['verification']['header']
        signature = headers.get(header_name)
        if not signature:
            return False
        
        # Generic signature verification
        return hmac.compare_digest(signature, secret)
    
    async def _extract_event_type(self, payload: dict, headers: dict) -> Optional[str]:
        """Extract event type from payload or headers using config"""
        events = self.config['integration']['webhooks'].get('events', {})
        
        for event_type, event_config in events.items():
            http_event_header = event_config.get('http_event_header')
            header_value = event_config.get('header_value')
            
            if http_event_header and headers.get(http_event_header) == header_value:
                return event_type
        
        return None
    
    async def _extract_fields(self, payload: dict, event_type: str) -> dict:
        """Extract fields using config's data_mapping (JSON path expressions)"""
        event_config = self.config['integration']['webhooks']['events'].get(event_type, {})
        data_mapping = event_config.get('data_mapping', {})
        
        extracted = {}
        for field_name, jsonpath_expr in data_mapping.items():
            try:
                # Use jsonpath-ng to extract value
                path = jsonpath_parse(jsonpath_expr)
                matches = path.find(payload)
                
                if matches:
                    extracted[field_name] = matches[0].value
                else:
                    extracted[field_name] = None
            except Exception as e:
                extracted[field_name] = None
        
        return extracted
```

### 0.5: Implement WebhookConfigLoader

**File**: `backend/src/services/webhook_config_loader.py`

```python
import yaml
import json
import jsonschema
from pathlib import Path
from typing import Dict, List, Optional, Any
import os

class WebhookConfigLoader:
    """Load, validate, and manage webhook tool configs"""
    
    def __init__(self, schema_path: str, tools_dir: str, private_tools_dir: str):
        self.schema_path = schema_path
        self.tools_dir = Path(tools_dir)
        self.private_tools_dir = Path(private_tools_dir)
        self.schema = self._load_schema()
    
    def _load_schema(self) -> dict:
        """Load JSON schema for validation"""
        with open(self.schema_path, 'r') as f:
            return json.load(f)
    
    async def load_config(self, tool_id: str) -> Dict[str, Any]:
        """
        Load tool config from YAML/JSON
        Check both public (tools/) and private (tools-private/) directories
        """
        # Try public first
        config_file = self.tools_dir / f"{tool_id}.yaml"
        if not config_file.exists():
            config_file = self.tools_dir / f"{tool_id}.json"
        
        # Try private
        if not config_file.exists():
            config_file = self.private_tools_dir / f"{tool_id}.yaml"
        if not config_file.exists():
            config_file = self.private_tools_dir / f"{tool_id}.json"
        
        if not config_file.exists():
            raise FileNotFoundError(f"Tool config not found: {tool_id}")
        
        # Load file
        with open(config_file, 'r') as f:
            if config_file.suffix == '.yaml':
                config = yaml.safe_load(f)
            else:
                config = json.load(f)
        
        # Validate against schema
        self.validate_config(config)
        
        return config
    
    def validate_config(self, config: dict) -> None:
        """Validate config against JSON schema"""
        try:
            jsonschema.validate(instance=config, schema=self.schema)
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid webhook config: {e.message}")
    
    async def list_tools(self) -> List[str]:
        """List all available tool configs"""
        tools = []
        
        # Public tools
        for file in self.tools_dir.glob("*.yaml"):
            tools.append(file.stem)
        for file in self.tools_dir.glob("*.json"):
            if file.stem not in tools:
                tools.append(file.stem)
        
        # Private tools
        if self.private_tools_dir.exists():
            for file in self.private_tools_dir.glob("*.yaml"):
                if file.stem not in tools:
                    tools.append(file.stem)
        
        return sorted(tools)
    
    async def validate_config_file(self, file_path: str) -> dict:
        """Validate a config file at given path"""
        with open(file_path, 'r') as f:
            if file_path.endswith('.yaml'):
                config = yaml.safe_load(f)
            else:
                config = json.load(f)
        
        self.validate_config(config)
        return {"valid": True, "path": file_path}
```

### 0.6: Create FastAPI Webhook Router

**File**: `backend/src/webhook_routes.py`

```python
from fastapi import APIRouter, Request, HTTPException
from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from backend.src.services.webhook_config_loader import WebhookConfigLoader
from backend.src.db.webhook_store import WebhookEventStoreInterface
from backend.src.components.chains.webhook_chains import WebhookEventChain

router = APIRouter()
config_loader: Optional[WebhookConfigLoader] = None
event_store: Optional[WebhookEventStoreInterface] = None
event_chain: Optional[WebhookEventChain] = None

def init_webhook_routes(
    loader: WebhookConfigLoader,
    store: WebhookEventStoreInterface,
    chain: WebhookEventChain
):
    """Initialize webhook router with dependencies"""
    global config_loader, event_store, event_chain
    config_loader = loader
    event_store = store
    event_chain = chain

@router.post("/api/webhooks/{tool_id}")
async def receive_webhook(tool_id: str, request: Request):
    """
    Universal webhook endpoint for all tools
    
    Route:
    1. Load tool config (defines verification, mapping)
    2. Read raw body for signature verification
    3. Create adapter with config
    4. Parse payload (verify, normalize)
    5. Run through CodeUChain
    6. Return result
    """
    try:
        # Load tool config
        config = await config_loader.load_config(tool_id)
        
        # Read raw body
        body = await request.body()
        
        # Get headers
        headers = dict(request.headers)
        
        # Create adapter
        adapter = UniversalWebhookAdapter(config)
        
        # Parse payload
        webhook_event = await adapter.parse(body, headers)
        
        # Run through CodeUChain
        result = await event_chain.run(webhook_event)
        
        # Return success
        return {
            "status": "accepted",
            "event_id": webhook_event['event_id'],
            "tool": tool_id,
            "result": result
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Tool not found: {tool_id}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/webhooks")
async def list_webhooks():
    """List all available webhook tools"""
    tools = await config_loader.list_tools()
    return {"tools": tools}
```

### 0.7: Update RED Tests (Check)

Run tests - they should now PASS! ✓

```bash
pytest backend/tests/unit/test_webhook_adapter.py -v
# Expected: All 10 tests PASS ✓
```

---

## Phase 1: GitHub Webhook Integration (3 hours)

### 1.1: GitHub Tool Config

**File**: `config/webhooks/tools/github.yaml`

```yaml
version: 1.0.0
type: tool

metadata:
  id: github
  name: GitHub / GitHub Actions
  description: Receive push, pull request, and workflow events from GitHub
  category: version-control
  
integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/github
    verification:
      method: hmac-sha256
      header: X-Hub-Signature-256
      secret_env_var: GITHUB_WEBHOOK_SECRET
    
    events:
      push:
        http_event_header: X-GitHub-Event
        header_value: push
        data_mapping:
          event_type: "push"
          repository: $.repository.full_name
          branch: $.ref
          commit_sha: $.head_commit.id
          commit_message: $.head_commit.message
          author: $.pusher.name
          timestamp: $.head_commit.timestamp
          source_url: $.head_commit.url
      
      pull_request:
        http_event_header: X-GitHub-Event
        header_value: pull_request
        data_mapping:
          event_type: "pull_request"
          repository: $.pull_request.head.repo.full_name
          branch: $.pull_request.head.ref
          action: $.action
          pr_number: $.pull_request.number
          author: $.pull_request.user.login

features:
  auto_job_creation: true

contribution:
  author: orchestrate-solutions
  license: MIT
  allow_forks: true
```

### 1.2: RED Tests for GitHub

**File**: `backend/tests/unit/test_github_webhook_adapter.py`

```python
import pytest
from backend.src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from backend.src.services.webhook_config_loader import WebhookConfigLoader

@pytest.fixture
async def github_config():
    """Load GitHub tool config"""
    loader = WebhookConfigLoader(...)
    return await loader.load_config("github")

@pytest.fixture
def github_push_payload():
    """Sample GitHub push webhook payload"""
    return {
        "repository": {"full_name": "org/repo"},
        "ref": "refs/heads/main",
        "head_commit": {
            "id": "abc123def456",
            "message": "Fix: improve webhook adapter",
            "url": "https://github.com/org/repo/commit/abc123",
            "timestamp": "2025-11-10T10:00:00Z"
        },
        "pusher": {"name": "john"}
    }

@pytest.fixture
def github_push_headers():
    """Sample GitHub webhook headers"""
    import hmac, hashlib
    secret = "test-secret"
    payload = b'{"repository": ...}'
    signature = "sha256=" + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-GitHub-Event": "push",
        "X-Hub-Signature-256": signature
    }

@pytest.mark.asyncio
async def test_github_webhook_verifies_signature(github_config):
    """Adapter verifies HMAC-SHA256 signature"""
    adapter = UniversalWebhookAdapter(github_config)
    # Should verify successfully with correct signature

@pytest.mark.asyncio
async def test_github_webhook_rejects_invalid_signature(github_config):
    """Adapter rejects invalid signature"""
    adapter = UniversalWebhookAdapter(github_config)
    # Should raise ValueError with invalid signature

@pytest.mark.asyncio
async def test_github_webhook_extracts_push_event(github_config, github_push_payload):
    """Adapter extracts push event type"""
    adapter = UniversalWebhookAdapter(github_config)
    event_type = await adapter._extract_event_type(
        github_push_payload,
        {"X-GitHub-Event": "push"}
    )
    assert event_type == "push"

@pytest.mark.asyncio
async def test_github_webhook_maps_push_fields(github_config, github_push_payload):
    """Adapter maps payload fields using config's data_mapping"""
    adapter = UniversalWebhookAdapter(github_config)
    fields = await adapter._extract_fields(github_push_payload, "push")
    
    assert fields["repository"] == "org/repo"
    assert fields["branch"] == "refs/heads/main"
    assert fields["commit_sha"] == "abc123def456"
    assert fields["author"] == "john"

@pytest.mark.asyncio
async def test_github_webhook_parse_full_flow(github_config, github_push_payload, github_push_headers):
    """Full webhook parse flow: verify → extract → normalize"""
    adapter = UniversalWebhookAdapter(github_config)
    import json
    payload = json.dumps(github_push_payload).encode()
    
    webhook_event = await adapter.parse(payload, github_push_headers)
    
    assert webhook_event['tool'] == 'github'
    assert webhook_event['event_type'] == 'push'
    assert webhook_event['metadata']['repository'] == 'org/repo'
    assert webhook_event['metadata']['author'] == 'john'

@pytest.mark.asyncio
async def test_github_webhook_invalid_signature_rejected():
    """Invalid signature raises ValueError"""
    # Test with wrong secret

@pytest.mark.asyncio
async def test_github_webhook_missing_fields_handled():
    """Missing optional fields don't crash"""
    # Test with partial payload
```

Expected Result: All tests FAIL ✗ (adapters exist but need testing)

### 1.3: Implementation GREEN Phase

The implementation from Phase 0 should make all GitHub tests PASS! ✓

```bash
pytest backend/tests/unit/test_github_webhook_adapter.py -v
# Expected: All tests PASS ✓
```

### 1.4: Integration with Job Creation

Update `backend/src/components/chains/dashboard_chains.py`:

```python
class JobCreationChainFromWebhook(Chain):
    """Create Job from GitHub webhook event"""
    
    def __init__(self, store: JobStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ExtractWebhookDataLink(), "extract")
        self.chain.add_link(ValidateJobCreationLink(), "validate")
        self.chain.add_link(CreateJobLink(store), "create")
        self.chain.add_link(SerializeJobLink(), "serialize")
        
        self.chain.connect("extract", "validate", lambda c: c.get("validation_error") is None)
        self.chain.connect("validate", "create", lambda c: c.get("validation_error") is None)
        self.chain.connect("create", "serialize", lambda c: c.get("job") is not None)
```

---

## Phase 2: Jenkins & Terraform Webhooks (2 hours)

### 2.1: Jenkins Tool Config

**File**: `config/webhooks/tools/jenkins.yaml`

```yaml
version: 1.0.0
type: tool

metadata:
  id: jenkins
  name: Jenkins CI/CD
  description: Receive build events from Jenkins
  category: ci-cd

integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/jenkins
    verification:
      method: token
      header: X-Jenkins-Token
      secret_env_var: JENKINS_WEBHOOK_TOKEN
    
    events:
      build_completed:
        http_event_header: X-Jenkins-Event
        header_value: build_completed
        data_mapping:
          event_type: "build_completed"
          job_name: $.build.name
          build_number: $.build.number
          status: $.build.status
          duration_seconds: $.build.duration
          logs_url: $.build.logs_url

contribution:
  author: orchestrate-solutions
  license: MIT
```

### 2.2: Terraform Tool Config

**File**: `config/webhooks/tools/terraform.yaml`

```yaml
version: 1.0.0
type: tool

metadata:
  id: terraform
  name: Terraform Cloud
  description: Receive plan and apply events from Terraform Cloud
  category: infrastructure-as-code

integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/terraform
    verification:
      method: signature
      header: X-Terraform-Signature
      secret_env_var: TERRAFORM_WEBHOOK_SECRET
    
    events:
      plan:
        data_mapping:
          event_type: "plan"
          workspace: $.data.attributes.name
          resources_added: $.data.attributes.resources_added
          resources_changed: $.data.attributes.resources_changed
          resources_destroyed: $.data.attributes.resources_destroyed
          plan_url: $.data.links.self

contribution:
  author: orchestrate-solutions
  license: MIT
```

### 2.3: RED Tests for Jenkins & Terraform

**Files**: `backend/tests/unit/test_jenkins_terraform_adapters.py`

Both tools reuse `UniversalWebhookAdapter` - no new Python classes needed!

```python
@pytest.mark.asyncio
async def test_jenkins_webhook_with_universal_adapter():
    """Jenkins uses same adapter as GitHub (config-driven)"""
    loader = WebhookConfigLoader(...)
    jenkins_config = await loader.load_config("jenkins")
    
    adapter = UniversalWebhookAdapter(jenkins_config)
    # Same parse() method, different config
    webhook_event = await adapter.parse(payload, headers)
    
    assert webhook_event['tool'] == 'jenkins'

@pytest.mark.asyncio
async def test_terraform_webhook_with_universal_adapter():
    """Terraform uses same adapter (different verification method)"""
    loader = WebhookConfigLoader(...)
    terraform_config = await loader.load_config("terraform")
    
    adapter = UniversalWebhookAdapter(terraform_config)
    webhook_event = await adapter.parse(payload, headers)
    
    assert webhook_event['tool'] == 'terraform'
```

### 2.4: GREEN Phase

All tests PASS using same adapter! ✓

```bash
pytest backend/tests/unit/test_jenkins_terraform_adapters.py -v
# Expected: All tests PASS ✓
```

---

## Phase 3: Prometheus & Event Storage (2 hours)

### 3.1: Prometheus Tool Config

**File**: `config/webhooks/tools/prometheus.yaml`

```yaml
version: 1.0.0
type: tool

metadata:
  id: prometheus
  name: Prometheus AlertManager
  description: Receive alerts from Prometheus AlertManager
  category: monitoring

integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/prometheus
    verification:
      method: none
    
    events:
      alert:
        data_mapping:
          event_type: "alert"
          alerts: $.alerts
          status: $.alerts[0].status
          severity: $.alerts[0].labels.severity

contribution:
  author: orchestrate-solutions
  license: MIT
```

### 3.2: WebhookEventStore Interface

**File**: `backend/src/db/webhook_store.py`

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from backend.src.models.webhook import WebhookEvent

class WebhookEventStoreInterface(ABC):
    """Interface for storing webhook events"""
    
    @abstractmethod
    async def save_event(self, event: WebhookEvent) -> str:
        """Save event, return event_id"""
        pass
    
    @abstractmethod
    async def get_event(self, event_id: str) -> Optional[WebhookEvent]:
        """Retrieve event by ID"""
        pass
    
    @abstractmethod
    async def list_events(self, tool: str, limit: int = 100) -> List[WebhookEvent]:
        """List recent events for tool"""
        pass
    
    @abstractmethod
    async def list_events_by_type(self, event_type: str, limit: int = 100) -> List[WebhookEvent]:
        """List events by type"""
        pass

# InMemoryWebhookEventStore implementation
class InMemoryWebhookEventStore(WebhookEventStoreInterface):
    def __init__(self):
        self.events = {}
    
    async def save_event(self, event: WebhookEvent) -> str:
        self.events[event['event_id']] = event
        return event['event_id']
    
    async def get_event(self, event_id: str) -> Optional[WebhookEvent]:
        return self.events.get(event_id)
    
    async def list_events(self, tool: str, limit: int = 100) -> List[WebhookEvent]:
        events = [e for e in self.events.values() if e['tool'] == tool]
        return sorted(events, key=lambda e: e['timestamp'], reverse=True)[:limit]
    
    async def list_events_by_type(self, event_type: str, limit: int = 100) -> List[WebhookEvent]:
        events = [e for e in self.events.values() if e['event_type'] == event_type]
        return sorted(events, key=lambda e: e['timestamp'], reverse=True)[:limit]

# DynamoDBWebhookEventStore implementation (production)
class DynamoDBWebhookEventStore(WebhookEventStoreInterface):
    # Implementation using DynamoDB table
    pass
```

### 3.3: CodeUChain WebhookEventChain

**File**: `backend/src/components/chains/webhook_chains.py`

```python
from codeuchain.core import Context, Chain, Link
from backend.src.db.webhook_store import WebhookEventStoreInterface
from backend.src.models.webhook import WebhookEvent

class StoreWebhookEventLink(Link[dict, dict]):
    def __init__(self, store: WebhookEventStoreInterface):
        self.store = store
    
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        webhook_event = ctx.get("webhook_event")
        if webhook_event:
            event_id = await self.store.save_event(webhook_event)
            return ctx.insert("stored_event_id", event_id)
        return ctx.insert("error", "No webhook event in context")

class WebhookEventChain:
    def __init__(self, store: WebhookEventStoreInterface):
        self.chain = Chain()
        self.chain.add_link(StoreWebhookEventLink(store), "store")
    
    async def run(self, webhook_event: WebhookEvent) -> dict:
        ctx = Context({"webhook_event": webhook_event})
        result = await self.chain.run(ctx)
        return result.to_dict()
```

### 3.4: DynamoDB Schema Update

**File**: `backend/DYNAMODB_SCHEMA.md` (append)

```markdown
## Webhook Events Table

**Table Name**: `webhook_events`
**Partition Key**: `event_id` (String)
**GSI 1**: `tool` (String) + `created_at` (String)
**TTL**: `expires_at` (30 days)
**Billing**: PAY_PER_REQUEST

**Attributes**:
- `event_id`: UUID
- `tool`: "github", "jenkins", "terraform", "prometheus"
- `event_type`: "push", "build_completed", "plan", "alert"
- `created_at`: ISO timestamp
- `source_url`: Link to event in tool
- `metadata`: JSON object
- `payload`: JSON object (full webhook payload)
```

---

## Phase 4: Integration Tests + Documentation + CLI (2 hours)

### 4.1: End-to-End Tests

**File**: `backend/tests/integration/test_webhook_flows.py`

```python
@pytest.mark.asyncio
async def test_github_push_creates_job():
    """GitHub push webhook → creates Job"""
    # 1. Send GitHub push webhook
    # 2. Verify Job created in store
    # 3. Verify metadata correct

@pytest.mark.asyncio
async def test_jenkins_build_creates_deployment():
    """Jenkins build_completed → creates Deployment"""
    # Similar flow

@pytest.mark.asyncio
async def test_prometheus_alert_stored():
    """Prometheus alert → stored in webhook_events"""
    # Similar flow

@pytest.mark.asyncio
async def test_terraform_plan_triggers_review():
    """Terraform plan → creates InfrastructureChange"""
    # Similar flow
```

### 4.2: CLI Tool for Config Validation

**File**: `backend/scripts/validate-webhook-config.py`

```python
#!/usr/bin/env python3
import sys
import argparse
import yaml
import json
import jsonschema
from pathlib import Path

def validate_config(config_path):
    """Validate single webhook config"""
    with open(config_path, 'r') as f:
        if config_path.endswith('.yaml'):
            config = yaml.safe_load(f)
        else:
            config = json.load(f)
    
    # Load schema
    schema_path = Path(__file__).parent.parent / "schemas" / "webhook-config.schema.json"
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    try:
        jsonschema.validate(instance=config, schema=schema)
        print(f"✓ Valid: {config_path}")
        return True
    except jsonschema.ValidationError as e:
        print(f"✗ Invalid: {config_path}")
        print(f"  Error: {e.message}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Validate webhook configs")
    parser.add_argument("config_path", nargs="?", help="Path to config file")
    parser.add_argument("--all", action="store_true", help="Validate all configs")
    parser.add_argument("--test", help="Test with payload file")
    
    args = parser.parse_args()
    
    if args.all:
        # Validate all configs in config/webhooks/tools/
        pass
    elif args.config_path:
        validate_config(args.config_path)

if __name__ == "__main__":
    main()
```

### 4.3: Comprehensive Documentation

**File**: `docs/webhooks/README.md`

```markdown
# Webhook Integration Guide

## Quick Start

1. **Configure webhook in tool** (GitHub, Jenkins, etc.)
   - Set payload URL: `https://your-platform/api/webhooks/<tool_id>`
   - Set secret from environment variable

2. **Deploy platform** with webhook configs

3. **Send test event** - check dashboard for event received

## How to Add a New Tool

1. Copy template: `cp config/webhooks/tools/template.yaml config/webhooks/tools/my-tool.yaml`
2. Edit YAML with tool's webhook format
3. Test locally: `python scripts/validate-webhook-config.py config/webhooks/tools/my-tool.yaml`
4. Deploy (no code changes needed!)

## Configuration Reference

All tool configs follow this structure...

## Examples

### GitHub
- [github.yaml](../../config/webhooks/tools/github.yaml)

### Jenkins
- [jenkins.yaml](../../config/webhooks/tools/jenkins.yaml)

### Terraform
- [terraform.yaml](../../config/webhooks/tools/terraform.yaml)

### Prometheus
- [prometheus.yaml](../../config/webhooks/tools/prometheus.yaml)
```

---

## Implementation Timeline

```
Phase 0: Foundation (3 hrs)
├─ 0.1: Write RED tests (30 min)
├─ 0.2: Define WebhookEvent model (30 min)
├─ 0.3: Create JSON schema (30 min)
├─ 0.4: Implement adapter (45 min)
├─ 0.5: Implement loader (30 min)
├─ 0.6: Create router (15 min)
└─ 0.7: All tests PASS ✓

Phase 1: GitHub (3 hrs)
├─ 1.1: Create github.yaml (15 min)
├─ 1.2: Write RED tests (45 min)
├─ 1.3: GREEN - all tests PASS (45 min)
└─ 1.4: Connect to JobCreationChain (30 min)

Phase 2: Jenkins & Terraform (2 hrs)
├─ 2.1-2.2: Create configs (15 min)
├─ 2.3: Write RED tests (45 min)
└─ 2.4: GREEN - all tests PASS (60 min)

Phase 3: Prometheus (2 hrs)
├─ 3.1: Create prometheus.yaml (15 min)
├─ 3.2: WebhookEventStore (30 min)
├─ 3.3: CodeUChain chain (30 min)
└─ 3.4: Tests PASS (45 min)

Phase 4: Integration + Docs (2 hrs)
├─ 4.1: E2E tests (30 min)
├─ 4.2: CLI tool (30 min)
├─ 4.3: Documentation (45 min)
└─ 4.4: Git commits (15 min)

TOTAL: 12 hours
```

---

## Success Criteria

- ✅ 90+ unit + integration tests PASS
- ✅ All 4 tools (GitHub, Jenkins, Terraform, Prometheus) working
- ✅ Config-driven approach (no hardcoded tool logic)
- ✅ Single UniversalWebhookAdapter handles all tools
- ✅ JSON Schema validates all configs
- ✅ CLI tool for config validation
- ✅ Comprehensive documentation
- ✅ Full E2E flows tested
- ✅ Error handling + retry logic
- ✅ Clean git commits per phase

---

## Key Design Decisions

### Why Config-Driven?

- **Extensibility**: Users add tools via YAML, zero code changes
- **Maintainability**: All tool differences are in configs, not scattered code
- **Testability**: Single adapter → single class to test thoroughly
- **Clarity**: Configs are documentation (self-explanatory)

### Why JSON Path Expressions?

- **Flexibility**: Extract any nested field from vendor payload
- **Standardization**: Same syntax across all tools
- **Learnability**: Users can learn one syntax, use everywhere

### Why CodeUChain for Routing?

- **Immutability**: Context flows through chains without mutation bugs
- **Composability**: New links (error handling, logging) added easily
- **Predictability**: Predicates define routing explicitly (no if/else chaos)

### Why Separate Store Interface?

- **Testability**: InMemoryStore for tests, DynamoDB for prod
- **Flexibility**: Swap backends without changing business logic
- **Scalability**: Future backends (Redis, PostgreSQL) just implement interface

---

## Notes for Developers

- Start with Phase 0 - it's the foundation
- RED phase is critical - write comprehensive tests FIRST
- Configs are the "specification" - make them self-documenting
- JSON Schema is strict by design - helps catch user errors early
- CodeUChain pattern follows established conventions (validate → create → serialize)

---

**Ready to begin Phase 0?** Start with #todo 1-7.


TDD, cypress, storybook for frontend where applicable. codeuchain ts frontend / py backend.