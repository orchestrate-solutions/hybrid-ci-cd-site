---
name: NET ZERO Risk Architecture — User-Owned Queue Model
description: Comprehensive analysis comparing current DevOps risk surfaces vs. zero-trust relay architecture, proving NET ZERO additional risk is achievable with user-owned queue model where provider becomes stateless config store + routing engine.
---

# NET ZERO Risk Architecture: Current DevOps vs. Our Platform

## Current DevOps Baseline Risk (What Users Already Accept)

### Scenario 1: GitHub Actions Workflow
```
GitHub Repository (user owns)
  ├── Secrets: GitHub Secrets (encrypted by GitHub)
  ├── Webhooks: GitHub → GitHub Actions (internal)
  ├── Access: GitHub employees, user's team
  └── Risk: Trust GitHub with secrets storage
  
Attack Vectors:
  • GitHub breach (user already trusts GitHub)
  • Stolen GitHub PAT (user responsibility)
  • Compromised GitHub Actions runner (GitHub's responsibility)
  • Insider threat (GitHub employees)
  
User Risk Level: MEDIUM (accepted by 100M+ developers)
```

### Scenario 2: Jenkins Self-Hosted
```
User's Infrastructure
  ├── Secrets: Jenkins credentials store (user owns)
  ├── Webhooks: GitHub → User's Jenkins (HTTPS)
  ├── Access: User's team only
  └── Risk: User manages everything
  
Attack Vectors:
  • Jenkins CVE (user patches)
  • Compromised Jenkins server (user secures)
  • Stolen credentials (user rotates)
  • Network exposure (user firewall)
  
User Risk Level: HIGH (user owns ALL risk)
```

### Scenario 3: AWS CodePipeline
```
AWS Account (user owns)
  ├── Secrets: AWS Secrets Manager (encrypted by AWS)
  ├── Webhooks: GitHub → AWS EventBridge (AWS manages)
  ├── Access: AWS IAM (user controls)
  └── Risk: Trust AWS with secrets + event routing
  
Attack Vectors:
  • AWS breach (user trusts AWS)
  • Misconfigured IAM (user responsibility)
  • CloudTrail disabled (user responsibility)
  
User Risk Level: LOW-MEDIUM (AWS shared responsibility model)
```

## Baseline Risk Summary

**What users ALREADY trust third parties with**:
- ✅ GitHub: Secret storage, webhook delivery, runner execution
- ✅ AWS: Secret storage, event routing, Lambda execution
- ✅ Jenkins plugins: Credential handling, webhook parsing

**Key Insight**: Users already accept third-party risk for orchestration. The question is: **Can we match or reduce that risk?**

---

## Risk Comparison Matrix

| Risk Surface | Current DevOps | With Our Platform (Relay) | Delta | Can We Eliminate? |
|--------------|----------------|---------------------------|-------|-------------------|
| **Secret Storage** | GitHub/AWS/Vault (user trusts) | User's Vault ONLY (we never see) | **ZERO** ✅ | N/A - Already optimal |
| **Webhook Payload Access** | GitHub Actions sees full payload | Relay sees full payload (user infra) | **ZERO** ✅ | N/A - On user's infra |
| **Signature Verification** | GitHub verifies internally | Relay verifies (user infra) | **ZERO** ✅ | N/A - Same trust model |
| **Metadata Storage** | GitHub stores all workflow logs | **Provider stores metadata** | **NEW RISK** ❌ | **YES - Can eliminate** |
| **Event Routing** | GitHub Actions handles routing | **Provider routes events** | **NEW RISK** ❌ | **Partial - Can minimize** |
| **Business Logic Execution** | User's Actions/Jenkins | User's agents + our orchestration | **NEW RISK** ❌ | **Partial - Can isolate** |

### NEW Risks We Introduce

