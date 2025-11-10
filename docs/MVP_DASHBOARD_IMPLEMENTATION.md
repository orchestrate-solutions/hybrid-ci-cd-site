# MVP Dashboard Implementation Plan

**Status**: Ready to Build  
**Date**: November 10, 2025  
**Target**: Lean, working, modular, future-proof  
**Duration**: 2-3 weeks  

---

## Executive Summary

Build a **unified DevOps workspace** where engineers monitor and control jobs, deployments, and agents in real-time. Show top tools first (GitHub Actions, Terraform, Prometheus, Grafana, Docker, Jenkins, Kubernetes). Keep it **modular** so AI, advanced approvals, and new features slot in without rewiring. Ship working features now, grow later.

**Key Philosophy**: No overly complex business logic. A place that works and feels unifying. Extensible by design.

---

## Architecture Overview

### Modular Stack (Reusable Components)

```
Pages (Entry Points)
    ↓
CodeUChain Chains (State Management)
    ↓
API Clients (Typed, Versioned)
    ↓
Backend APIs (Already Built ✅)
```

### Real-Time Strategy

**User Controls Refresh Rate via Slider**:

| Mode | Behavior | Warning | Use Case |
|------|----------|---------|----------|
| **Live** 🟢 | Poll every 1-2s (or WebSocket) | None | On-call, incident response |
| **Efficient** 🟡 | Poll every 10-30s, toast on update | Yellow | Daily monitoring, cost-conscious |
| **Off** 🔴 | Manual refresh only | Red | Demo, testing, bandwidth-limited |

**Storage**: localStorage (MVP) → database (v2)

### Tool Ranking (Real 2025 Data)

1. **GitHub Actions** - #1 CI/CD (native GitHub)
2. **Terraform** - #1 IaC
3. **Prometheus** - #1 open-source monitoring
4. **Grafana** - Visualization for Prometheus
5. **Docker** - Container runtime
6. **Jenkins** - #2 CI/CD (legacy)
7. **Kubernetes** - Container orchestration

---

## Implementation Checklist (10 Steps)

### Step 1: Dashboard Overview Page
**File**: `src/app/dashboard/page.tsx`  
**What**: Real-time status counters + top 7 tool cards  
**Components Needed**:
- `StatusCard` - Shows count + status badge (✅ running, ⚠️ warning, ❌ failed)
- `ToolCard` - Tool name + status + link to external tool
- `MetricsGrid` - Responsive grid for cards

**Data from Backend**:
```
GET /api/dashboard/summary
→ { jobs_running, jobs_failed_today, deployments_today, agents_healthy }

GET /api/tools/status (or hardcoded for MVP)
→ [ { tool: "github-actions", status: "healthy", count: 12 }, ... ]
```

**Real-Time**: Respects slider setting (poll every 10-30s)

---

### Step 2: Jobs Page with Inline Logs
**File**: `src/app/dashboard/jobs/page.tsx`  
**What**: List jobs, filter, view logs inline  
**Components Needed**:
- `JobsTable` - MUI Data Grid (already exists ✅)
- `LogViewer` - Expandable inline log panel (NEW)
- `FilterBar` - Status, priority, date range filters

**LogViewer Details**:
- Expandable row → shows last 100 lines of logs
- Fetch on expand: `GET /api/jobs/{jobId}/logs`
- Tail capability: Optional "Follow logs" checkbox (real-time if Live mode)
- Search within logs: Cmd+F support

**Quick Actions**:
- Retry button: `POST /api/jobs/{jobId}/retry`
- Cancel button: `POST /api/jobs/{jobId}/cancel`

**Real-Time**: Poll job status every 10-30s, auto-refresh table

---

### Step 3: Deployments Page - Timeline
**File**: `src/app/dashboard/deployments/page.tsx`  
**What**: Timeline of deployments through environments  
**Components Needed**:
- `DeploymentTimeline` - Vertical timeline showing staging → production (NEW)
- `DeploymentStatusBadge` - Status indicators (DRAFT, STAGED, LIVE, ROLLED_BACK)
- `RollbackModal` - Confirm rollback + record reason

**Timeline Flow**:
```
Version 2.5.0
├─ Drafted: Nov 10, 2:00 PM (by alice@example.com)
├─ Promoted to Staging: Nov 10, 2:15 PM ✅
├─ Tests Passed: Nov 10, 2:45 PM ✅
├─ Approved for Production: Nov 10, 3:00 PM (by bob@example.com)
└─ Live in Production: Nov 10, 3:05 PM ✅

Version 2.4.9 (Previous)
├─ Rolled back: Nov 9, 4:30 PM
└─ Reason: "Database migration issue"
```

