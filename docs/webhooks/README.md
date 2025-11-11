# Webhook Integration Guide

Hybrid CI/CD Platform supports webhook integrations with GitHub, Jenkins, Terraform Cloud, and Prometheus AlertManager. The system is **config-driven**, meaning you can add new tools by creating a YAML configuration file—no code changes required.

## Quick Start

### 1. Configure Webhook in Your Tool

- **GitHub**: Settings → Webhooks → Add webhook
  - Payload URL: `https://your-platform/api/webhooks/github`
  - Content type: `application/json`
  - Secret: Set to match environment variable `GITHUB_WEBHOOK_SECRET`

- **Jenkins**: Manage Jenkins → Plugin Management → Install "Generic Webhook Trigger"
  - URL: `https://your-platform/api/webhooks/jenkins`
  - Token: Set to match environment variable `JENKINS_WEBHOOK_TOKEN`

- **Terraform Cloud**: Settings → VCS Providers → Webhooks
  - URL: `https://your-platform/api/webhooks/terraform`
  - Secret: Set to match environment variable `TERRAFORM_WEBHOOK_SECRET`

- **Prometheus**: Alertmanager config `alertmanager.yml`
  ```yaml
  global:
    resolve_timeout: 5m
  route:
    receiver: 'webhook'
  receivers:
    - name: 'webhook'
      webhook_configs:
        - url: 'https://your-platform/api/webhooks/prometheus'
  ```

### 2. Set Environment Variables

```bash
export GITHUB_WEBHOOK_SECRET="your-github-secret"
export JENKINS_WEBHOOK_TOKEN="your-jenkins-token"
export TERRAFORM_WEBHOOK_SECRET="your-terraform-secret"
```

### 3. Deploy Platform

The webhook system automatically loads configs from `config/webhooks/tools/` directory.

### 4. Test

Send a test webhook from your tool to `https://your-platform/api/webhooks/<tool_id>`

## How Webhooks Work

```
Tool (GitHub/Jenkins/Terraform/Prometheus)
  ↓ Sends POST with event payload
Webhook Endpoint (POST /api/webhooks/{tool_id})
  ↓ Loads tool config from YAML
Config defines:
  ├─ Verification method (HMAC, token, signature, none)
  ├─ Event type detection (header + value)
  └─ Field extraction (JSON path expressions)
  ↓
UniversalWebhookAdapter
  ├─ 1. Verify signature (method from config)
  ├─ 2. Detect event type
  ├─ 3. Extract fields via JSON path
  └─ 4. Normalize to WebhookEvent
  ↓
CodeUChain WebhookEventChain
  ├─ Route based on event type
  ├─ Create Job/Deployment/Alert
  └─ Store event for audit trail
  ↓
Response: 200 OK {event_id, status}
```

## Configuration Reference

### Tool Config Structure

```yaml
version: 1.0.0
type: tool

metadata:
  id: github                    # Unique identifier
  name: GitHub                  # Display name
  description: ...              # User-friendly description
  category: version-control     # DevOps category

integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/github
    verification:
      method: hmac-sha256       # hmac-sha256, token, signature, none
      header: X-Hub-Signature-256
      secret_env_var: GITHUB_WEBHOOK_SECRET
    
    events:
      push:                     # Event identifier
        http_event_header: X-GitHub-Event
        header_value: push      # Header value indicating this event
        data_mapping:           # Field extraction (JSONPath)
          repository: $.repository.full_name
          branch: $.ref
          commit_sha: $.head_commit.id
          author: $.pusher.name

features:
  auto_job_creation: true       # Auto-create jobs from webhooks

contribution:
  author: orchestrate-solutions
  license: MIT
  allow_forks: true
```

### Verification Methods

| Method | Header | Usage |
|--------|--------|-------|
| `hmac-sha256` | `X-Hub-Signature-256` | GitHub, Terraform |
| `token` | `X-Jenkins-Token` | Jenkins, custom tools |
| `signature` | `X-Terraform-Signature` | Terraform Cloud |
| `none` | (IP whitelist) | Prometheus, internal tools |

### JSONPath Field Extraction

