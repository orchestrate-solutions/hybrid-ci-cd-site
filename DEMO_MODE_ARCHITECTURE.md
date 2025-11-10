# Demo Mode Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SETTINGS                            │
│                                                                 │
│  Demo Mode Toggle (localStorage: hybrid-prefs.demoMode)        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │   OFF   │  │   ON    │  │  AUTO   │                         │
│  │(Real)   │  │(Demo)   │  │(Future) │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Client-Side)                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────┐     │
│  │  Jobs API   │  │ Deployments API │  │  Agents API    │     │
│  │             │  │                 │  │                │     │
│  │isDemoMode() │  │isDemoMode()     │  │isDemoMode()    │     │
│  │   ✓ Check   │  │   ✓ Check       │  │   ✓ Check      │     │
│  │             │  │                 │  │                │     │
│  └─────────────┘  └─────────────────┘  └────────────────┘     │
│                                                                 │
│  Each has same pattern:                                         │
│  if (isDemoMode()) {                                            │
│    return getDemoData()  // No network                          │
│  } else {                                                       │
│    fetch(backend)        // Real API                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
         ↓ TRUE (Demo)                 ↓ FALSE (Real)
         
┌────────────────────────────┐    ┌──────────────────────┐
│  LOCAL MOCK DATA           │    │   BACKEND API        │
│  (demo-data.ts)            │    │   (http://localhost) │
│                            │    │                      │
│ DEMO_JOBS                  │    │ GET /api/jobs        │
│ DEMO_DEPLOYMENTS           │    │ GET /api/deployments │
│ DEMO_AGENTS                │    │ GET /api/agents      │
│ DEMO_METRICS               │    │ GET /api/metrics     │
│ DEMO_LOGS                  │    │                      │
│                            │    │ (or error if down)   │
│ getDemoJobsResponse()      │    │                      │
│ getDemoDeploymentsResp()   │    │                      │
│ getDemoAgentsResponse()    │    │                      │
└────────────────────────────┘    └──────────────────────┘
         ↓                                  ↓
         └──────────┬───────────────────────┘
                    ↓
        ┌──────────────────────────┐
        │   REACT COMPONENTS       │
        │                          │
        │  <JobsPage />            │
        │  <DeploymentsPage />     │
        │  <AgentsPage />          │
        │  <DashboardOverview />   │
        │                          │
        │  (Same code regardless   │
        │   of data source)        │
        └──────────────────────────┘
                    ↓
        ┌──────────────────────────┐
        │   USER SEES:             │
        │                          │
        │  Realistic mock data     │
        │     (when demo ON)       │
        │                          │
        │  Real backend data       │
        │     (when demo OFF)      │
        └──────────────────────────┘
```

---

## Data Flow: Demo vs Real

### Demo Mode Flow
```
User toggles Demo ON
       ↓
localStorage.setItem('hybrid-prefs', { demoMode: true })
       ↓
User navigates to /dashboard/jobs
       ↓
<JobsPage /> renders
       ↓
useJobs hook calls jobsApi.listJobs()
       ↓
listJobs() checks isDemoModeEnabled()
       ↓
✅ TRUE: Returns getDemoJobsResponse()
       ↓
{ jobs: [5 demo jobs], total: 5, limit: 100, offset: 0 }
       ↓
<JobsPage /> renders with demo jobs (no network)
       ↓
✅ INSTANT - No loading spinner, no network delay
```

### Real Mode Flow
```
User toggles Demo OFF
       ↓
localStorage.setItem('hybrid-prefs', { demoMode: false })
       ↓
User navigates to /dashboard/jobs
       ↓
<JobsPage /> renders
       ↓
useJobs hook calls jobsApi.listJobs()
       ↓
listJobs() checks isDemoModeEnabled()
       ↓
❌ FALSE: Makes real backend request
       ↓
fetch('http://localhost:8000/api/dashboard/jobs')
       ↓
✅ Backend responds: { jobs: [...], total: N, ... }
       ↓
<JobsPage /> renders with real data
       ↓
⏱️ DELAYED - Network latency depends on backend
```

---

## Code Pattern (Replicated 3x)

### Jobs API Example
```typescript
// ✅ Pattern used in: jobs.ts, deployments.ts, agents.ts

function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const prefs = localStorage.getItem('hybrid-prefs');
    if (!prefs) return false;
    const parsed = JSON.parse(prefs);
    return parsed.demoMode === true;
  } catch {
    return false;
  }
}