**Data from Backend**:
```
GET /api/dashboard/deployments
→ [ { id, version, status, deployed_to_staging, deployed_to_production, 
     staged_at, production_at, rolled_back_reason }, ... ]
```

**Rollback Action**:
- Button: "Rollback to 2.4.9"
- Modal: Confirm + enter reason
- `POST /api/dashboard/deployments/{id}/rollback { reason: "..." }`

**No Approval Workflow Yet** (v2 feature)

---

### Step 4: Agents Page - Pool Management
**File**: `src/app/dashboard/agents/page.tsx`  
**What**: Real-time pool health + diagnostics  
**Components Needed**:
- `PoolHealthCard` - CPU%, memory%, disk%, healthy agent count
- `MetricsChart` - Simple line chart for CPU/memory trends (optional MVP)
- `AgentsList` - Table showing individual agents + last heartbeat
- `PoolActionsPanel` - Drain pool, scale up/down buttons

**Data from Backend**:
```
GET /api/agents
→ [ { id, status, pool_name, cpu_percent, memory_percent, disk_percent, 
     last_heartbeat, jobs_queued, jobs_completed }, ... ]

GET /api/agents/pools
→ [ { name, total, healthy, unhealthy, queue_depth }, ... ]
```

**Actions**:
- Drain pool: `PATCH /api/agents/pools/{pool_name} { state: "draining" }`
- Scale: `POST /api/agents/pools/{pool_name}/scale { count: 5 }`

**Real-Time**: Auto-refresh every 10-30s

---

### Step 5: Settings Page
**File**: `src/app/dashboard/settings/page.tsx`  
**What**: User preferences  
**Components Needed**:
- `RefreshSlider` - Live ↔ Efficient ↔ Off (NEW)
- `ThemeToggle` - Dark/light mode (already have this ✅)
- `PreferencesSummary` - Display current settings

**Slider Visual**:
```
🔴─────🟡──────🟢
 Off    Efficient Live

Refresh every: [ 30 seconds ▼ ] (show warning if "Off")
Status: ⚠️ Efficient mode - some updates may be delayed
```

**Storage**:
```typescript
interface UserPreferences {
  realTimeMode: 'off' | 'efficient' | 'live';
  refreshIntervalSeconds: 10 | 15 | 30 | 60;
  theme: 'light' | 'dark';
}
```

Store in localStorage (MVP):
```typescript
localStorage.setItem('hybrid-prefs', JSON.stringify(preferences));
```

---

### Step 6: Tool Status Cards
**File**: `src/components/dashboard/ToolStatusCard.tsx` (NEW)  
**What**: Read-only cards showing tool status  
**Display**:
```
┌─────────────────┐
│ GitHub Actions  │ 🟢
├─────────────────┤
│ 12 workflows    │
│ running         │
│                 │
│ [View in GH] →  │
└─────────────────┘
```

**Tools (MVP - Static List)**:
1. GitHub Actions - count: workflows_running
2. Terraform - count: deployments_queued
3. Prometheus - count: alerts_active
4. Grafana - link to dashboards (no count)
5. Docker - count: images_available
6. Jenkins - count: builds_running
7. Kubernetes - count: pods_running

**Data Source** (MVP):
- Hardcoded status cards + links
- No backend integration yet (v2 feature)
- Click → opens tool in new tab (external link)

**Future** (v2):
- Backend API: `GET /api/tools/status`
- Real-time updates
- Webhook ingestion

---

### Step 7: Placeholder Slots for Future
**Files**: Dashboard, Jobs, Deployments pages  
**What**: Grayed-out "Coming Soon" sections  

**Example on Overview**:
```
┌─────────────────────────────────────────┐
│ 🔒 AI Evaluations (Coming Soon)        │
│ Auto-detect anomalies in logs            │
│ Powered by LLM analysis                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔒 Advanced Approvals (v2)              │
│ Multi-stage approval workflows           │
│ SLA enforcement & audit trails           │
└─────────────────────────────────────────┘
```

**Benefits**:
- Shows platform is extensible
- Manages user expectations
- Placeholder architecture ready for v2

---

### Step 8: Real-Time Update Strategy
**File**: `src/lib/hooks/useRealTime.ts` (NEW)  
**What**: Poll-based refresh mechanism

