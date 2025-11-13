# Frontend API Coverage Audit - Deep Validation Report

**Generated**: November 13, 2025  
**Scope**: Complete backend-to-frontend API integration analysis  
**Status**: ⚠️ CRITICAL GAPS IDENTIFIED

---

## Executive Summary

The frontend is **NOT fully aligned** with the backend. There are **significant gaps and mismatches**:

| Category | Status | Count | Impact |
|----------|--------|-------|--------|
| **Backend Endpoints** | Defined | 53 | Source of truth |
| **Frontend API Clients** | Implemented | 6 files | Partial coverage |
| **Missing Endpoints** | ❌ | 18+ | Breaking for MVP |
| **Wrong Endpoints** | ⚠️ | 5+ | Frontend calling non-existent routes |
| **Incomplete Parameters** | ⚠️ | 12+ | Missing filters, sorting, pagination |
| **Queue System** | ❌ Missing | 12 endpoints | Critical for agent orchestration |
| **Relay System** | ❌ Missing | 4 endpoints | Critical for NET ZERO |
| **Agent Endpoints** | ⚠️ Partial | 11 total, 6 missing | Pool management broken |

---

## Part 1: Backend Endpoints Catalog (Source of Truth)

### Core Health & Auth (5 endpoints)
```
✅ GET    /health                    - Health check (not called from frontend)
✅ GET    /info                      - App information (not called from frontend)
✅ POST   /auth/session              - Create session (not called from frontend)
✅ POST   /auth/validate             - Validate session (not called from frontend)
✅ POST   /auth/logout               - Logout (not called from frontend)
```

### Dashboard API (13 endpoints) — Job Management
```
✅ POST   /api/dashboard/jobs                          - Create job
✅ GET    /api/dashboard/jobs                          - List jobs (with status filter)
✅ GET    /api/dashboard/jobs/running                  - Get running jobs only
✅ GET    /api/dashboard/jobs/{job_id}                 - Get job details
✅ PATCH  /api/dashboard/jobs/{job_id}/complete        - Mark job complete
```

**Status**: Frontend implements 5/5, but missing some filters:
- ❌ Status filter NOT in frontend `listJobs()` - backend supports it
- ❌ Priority parameter NOT sent to backend
- ❌ Pagination (`limit`, `offset`) partially implemented but `offset` unused

### Dashboard API — Deployment Management  
```
✅ POST   /api/dashboard/deployments                       - Create deployment
✅ GET    /api/dashboard/deployments                       - List deployments
✅ GET    /api/dashboard/deployments/{deployment_id}       - Get deployment details
✅ GET    /api/dashboard/deployments/service/{service}     - Get service history
✅ POST   /api/dashboard/deployments/{id}/staging          - Record staging deploy
✅ POST   /api/dashboard/deployments/{id}/production       - Record production deploy
✅ POST   /api/dashboard/deployments/{id}/rollback         - Record rollback
```