Use [JSONPath expressions](https://jsonpath.com/) to extract nested fields:

```yaml
data_mapping:
  repository: $.repository.full_name
  status: $.build.status
  nested: $.items[0].nested.field
  array_item: $.alerts[0].labels.severity
```

## Adding a New Tool

### Step 1: Create Config File

```bash
cp config/webhooks/tools/template.yaml config/webhooks/tools/my-tool.yaml
```

### Step 2: Edit Config

```yaml
metadata:
  id: my-tool
  name: My Tool Name
  category: version-control

integration:
  webhooks:
    enabled: true
    endpoint: /api/webhooks/my-tool
    verification:
      method: hmac-sha256
      header: X-Signature
      secret_env_var: MY_TOOL_SECRET
    
    events:
      push:
        http_event_header: X-Event-Type
        header_value: push
        data_mapping:
          repository: $.repo.name
          branch: $.branch
          commit_sha: $.commit.sha
```

### Step 3: Validate Config

```bash
python3 backend/scripts/validate-webhook-config.py config/webhooks/tools/my-tool.yaml
```

Output:
```
✅ Valid: config/webhooks/tools/my-tool.yaml
   Tool ID: my-tool
   Name: My Tool Name
```

### Step 4: Deploy

No code changes needed! Restart the platform and webhooks from your tool will be processed.

## Examples

### GitHub Push → Create Job

```yaml
events:
  push:
    http_event_header: X-GitHub-Event
    header_value: push
    data_mapping:
      event_type: "push"
      repository: $.repository.full_name
      branch: $.ref
      commit_sha: $.head_commit.id
      author: $.pusher.name
```

### Jenkins Build → Create Deployment

```yaml
events:
  build_completed:
    http_event_header: X-Jenkins-Event
    header_value: build_completed
    data_mapping:
      job_name: $.build.name
      build_number: $.build.number
      status: $.build.status
      duration_seconds: $.build.duration
```

### Terraform Plan → Create InfrastructureChange

```yaml
events:
  plan:
    http_event_header: X-Terraform-Event
    header_value: run:created
    data_mapping:
      workspace: $.data.attributes.name
      resources_added: $.data.attributes.resources_added
      resources_changed: $.data.attributes.resources_changed
      resources_destroyed: $.data.attributes.resources_destroyed
      status: $.data.attributes.status
```

### Prometheus Alert → Create Incident

```yaml
events:
  alert:
    http_event_header: X-Alert-Manager-Event
    header_value: alert
    data_mapping:
      status: $.status
      first_alert_name: $.alerts[0].labels.alertname
      first_alert_severity: $.alerts[0].labels.severity
      grouped_by: $.groupLabels
      common_labels: $.commonLabels
```

## Troubleshooting

### "Invalid webhook signature"

- Verify secret environment variable is set correctly
- Check that the secret in your tool matches the environment variable
- For GitHub: ensure HMAC-SHA256 algorithm is used (not SHA1)

### "Could not determine event type"

- Verify the `http_event_header` and `header_value` match your tool's payload
- Check webhook payload in tool's delivery log
- Example: GitHub sends `X-GitHub-Event: push` for push events

### "Field extraction failed"

- Verify JSONPath expression is valid: https://jsonpath.com/
- Check actual payload structure (tools may differ by version)
- Use `$` for root, `.` for properties, `[0]` for array access
- Example: `$.repository.full_name` extracts nested object property

### Config validation fails

```bash
python3 backend/scripts/validate-webhook-config.py config/webhooks/tools/my-tool.yaml
```

Common errors:
- Missing required fields: `version`, `type`, `metadata`, `integration`
- Invalid category: must be from approved list (see schema)
- Malformed JSON/YAML: check indentation and syntax

## Security Best Practices

- ✅ **Store secrets in environment variables**, not in config files
- ✅ **Use strong secrets** (min 32 characters with mixed case/numbers/symbols)
- ✅ **Rotate secrets regularly** (monthly recommended)
- ✅ **Only enable webhooks for events you need**
- ✅ **Validate webhook source** (check source IP/signature)
- ✅ **Use HTTPS** for all webhook URLs
- ✅ **Monitor webhook delivery logs** for suspicious activity
- ✅ **Limit webhook payload size** (most tools support this)

## Testing Webhooks Locally

### Using curl

```bash
# GitHub push event
curl -X POST http://localhost:8000/api/webhooks/github \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d '{"repository": {"full_name": "org/repo"}, "ref": "refs/heads/main", ...}'

# Jenkins build event
curl -X POST http://localhost:8000/api/webhooks/jenkins \
  -H "X-Jenkins-Event: build_completed" \
  -H "X-Jenkins-Token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"build": {"name": "test-job", "number": 1, ...}}'

# Terraform plan event
curl -X POST http://localhost:8000/api/webhooks/terraform \
  -H "X-Terraform-Event: run:created" \
  -H "X-Terraform-Signature: your-signature" \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": "run-123", "attributes": {...}}}'

# Prometheus alert
curl -X POST http://localhost:8000/api/webhooks/prometheus \
  -H "X-Alert-Manager-Event: alert" \
  -H "Content-Type: application/json" \
  -d '{"status": "firing", "alerts": [...]}'
```

### Using Webhook.site

For interactive testing:
1. Go to https://webhook.site
2. Copy your unique URL
3. Set webhook URL in your tool to point to webhook.site
4. Trigger event and inspect payload
5. Create JSONPath expressions based on actual payload structure

## API Reference

### POST /api/webhooks/{tool_id}

Receive webhook from tool and process event.

**Request Headers:**
- `Content-Type: application/json` (required)
- Verification header: depends on method (X-Hub-Signature-256, X-Jenkins-Token, etc.)
- Tool-specific event header (X-GitHub-Event, X-Jenkins-Event, etc.)

**Request Body:**
Tool-specific JSON payload (as sent by tool)

**Response:**
```json
{
  "status": "accepted",
  "event_id": "uuid-here",
  "tool": "github",
  "result": {
    "jobs_created": 1,
    "deployments_updated": 0
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid signature, malformed JSON, missing fields
- `404 Not Found`: Tool not found or endpoint not enabled
- `500 Internal Server Error`: Server error (check logs)

### GET /api/webhooks

List all available webhook tools.

**Response:**
```json
{
  "tools": [
    {
      "id": "github",
      "name": "GitHub / GitHub Actions",
      "enabled": true
    },
    {
      "id": "jenkins",
      "name": "Jenkins CI/CD",
      "enabled": true
    },
    ...
  ]
}
```

## Support

- 📚 **Documentation**: See `docs/webhooks/` directory
- 🧪 **Examples**: Check `config/webhooks/tools/` for real configs
- 🔧 **Validation Tool**: `python backend/scripts/validate-webhook-config.py --help`
- 🐛 **Issues**: Report to project GitHub issues
- 💬 **Discussion**: Use project discussions for questions

---

**Last Updated**: November 11, 2025  
**Supported Tools**: GitHub, Jenkins, Terraform Cloud, Prometheus AlertManager  
**Status**: Production Ready ✅