**Implementation**:
```typescript
// lib/hooks/useRealTime.ts
export function useRealTime(callback: () => Promise<any>, interval = 15000) {
  const [prefs] = useUserPreferences();
  
  // Compute interval based on preference
  const effectiveInterval = 
    prefs.realTimeMode === 'off' ? null :
    prefs.realTimeMode === 'efficient' ? 30000 :
    10000; // 'live'
  
  useEffect(() => {
    if (!effectiveInterval) return;
    
    const timer = setInterval(callback, effectiveInterval);
    return () => clearInterval(timer);
  }, [effectiveInterval]);
}
```

**Usage**:
```typescript
// In component
useRealTime(async () => {
  const jobs = await jobsApi.list();
  setJobs(jobs);
}, [jobs, setJobs]);
```

**Warning Indicators**:
- Efficient mode: Yellow badge "⚠️ Some updates delayed"
- Off mode: Red badge "🔴 Manual refresh only"

**Future** (v2):
- WebSocket support (no polling)
- Server-Sent Events (SSE)
- Configurable intervals

---

### Step 9: Responsive Design + Mobile Testing
**Test Cases**:
1. **Mobile (375px)**
   - Sidebar hidden, hamburger visible
   - Cards stack vertically
   - Tables convert to card layout
   
2. **Tablet (768px)**
   - Sidebar visible on md+ breakpoint
   - 2-column card layout
   
3. **Desktop (1200px)**
   - 3-column card layout
   - Full tables visible

**Tools**:
- Chrome DevTools responsive mode
- Manual testing on mobile device (if available)
- Cypress viewport tests (v2)

---

### Step 10: E2E Tests (Cypress)
**File**: `cypress/e2e/dashboard.cy.ts` (NEW)  
**Tests**:
1. View overview → see jobs/deployments/agents counts
2. Navigate to jobs → create job → verify appears in table
3. Click job → expand logs → verify log content loads
4. Filter jobs by status → verify filter works
5. Navigate to deployments → verify timeline renders
6. Click rollback → enter reason → verify confirmation
7. Navigate to agents → verify pool health displays
8. Open settings → toggle real-time slider → verify interval changes
9. Toggle theme → verify dark/light mode switches
10. Test responsive design → sidebar hidden on mobile, hamburger works

---

## Backend APIs (Already Built ✅)

All required endpoints already exist:

```
Jobs:
  GET /api/dashboard/jobs
  GET /api/dashboard/jobs/{id}
  GET /api/dashboard/jobs/{id}/logs  ← NEW (add if missing)
  POST /api/dashboard/jobs/{id}/retry
  POST /api/dashboard/jobs/{id}/cancel

Deployments:
  GET /api/dashboard/deployments
  GET /api/dashboard/deployments/{id}
  POST /api/dashboard/deployments/{id}/rollback

Agents:
  GET /api/agents
  GET /api/agents/pools
  PATCH /api/agents/pools/{pool_name}
  POST /api/agents/pools/{pool_name}/scale

Dashboard:
  GET /api/dashboard/summary
```

---

## Frontend Architecture (Modular by Design)

### 1. API Clients
**Files**: `src/lib/api/`
```
jobs.ts (existing ✅)
deployments.ts (existing ✅)
agents.ts (existing ✅)
dashboard.ts (NEW)  → GET /api/dashboard/summary
logs.ts (NEW)       → GET /api/jobs/{id}/logs
tools.ts (NEW)      → Placeholder for v2 tool API
```

### 2. CodeUChain Chains
**Files**: `src/lib/chains/`
```
jobs.ts (existing ✅) - fetch, filter, paginate
deployments.ts (existing ✅) - fetch, sort
agents.ts (existing ✅) - fetch, aggregate health
dashboard.ts (NEW) - fetch all summaries, orchestrate
tools.ts (NEW) - Placeholder for v2 tool integration
approvals.ts (NEW placeholder) - Reserved for v2
```

### 3. Custom Hooks
**Files**: `src/lib/hooks/`
```
useJobs.ts (existing ✅)
useDeployments.ts (existing ✅)
useAgents.ts (existing ✅)
useDashboard.ts (NEW) - Orchestrate all three
useRealTime.ts (NEW) - Poll-based refresh
useUserPreferences.ts (NEW) - Store/retrieve settings
```

### 4. Components (Field + Domain)
**Fields** (9 total - existing ✅):
- TextField, SelectField, CheckboxField, TextareaField, RadioGroup, DateField, NumberField, PasswordField, FileField