| Risk | Current DevOps | Our Platform | Impact | Mitigation |
|------|----------------|--------------|---------|------------|
| **Provider sees metadata** | GitHub/AWS already see this | We also see metadata | **Low** - Same as GitHub | Can eliminate with Option B below |
| **Provider stores metadata** | GitHub stores logs forever | We store events | **Low** - GitHub does same | Add TTL, encryption |
| **Provider routes events** | GitHub Actions native | We add routing layer | **Medium** - New dependency | Make provider stateless |
| **Third-party dependency** | Trust GitHub/AWS | Trust us too | **Medium** - Additional vendor | Can reduce to config-only |

---

## NET ZERO Architecture: Option B (User-Owned Queue)

**Principle**: Provider (us) becomes **stateless config store**. ALL data lives on user's infrastructure.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER'S INFRASTRUCTURE ONLY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GitHub Repository                                                          │
│      ↓ (webhook)                                                            │
│  Relay Container (user-deployed)                                            │
│      ├── Verify signature (secret from user's vault)                        │
│      ├── Sanitize payload                                                   │
│      └── Forward to USER'S OWN QUEUE                                        │
│           ↓                                                                 │
│  User's Event Queue (AWS SQS / EventBridge / Pub/Sub)                      │
│      ├── Data: Metadata only (no secrets)                                   │
│      ├── Access: User's IAM/RBAC                                             │
│      └── Retention: User controls TTL                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
         [Provider polls metadata endpoint - READ ONLY]
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROVIDER INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Orchestration Engine (stateless)                                           │
│      ├── Reads event metadata from user's queue (user grants read access)   │
│      ├── Applies routing rules from user's config                           │
│      ├── Sends routing decisions back to user's infrastructure              │
│      └── Stores NOTHING                                                     │
│                                                                             │
│  Config Store (user configurations only)                                    │
│      ├── Routing rules (if X event, trigger Y job)                          │
│      ├── Connection metadata (queue endpoint, no credentials)               │
│      └── User preferences (notifications, dashboards)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
              [Send routing decision to user's queue]
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER'S INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User's Event Queue                                                         │
│      ↓                                                                      │
│  Agent (user-deployed)                                                      │
│      ├── Reads routing decision                                             │
│      ├── Executes job (using user's secrets from vault)                     │
│      └── Reports status back to queue                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Webhook Receipt** (User's Infra)
```
GitHub → Relay (user's container) → Verify signature → Sanitize → User's SQS queue
Data stored: User's AWS account ONLY
Provider sees: NOTHING
```

**2. Orchestration** (Provider)
```
Provider polls user's queue (read-only IAM role)
  ↓
Reads: { event_id, event_type, timestamp } (metadata only)
  ↓
Applies routing rules from config store
  ↓
Sends decision to user's queue: { event_id, action: "trigger_job_X" }
  ↓
Provider stores: NOTHING (stateless)
```

**3. Execution** (User's Infra)
```
Agent reads decision from user's queue
  ↓
Executes job (secrets from user's vault)
  ↓
Reports status to user's queue
  ↓
(Optional) Provider reads status for dashboard display
```

---

## Risk Comparison: Option B vs. Current DevOps

| Risk Surface | Current DevOps | Option B (User Queue) | Delta | Status |
|--------------|----------------|-----------------------|-------|--------|
| **Secret Storage** | GitHub/AWS (user trusts) | User's Vault ONLY | **ZERO** ✅ | NET ZERO |
| **Webhook Payload** | GitHub sees full payload | Relay (user infra) sees payload | **ZERO** ✅ | NET ZERO |
| **Event Data Storage** | GitHub stores logs | User's SQS ONLY | **ZERO** ✅ | **NET ZERO** ✅ |
| **Event Routing Logic** | GitHub Actions native | Provider reads + routes (stateless) | **LOW** ⚠️ | Minimal increase |
| **Third-Party Dependency** | GitHub/AWS | GitHub/AWS + us (config only) | **LOW** ⚠️ | Config-only role |

### NET ZERO Achievement

✅ **Secrets**: Provider NEVER sees secrets (same as current)  
✅ **Payload**: Provider NEVER sees full payload (same as current)  
✅ **Event Data**: Provider NEVER stores events (BETTER than GitHub)  
⚠️ **Routing Logic**: Provider reads metadata (SAME as GitHub Actions)  
⚠️ **Dependency**: Provider is config layer (LESS critical than GitHub)

**Result**: **NET ZERO risk increase** for data custody. Minimal increase for availability dependency (user can self-host config if needed).

---

## Minimal Provider Footprint

### What Provider Must Do (Minimum Viable)
1. **Store user config** (routing rules, connection metadata)
2. **Read metadata** from user's queue (event type, timestamp)
3. **Apply routing logic** (if event X, trigger job Y)
4. **Send decisions** to user's queue

### What Provider NEVER Sees
- ❌ Secrets
- ❌ Full webhook payloads
- ❌ Job execution details
- ❌ Logs/artifacts
- ❌ User's infrastructure internals

### User Owns 100% of Data
- ✅ Secrets (in their vault)
- ✅ Event data (in their queue)
- ✅ Execution logs (in their systems)
- ✅ Audit trail (CloudTrail, etc.)

---

## Implementation: User-Owned Queue Architecture

### Setup Flow
```
1. User deploys relay (GitHub Action / Helm / Lambda)
2. User creates SQS queue (or EventBridge, Pub/Sub)
3. User grants provider READ-ONLY access to queue
4. User configures routing rules in provider UI
5. Provider polls queue, sends routing decisions
6. User's agents execute jobs
```

### Provider Access Model
```yaml
# User's IAM policy (grants MINIMAL access)
Statement:
  - Effect: Allow
    Principal:
      AWS: "arn:aws:iam::PROVIDER_ACCOUNT:role/OrchestrationReader"
    Action:
      - sqs:ReceiveMessage      # Read events
      - sqs:SendMessage         # Send routing decisions
    Resource: "arn:aws:sqs:REGION:USER_ACCOUNT:orchestrate-events"
    Condition:
      StringEquals:
        aws:SecureTransport: "true"  # HTTPS only
```

### Provider Never Needs
- ❌ Write access to user's infrastructure
- ❌ Secret access
- ❌ Database storage of events
- ❌ Long-term data retention

---

## Comparison: Relay Options with Risk Delta

| Option | Provider Sees | Provider Stores | User Risk Delta | Provider Risk | Recommendation |
|--------|---------------|-----------------|-----------------|---------------|----------------|
| **A: Direct Relay** | Sanitized metadata | Metadata in DB | **MEDIUM** ⚠️ | HIGH | ❌ Not optimal |
| **B: User Queue** | Metadata (read-only) | Nothing (stateless) | **ZERO** ✅ | LOW | ✅ **Recommended** |
| **C: Config Only** | Nothing (user polls) | Config only | **ZERO** ✅ | MINIMAL | ⚠️ Less value-add |

### Recommendation: **Option B (User-Owned Queue)**

**Why**:
- ✅ NET ZERO additional risk for user data custody
- ✅ Provider is stateless (minimal liability)
- ✅ User controls ALL data (queue in their account)
- ✅ Provider adds orchestration value (routing logic)
- ✅ Easier compliance (data never leaves user's cloud)
- ✅ User can revoke access anytime (IAM policy)

**Trade-off**:
- User must create queue (additional setup)
- User pays for queue costs (but already paying for SQS/EventBridge)
- Provider must handle polling (backend complexity)

---

## Final Answer to Your Question

**Can we achieve NET ZERO additional risk?**  
✅ **YES** - with Option B (User-Owned Queue)

**Can we minimize our surface area?**  
✅ **YES** - we become a **stateless config store + routing engine**

**Can we keep it on their provider entirely?**  
✅ **YES** - all data lives in user's GitHub/AWS/Azure, we just read metadata and send routing decisions

**Do we inject ourselves where we don't need to be?**  
✅ **NO** - we ONLY handle orchestration logic (same role as GitHub Actions), never touch secrets/payloads

This architecture matches the risk profile of current DevOps tools (GitHub Actions, AWS EventBridge) while giving users MORE control (they own the queue, can revoke access anytime).