export async function listJobs(params = {}): Promise<ListJobsResponse> {
  // STEP 1: Check demo mode
  if (isDemoModeEnabled()) {
    return getDemoJobsResponse();
  }
  
  // STEP 2: If not demo, make real request
  const url = `${BASE_URL}/api/dashboard/jobs?...`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function getJob(jobId: string): Promise<GetJobResponse> {
  // STEP 1: Check demo mode
  if (isDemoModeEnabled()) {
    const demoJobs = getDemoJobs();
    const job = demoJobs.find(j => j.id === jobId);
    if (job) return { job };
    throw new Error(`Job not found in demo: ${jobId}`);
  }
  
  // STEP 2: If not demo, make real request
  const res = await fetch(`${BASE_URL}/api/dashboard/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Job not found: ${jobId}`);
  return res.json();
}
```

### Mock Data Shape
```typescript
// All response shapes match backend exactly

// Real Backend Response
{
  jobs: [
    { id: '123', name: 'Job', status: 'RUNNING', ... },
    ...
  ],
  total: 5,
  limit: 100,
  offset: 0
}

// Demo Response (same shape)
getDemoJobsResponse() → {
  jobs: DEMO_JOBS,           // [5 demo jobs]
  total: DEMO_JOBS.length,   // 5
  limit: 100,
  offset: 0
}
```

---

## File Organization

```
src/
├── lib/
│   ├── api/
│   │   ├── metrics.ts           ✅ Already had demo check
│   │   ├── jobs.ts              ✅ Updated with isDemoMode()
│   │   ├── deployments.ts       ✅ Updated with isDemoMode()
│   │   └── agents.ts            ✅ Updated with isDemoMode()
│   │
│   ├── mocks/
│   │   └── demo-data.ts         ✅ New response formatters:
│   │                                 getDemoJobsResponse()
│   │                                 getDemoDeploymentsResponse()
│   │                                 getDemoAgentsResponse()
│   │
│   └── hooks/
│       └── useUserPreferences.ts ✅ demoMode preference storage
│
└── components/
    └── dashboard/
        └── DemoModeToggle.tsx    ✅ Settings UI control
```

---

## Error Handling

### When Demo Data Not Found
```typescript
if (isDemoModeEnabled()) {
  const demoJobs = getDemoJobs();
  const job = demoJobs.find(j => j.id === jobId);
  
  if (job) {
    // ✅ Found in mock data
    return { job };
  }
  
  // ❌ Not in mock data
  throw new Error(`Job not found in demo: ${jobId}`);
}
```

### When Backend Down (Real Mode)
```typescript
// If demo is OFF and backend unreachable:
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Failed to list jobs: ${res.status}`);
  // Component catches error, shows "No data available"
}
```

### Graceful Defaults
```typescript
// All checks have fallback to false
function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;  // Server-side safe
  try {
    const prefs = localStorage.getItem('hybrid-prefs');
    if (!prefs) return false;                        // No prefs → use real
    const parsed = JSON.parse(prefs);
    return parsed.demoMode === true;
  } catch {
    return false;                                    // Parse error → use real
  }
}
```

---

## Performance

### Demo Mode (Fast ⚡)
```
Time: ~1-5ms (localStorage lookup + return)
Network: ❌ None
Caching: ✅ In-memory (no disk I/O)
Latency: Instant
```

### Real Mode (Depends on Backend ⏱️)
```
Time: ~200-1000ms (depends on backend)
Network: ✅ HTTP request to backend
Caching: Optional (depends on implementation)
Latency: Backend dependent
```

---

## Summary

**Demo mode uses a client-side decision point** in each API client:

1. **Check localStorage** → Is demo mode ON?
2. **If YES** → Return mock data (instant, no network)
3. **If NO** → Make real API request (network dependent)
4. **Components receive same response shape** either way
5. **No changes to UI code** needed

This makes demo mode transparent, performant, and easy to toggle.