**Domain Components** (new):
```
src/components/dashboard/
├─ DashboardOverview.tsx
├─ StatusCard.tsx
├─ ToolStatusCard.tsx
├─ MetricsGrid.tsx
├─ ComingSoonCard.tsx
├─ SettingsPage.tsx
├─ RefreshSlider.tsx

src/components/jobs/
├─ JobsTable.tsx (existing ✅)
├─ LogViewer.tsx (NEW)
├─ FilterBar.tsx

src/components/deployments/
├─ DeploymentsTimeline.tsx (NEW)
├─ TimelineItem.tsx
├─ RollbackModal.tsx

src/components/agents/
├─ PoolHealthCard.tsx (NEW)
├─ AgentsList.tsx
├─ PoolActionsPanel.tsx
```

### 5. Pages
```
src/app/dashboard/page.tsx (overview)
src/app/dashboard/jobs/page.tsx
src/app/dashboard/deployments/page.tsx
src/app/dashboard/agents/page.tsx
src/app/dashboard/settings/page.tsx
```

---

## Key Design Principles (Future-Proofing)

### 1. **Modular Components**
- Each component is standalone, testable
- Props-driven, no globals
- Composable into larger pages

### 2. **Extensible Chains**
- Each domain has its own chain (Jobs, Deployments, Agents)
- Easy to add new chains (Approvals, Webhooks, AI, etc.) without touching existing code

### 3. **Pluggable Real-Time**
- `useRealTime()` hook is polling-based (MVP)
- Architecture supports WebSocket upgrade (v2)
- User preferences control behavior

### 4. **Placeholder Architecture**
- "Coming Soon" cards show where AI, approvals, plugins slot in
- Signals extensibility to users
- Easy to fill in later without breaking existing features

### 5. **Type-Safe APIs**
- All API clients are typed (TypeScript interfaces)
- Backend responses validated
- Safe to refactor

---

## Success Criteria

### MVP Complete When:
- ✅ Dashboard overview shows job/deployment/agent counts + top 7 tools
- ✅ Jobs page has inline log viewer + quick actions (retry, cancel)
- ✅ Deployments page shows timeline + rollback capability
- ✅ Agents page shows pool health + drain/scale actions
- ✅ Settings page has real-time slider + theme toggle
- ✅ Real-time updates work (poll every 10-30s by default)
- ✅ Mobile responsive (sidebar hidden on mobile, hamburger works)
- ✅ E2E tests cover key workflows
- ✅ All tests passing (no regressions)
- ✅ No overly complex business logic

### Performance Targets:
- Page load: < 2s
- API response: < 500ms
- Poll interval: 10-30s (user configurable)
- Bundle size: No increase > 10%

### Testing Targets:
- Unit tests: 80%+ coverage on components
- E2E tests: Key workflows covered (10+ test cases)
- Component tests: All new components have Cypress tests

---

## Timeline

**Week 1**: Steps 1-3 (Overview, Jobs, Deployments)
**Week 2**: Steps 4-6 (Agents, Settings, Tools)
**Week 3**: Steps 7-10 (Placeholders, Real-Time, Testing)

**Total**: ~2-3 weeks for working MVP

---

## Decisions Made

1. **Real-Time Strategy**: Polling (not WebSocket) for MVP
   - Simpler to implement
   - Works with existing backend
   - User controls via slider (Live, Efficient, Off)

2. **Tool Cards**: Static list for MVP
   - No backend API integration yet
   - Links to external tools
   - Easy to make dynamic in v2

3. **Approval Workflow**: Not in MVP
   - Adds complexity
   - v2 feature with full audit trail
   - Current deployments track status only

4. **Profile Export**: Not in MVP
   - Single user MVP
   - v2 feature for team sharing
   - localStorage for user preferences now

5. **Modular Design**:
   - Chains for each domain (extensible)
   - Hooks for reusable logic
   - Placeholder components for future features
   - Easy to add AI, approvals, plugins without refactoring

---

## What NOT to Do

❌ Don't add multi-tenant complexity  
❌ Don't build approval workflows  
❌ Don't integrate external tool webhooks  
❌ Don't optimize performance prematurely  
❌ Don't add advanced theming or customization  
❌ Don't build the plugin system  

**Focus**: Build something that works, feels unifying, and can grow.

---

## Next: Implementation Starts Now

1. Create todo subtasks (already done ✅)
2. Start with Step 1: Dashboard Overview
3. Build incrementally, test after each step
4. Ship working features quickly
5. Iterate based on feedback

**Go time.**

---

**Owner**: @jwink  
**Status**: Ready to Build  
**Commit**: Use conventional commits (feat: ..., fix: ..., test: ...)  
**Branch**: feat/mvp-dashboard (or similar)