**Status**: Frontend partially implements 6/7:
- ✅ `listDeployments()` - exists
- ✅ `getDeployment()` - exists  
- ❌ `getServiceDeployments()` - **NOT IN FRONTEND**
- ❌ `/staging` endpoint - **NOT IN FRONTEND**
- ❌ `/production` endpoint - **NOT IN FRONTEND**
- ✅ `rollbackDeployment()` - exists
- ❌ `cancelDeployment()` calling wrong endpoint (doesn't exist in backend)

### Dashboard API — Summary & Agents
```
✅ GET    /api/dashboard/summary                 - Dashboard summary (exists)
✅ GET    /api/dashboard/agents                  - Get all agents (exists)
```

**Status**: 
- ✅ `getDashboardSummary()` - exists in dashboard.ts
- ⚠️ `listAgents()` - in agents.ts but **calling `/api/dashboard/agents`**

### Agent API (11 endpoints) — Agent Lifecycle
```
✅ POST   /api/agents/register                   - Register new agent
✅ GET    /api/agents                            - List agents (with filters)
✅ GET    /api/agents/healthy                    - Get healthy agents only
✅ GET    /api/agents/pools                      - List agent pools
✅ POST   /api/agents/{agent_id}/heartbeat       - Agent heartbeat
✅ GET    /api/agents/{agent_id}                 - Get agent details
✅ PATCH  /api/agents/{agent_id}/status          - Update agent status
✅ POST   /api/agents/{agent_id}/deregister      - Deregister agent
✅ GET    /api/agents/pools/{pool_name}          - Get specific pool
```

**Status**: Frontend uses **WRONG ENDPOINT PREFIX**:
- ❌ Frontend calls `/api/dashboard/agents/*`
- ✅ Backend defines `/api/agents/*`
- ❌ Frontend calls `/api/dashboard/agent-pools/*` (doesn't exist)
- ✅ Backend defines `/api/agents/pools/*`

**Missing in Frontend**:
- ❌ `registerAgent()` - **NOT IN FRONTEND**
- ❌ `heartbeatAgent()` - **NOT IN FRONTEND**
- ❌ `updateAgentStatus()` - **NOT IN FRONTEND**
- ❌ `deregisterAgent()` - **NOT IN FRONTEND**
- ❌ `getHealthyAgents()` - **NOT IN FRONTEND**
- ❌ `getPoolDetails()` - **NOT IN FRONTEND**

### Queue API (12 endpoints) — Job Queue & Agent Orchestration
```
❌ POST   /api/queue/jobs                        - Enqueue job from dashboard
❌ POST   /api/queue/claim                       - Agent claims next job (atomic)
❌ PATCH  /api/queue/jobs/{job_id}/start         - Mark claimed job as running
❌ PATCH  /api/queue/jobs/{job_id}/complete      - Report job completion/failure
❌ GET    /api/queue/jobs                        - List queued jobs
❌ GET    /api/queue/jobs/{job_id}               - Get queued job details
❌ GET    /api/queue/stats                       - Queue statistics (depth, latency)
❌ POST   /api/queue/maintenance/requeue-expired - Requeue expired leases (cron)
```

**Status**: **COMPLETELY MISSING FROM FRONTEND**
- ❌ No `queue.ts` API client
- ❌ No `QueueChain` for state management
- ❌ No dashboard page showing queue depth/stats
- ❌ No agent claiming workflow implemented
- ❌ Agents have NO WAY to claim jobs

### Relay API (4 endpoints) — NET ZERO Registration & Heartbeats
```
❌ POST   /api/relays/register                   - Register relay (OAuth2)
❌ POST   /api/relays/heartbeat                  - Send relay health
❌ GET    /api/relays/{relay_id}                 - Get relay details
❌ DELETE /api/relays/{relay_id}                 - Delete relay
❌ GET    /api/relays/                           - List relays
```

**Status**: **COMPLETELY MISSING FROM FRONTEND**
- ❌ No `relay.ts` API client
- ❌ No relay registration UI
- ❌ No relay management page
- ❌ Users cannot register relays to enable NET ZERO

### Webhook Routes (3 endpoints)
```
✅ POST   /api/webhooks/{tool_id}               - Receive webhook
✅ GET    /api/webhooks                         - List webhooks
✅ GET    /api/webhooks/{tool_id}/health        - Webhook health
```

**Status**: Not relevant for MVP dashboard (backend system)

---

## Part 2: Frontend API Clients - Implementation Status

### Dashboard Client (`dashboard.ts` — 33 lines)
| Function | Backend Endpoint | Status | Notes |
|----------|------------------|--------|-------|
| `getSummary()` | `GET /api/dashboard/summary` | ✅ Exists | Returns jobs_running, jobs_failed_today, deployments_today, agents_healthy |

**Verdict**: ✅ COMPLETE but MINIMAL (only 1 function)

---

### Jobs Client (`jobs.ts` — 343 lines)

| Function | Backend Endpoint | Status | Notes |
|----------|------------------|--------|-------|
| `listJobs(params)` | `GET /api/dashboard/jobs` | ⚠️ Partial | Supports limit, offset, status, priority, sort_by, sort_order, search |
| `getJob(jobId)` | `GET /api/dashboard/jobs/{id}` | ✅ Exists | Direct ID lookup |
| `createJob(request)` | `POST /api/dashboard/jobs` | ✅ Exists | Creates new job record |
| `updateJob(jobId, request)` | `PATCH /api/dashboard/jobs/{id}` | ⚠️ Exists but used wrongly | Should be for completing jobs, not general updates |
| `deleteJob(jobId)` | `DELETE /api/dashboard/jobs/{id}` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `retryJob(jobId)` | `POST /api/dashboard/jobs/{id}/retry` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `cancelJob(jobId)` | `POST /api/dashboard/jobs/{id}/cancel` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `getJobStats()` | `GET /api/dashboard/jobs/stats` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `bulkDeleteJobs()` | `DELETE /api/dashboard/jobs` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `bulkCancelJobs()` | `POST /api/dashboard/jobs/bulk-cancel` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `exportJobsToCSV()` | `GET /api/dashboard/jobs/export` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |

**Verdict**: ⚠️ PARTIALLY BROKEN - Frontend calling 5+ non-existent endpoints

---

### Deployments Client (`deployments.ts` — 276 lines)

| Function | Backend Endpoint | Status | Notes |
|----------|------------------|--------|-------|
| `listDeployments(params)` | `GET /api/dashboard/deployments` | ✅ Exists | Supports limit, offset, status, environment, sort_by, sort_order, search |
| `getDeployment(deploymentId)` | `GET /api/dashboard/deployments/{id}` | ✅ Exists | Direct ID lookup |
| `createDeployment(request)` | `POST /api/dashboard/deployments` | ✅ Exists | Creates new deployment |
| `rollbackDeployment(deploymentId)` | `POST /api/dashboard/deployments/{id}/rollback` | ✅ Exists | Rolls back deployment |
| `cancelDeployment(deploymentId)` | `POST /api/dashboard/deployments/{id}/cancel` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `getDeploymentStats()` | `GET /api/dashboard/deployments/stats` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `getDeploymentHistory()` | `GET /api/dashboard/deployments/history` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |

**Missing Backend Endpoints NOT Called**:
- ❌ `getServiceDeployments()` for `GET /api/dashboard/deployments/service/{name}` - **Frontend doesn't call this**
- ❌ `recordStagingDeploy()` for `POST /api/dashboard/deployments/{id}/staging` - **Frontend doesn't call this**
- ❌ `recordProductionDeploy()` for `POST /api/dashboard/deployments/{id}/production` - **Frontend doesn't call this**

**Verdict**: ⚠️ PARTIALLY BROKEN - Missing 3 deployment workflow endpoints, calling 3+ non-existent endpoints

---

### Agents Client (`agents.ts` — 139 lines)

| Function | Backend Endpoint | Frontend Calls | Status | Notes |
|----------|------------------|-----------------|--------|-------|
| `listAgents(params)` | `GET /api/agents` | `GET /api/dashboard/agents` | ❌ **WRONG ENDPOINT** | Backend is `/api/agents`, not `/api/dashboard/agents` |
| `getAgent(agentId)` | `GET /api/agents/{id}` | `GET /api/dashboard/agents/{id}` | ❌ **WRONG ENDPOINT** | Same mismatch |
| `updateAgent(agentId, data)` | `PATCH /api/agents/{id}/status` | `PATCH /api/dashboard/agents/{id}` | ❌ **WRONG ENDPOINT** | Calling wrong prefix |
| `listAgentPools(params)` | `GET /api/agents/pools` | `GET /api/dashboard/agent-pools` | ❌ **WRONG ENDPOINT** | Backend is `/pools`, not `/agent-pools` |
| `createAgentPool(data)` | `POST /api/agents/pools` | `POST /api/dashboard/agent-pools` | ❌ **WRONG ENDPOINT** | Same mismatch |
| `updateAgentPool(poolId, data)` | `PATCH /api/agents/pools/{id}` | `PATCH /api/dashboard/agent-pools/{id}` | ❌ **WRONG ENDPOINT** | Same mismatch |
| `getAgentMetrics()` | Not in backend | `GET /api/dashboard/agents/metrics` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `pauseAgent(agentId)` | Not in backend | `POST /api/dashboard/agents/{id}/pause` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `resumeAgent(agentId)` | Not in backend | `POST /api/dashboard/agents/{id}/resume` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |

**Missing Agent Endpoints NOT IN FRONTEND**:
- ❌ `registerAgent()` for `POST /api/agents/register` - **NOT IMPLEMENTED**
- ❌ `getHealthyAgents()` for `GET /api/agents/healthy` - **NOT IMPLEMENTED**
- ❌ `heartbeatAgent()` for `POST /api/agents/{id}/heartbeat` - **NOT IMPLEMENTED** (CRITICAL for agent health)
- ❌ `deregisterAgent()` for `POST /api/agents/{id}/deregister` - **NOT IMPLEMENTED**
- ❌ `getPoolDetails()` for `GET /api/agents/pools/{name}` - **NOT IMPLEMENTED**

**Verdict**: 🔴 **SEVERELY BROKEN** - All agent endpoints have wrong prefix, multiple missing endpoints

---

### Logs Client (`logs.ts` — 43 lines)

| Function | Backend Endpoint | Status | Notes |
|----------|------------------|--------|-------|
| `getJobLogs(jobId, options)` | `GET /api/dashboard/jobs/{id}/logs` | ⚠️ Likely Missing | Backend endpoint not confirmed in dashboard_routes.py |

**Backend Status**: Endpoint NOT FOUND in `dashboard_routes.py`. Queue routes may have it, need verification.

**Verdict**: ⚠️ UNCERTAIN - Endpoint may not exist in backend

---

### Metrics Client (`metrics.ts` — 73 lines)

| Function | Backend Endpoint | Status | Notes |
|----------|------------------|--------|-------|
| `getDashboardMetrics()` | `GET /api/metrics/dashboard/` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `getJobTimeline(limit)` | `GET /api/metrics/jobs/timeline/?limit=` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |
| `getDeploymentMetrics()` | `GET /api/metrics/deployments/` | ❌ **NOT IN BACKEND** | Endpoint doesn't exist |

**Backend Status**: No `/api/metrics/*` routes found in backend codebase. Dashboard has `/api/dashboard/summary` instead.

**Verdict**: 🔴 **COMPLETELY WRONG** - All metrics endpoints use non-existent prefix

---

## Part 3: What's Missing - Critical Gaps

### ❌ QUEUE SYSTEM (12 endpoints, 0% implementation)
The entire queue system is missing from the frontend. This is CRITICAL because:
- Dashboard cannot enqueue jobs for agents
- Agents have no way to claim work (atomic job claiming)
- No queue depth monitoring
- No job priority handling

**Needed Frontend Files**:
```
/src/lib/api/queue.ts                    - Queue API client
/src/lib/chains/queue.ts                 - Queue state management chain
/src/app/dashboard/queue/page.tsx        - Queue monitoring page
```

---

### ❌ RELAY SYSTEM (4 endpoints, 0% implementation)
The entire relay system for NET ZERO is missing from the frontend. This breaks NET ZERO because:
- Users cannot register relays (user-deployed webhook forwarders)
- No relay health monitoring
- No relay management UI

**Needed Frontend Files**:
```
/src/lib/api/relay.ts                    - Relay API client
/src/lib/api/webhook.ts                  - Webhook management client
/src/lib/chains/relay.ts                 - Relay registration chain
/src/app/dashboard/relays/page.tsx       - Relay management page
/src/app/dashboard/webhooks/page.tsx     - Webhook configuration page
```

---

### ⚠️ AGENT SYSTEM (11 endpoints, ~45% implementation)
Frontend is calling WRONG ENDPOINTS for agents:
- All calls use `/api/dashboard/agents/*` instead of `/api/agents/*`
- Missing agent lifecycle endpoints (register, heartbeat, deregister)
- Missing pool management endpoints
- Pausing/resuming agents not in backend

**Fixes Needed**:
```
Change all endpoints from:
  /api/dashboard/agents/*
  /api/dashboard/agent-pools/*

To:
  /api/agents/*
  /api/agents/pools/*

Add missing functions:
  registerAgent(), heartbeatAgent(), deregisterAgent(), getHealthyAgents(), getPoolDetails()
```

---

### ⚠️ JOBS SYSTEM (5 endpoints implemented, 6+ broken)
Frontend is calling NON-EXISTENT endpoints:
- `DELETE /api/dashboard/jobs/{id}` - doesn't exist
- `POST /api/dashboard/jobs/{id}/retry` - doesn't exist
- `POST /api/dashboard/jobs/{id}/cancel` - doesn't exist
- `GET /api/dashboard/jobs/stats` - doesn't exist
- `DELETE /api/dashboard/jobs` - doesn't exist
- `POST /api/dashboard/jobs/bulk-cancel` - doesn't exist
- `GET /api/dashboard/jobs/export` - doesn't exist

**Also Missing**:
- `GET /api/dashboard/jobs/running` - Backend has it, frontend doesn't call it

---

### ⚠️ DEPLOYMENTS SYSTEM (4 endpoints implemented, 6+ missing)
Frontend is missing 3 critical deployment workflow endpoints:
- `GET /api/dashboard/deployments/service/{name}` - Get service deployment history
- `POST /api/dashboard/deployments/{id}/staging` - Record staging deployment
- `POST /api/dashboard/deployments/{id}/production` - Record production deployment

Frontend is calling NON-EXISTENT endpoints:
- `POST /api/dashboard/deployments/{id}/cancel` - doesn't exist
- `GET /api/dashboard/deployments/stats` - doesn't exist
- `GET /api/dashboard/deployments/history` - doesn't exist

---

### ❌ METRICS SYSTEM (0% implementation)
Frontend assumes metrics endpoints at `/api/metrics/*`, but they don't exist:
- `GET /api/metrics/dashboard/` - doesn't exist
- `GET /api/metrics/jobs/timeline/` - doesn't exist
- `GET /api/metrics/deployments/` - doesn't exist

**Backend Alternative**: Use `GET /api/dashboard/summary` instead

---

### ⚠️ LOGS SYSTEM (Uncertain)
Frontend calls `GET /api/dashboard/jobs/{id}/logs`, but endpoint NOT CONFIRMED in backend.

**Need to verify**: Does this endpoint exist in `queue_routes.py` or elsewhere?

---

## Part 4: CodeUChain Chain Audit

### Dashboard Chain
**File**: `/src/lib/chains/dashboard.ts`
**Status**: Exists but calls wrong API endpoints

### Jobs Chain
**File**: `/src/lib/chains/jobs.ts`
**Status**: Calls frontend functions that don't match backend

### Agents Chain
**File**: `/src/lib/chains/agents.ts`
**Status**: Calls WRONG ENDPOINT PREFIX

### Queue Chain
**File**: **MISSING** ❌
**Critical**: Cannot orchestrate job claiming without this

### Relay Chain
**File**: **MISSING** ❌
**Critical**: Cannot implement NET ZERO without relay registration

---

## Part 5: Dashboard Page Coverage

| Page | Backend Endpoints Needed | Frontend Uses | Status |
|------|--------------------------|---|--------|
| **Dashboard Overview** | `GET /summary`, `GET /jobs/running`, `GET /agents` | ✅ chains.dashboard | ⚠️ Partial - metrics endpoints wrong |
| **Jobs Page** | `GET /jobs`, `GET /jobs/{id}`, `POST /jobs`, queue endpoints | ✅ API clients | ⚠️ Calls non-existent endpoints |
| **Deployments Page** | `GET /deployments`, staging/production/rollback | ✅ API clients | ⚠️ Missing staging/production workflows |
| **Agents Page** | `GET /agents`, agent lifecycle | ❌ Wrong endpoints | 🔴 BROKEN - wrong prefix |
| **Queue Page** | `GET /queue/stats`, `GET /queue/jobs` | ❌ Missing | 🔴 NOT IMPLEMENTED |
| **Relays Page** | `POST /relays/register`, `GET /relays` | ❌ Missing | 🔴 NOT IMPLEMENTED |
| **Webhooks Page** | `GET /webhooks`, `POST /webhooks` | ❌ Missing | 🔴 NOT IMPLEMENTED |
| **Settings** | Auth endpoints | ❌ None | ⏳ Out of scope for MVP |

---

## Part 6: NET ZERO Architecture Alignment

### What NET ZERO Requires (Backend ✅)
1. ✅ Relay registration endpoint (`POST /api/relays/register`)
2. ✅ Relay heartbeats (`POST /api/relays/heartbeat`)
3. ✅ Queue integration (user-owned)
4. ✅ Stateless orchestration

### What Frontend Needs to Implement (Frontend ❌❌❌)
1. ❌ Relay registration UI - **MISSING**
2. ❌ Relay management dashboard - **MISSING**
3. ❌ Webhook configuration - **MISSING**
4. ❌ Queue depth monitoring - **MISSING**

**Verdict**: Frontend does NOT implement NET ZERO user workflows

---

## Part 7: Summary Table - All Endpoints

### Coverage Matrix

| System | Backend Endpoints | Frontend Implements | Frontend Calls Correctly | Status |
|--------|-------------------|---------------------|--------------------------|--------|
| **Auth/Health** | 5 | 0 | 0 | ⏳ Not MVP priority |
| **Dashboard Summary** | 2 | 1 | 1 | ✅ Complete |
| **Jobs** | 5 | 8 | 3 | ⚠️ Calls 5 wrong endpoints |
| **Deployments** | 7 | 4 | 4 | ⚠️ Missing 3 workflow endpoints |
| **Agents** | 11 | 9 | 0 | 🔴 All wrong prefix |
| **Queue** | 12 | 0 | 0 | 🔴 CRITICAL - Missing |
| **Relay** | 4 | 0 | 0 | 🔴 CRITICAL - Missing |
| **Webhooks** | 3 | 0 | 0 | ⏳ Not MVP priority |
| **Metrics** | 1 | 3 | 0 | 🔴 Wrong endpoints |
| **Logs** | 1 (unconfirmed) | 1 | ? | ⚠️ Unconfirmed |
| **TOTAL** | **53** | **26** | **8** | 🔴 **15% correct** |

---

## Part 8: Impact Assessment

### 🔴 BLOCKING ISSUES (Must fix for MVP)

1. **Agent Endpoints - Wrong Prefix** (SEVERITY: HIGH)
   - All 9 agent functions call `/api/dashboard/agents` instead of `/api/agents`
   - Agents page will 404 on every call
   - **Fix Time**: 1 hour
   - **Files**: `src/lib/api/agents.ts` (change 9 URLs)

2. **Queue System Missing** (SEVERITY: CRITICAL)
   - No `queue.ts` API client
   - No queue state management chain
   - Agents cannot claim jobs
   - **Fix Time**: 4-6 hours
   - **Files**: Create queue.ts, QueueChain, queue dashboard page

3. **Relay System Missing** (SEVERITY: CRITICAL for NET ZERO)
   - No `relay.ts` API client
   - No relay registration UI
   - Users cannot deploy relays
   - **Fix Time**: 4-6 hours
   - **Files**: Create relay.ts, relay dashboard page, webhook config page

4. **Metrics Endpoints Wrong** (SEVERITY: MEDIUM)
   - Frontend assumes `/api/metrics/dashboard/` but it doesn't exist
   - Should use `/api/dashboard/summary` instead
   - **Fix Time**: 30 minutes
   - **Files**: `src/lib/api/metrics.ts`, `src/lib/chains/dashboard.ts`

### ⚠️ SECONDARY ISSUES (Should fix before MVP launch)

5. **Jobs Calling Wrong Endpoints** (SEVERITY: MEDIUM)
   - `deleteJob()`, `retryJob()`, `cancelJob()` don't exist in backend
   - These functions will fail at runtime
   - **Fix Time**: 2 hours
   - **Files**: `src/lib/api/jobs.ts` (remove or implement in backend)

6. **Deployments Missing Workflow Endpoints** (SEVERITY: MEDIUM)
   - No staging/production deployment tracking
   - No service history view
   - **Fix Time**: 2-3 hours
   - **Files**: `src/lib/api/deployments.ts` (add getServiceDeployments, recordStagingDeploy, recordProductionDeploy)

7. **Logs Endpoint Unconfirmed** (SEVERITY: LOW)
   - `GET /api/dashboard/jobs/{id}/logs` not found in backend search
   - Need to verify if it exists elsewhere
   - **Fix Time**: 30 minutes
   - **Files**: Verify in backend, update frontend

8. **Missing Agent Lifecycle Functions** (SEVERITY: MEDIUM)
   - `registerAgent()`, `heartbeatAgent()`, `deregisterAgent()` not in frontend
   - Agents cannot self-register or report health
   - **Fix Time**: 1.5 hours
   - **Files**: `src/lib/api/agents.ts` (add 5 missing functions)

---

## Part 9: Recommended Fix Priority

### Phase 1: Critical Path (2-3 hours)
These block core functionality:

1. **Fix Agent Endpoint Prefixes** (1 hour)
   - Change all `/api/dashboard/agents` → `/api/agents`
   - Change all `/api/dashboard/agent-pools` → `/api/agents/pools`

2. **Fix Metrics Endpoints** (30 min)
   - Change `/api/metrics/*` calls to use `/api/dashboard/summary`

3. **Add Missing Agent Functions** (1 hour)
   - Add `registerAgent()`, `heartbeatAgent()`, `deregisterAgent()`, etc.

### Phase 2: MVP Blockers (6-8 hours)
Required for MVP dashboard:

4. **Implement Queue System** (4-6 hours)
   - Create `queue.ts` API client (POST/GET `/api/queue/*`)
   - Create `QueueChain` for state management
   - Create queue monitoring page
   - Add job claiming UI for agents

5. **Implement Relay System** (4-6 hours)
   - Create `relay.ts` API client
   - Create relay registration page
   - Create webhook configuration UI
   - Add relay health monitoring

### Phase 3: Polish (4-5 hours)
Before launch:

6. **Fix Jobs Broken Endpoints** (2 hours)
   - Remove non-existent endpoint calls
   - Add missing `GET /jobs/running` support

7. **Add Deployment Workflows** (2-3 hours)
   - Add staging/production deployment recording
   - Add service deployment history view
   - Add proper rollback workflow

8. **Verify All Logs** (30 min)
   - Confirm logs endpoint exists
   - Update frontend if needed

---

## Part 10: Code Changes Needed

### File: `src/lib/api/agents.ts`
**Change**: All `/api/dashboard/agents` → `/api/agents`
**Also Change**: All `/api/dashboard/agent-pools` → `/api/agents/pools`
**Add**: `registerAgent()`, `heartbeatAgent()`, `deregisterAgent()`, `getPoolDetails()`
**Remove**: `pauseAgent()`, `resumeAgent()` (not in backend)

### File: `src/lib/api/queue.ts` (NEW)
**Create**: API client for queue endpoints
**Functions**: `enqueueJob()`, `claimJob()`, `startJob()`, `completeJob()`, `getQueueStats()`, `listQueuedJobs()`

### File: `src/lib/api/relay.ts` (NEW)
**Create**: API client for relay endpoints
**Functions**: `registerRelay()`, `getRelay()`, `deleteRelay()`, `listRelays()`, `sendHeartbeat()`

### File: `src/lib/chains/queue.ts` (NEW)
**Create**: CodeUChain for queue state management
**Links**: JobEnqueueLink, JobClaimLink, JobProgressLink, QueueStatsLink

### File: `src/lib/chains/relay.ts` (NEW)
**Create**: CodeUChain for relay registration
**Links**: RelayRegistrationLink, RelayValidationLink, WebhookConfigLink

### File: `src/app/dashboard/queue/page.tsx` (NEW)
**Create**: Queue monitoring dashboard

### File: `src/app/dashboard/relays/page.tsx` (NEW)
**Create**: Relay management dashboard

### File: `src/app/dashboard/webhooks/page.tsx` (NEW)
**Create**: Webhook configuration dashboard

---

## Conclusion

**Overall Status**: 🔴 **CRITICAL - Frontend is NOT production-ready**

**Key Findings**:
- Only **15% of backend endpoints** are correctly called from frontend
- **5 major systems are completely missing** (queue, relay, webhooks, proper metrics, logs verification)
- **All agent endpoints use wrong prefix** and will 404
- Frontend assumes endpoints that don't exist in backend
- **NET ZERO workflows are not implemented** (no relay registration UI)

**Recommendation**: 
Do NOT proceed with current MVP launch. Implement fixes in this order:
1. Fix agent endpoint prefixes (1 hour)
2. Fix metrics endpoint (30 min)
3. Implement queue system (4-6 hours)
4. Implement relay system (4-6 hours)
5. Add missing functions and workflows (4-5 hours)

**Total Effort to Fix**: ~15-18 hours
**Without Fixes**: Frontend will fail on agent operations, queue management, relay setup, and metrics

This is a **foundational alignment issue** that must be resolved before MVP launch.
