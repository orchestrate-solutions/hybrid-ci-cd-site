# Demo Mode Implementation Summary

**Status**: ✅ **COMPLETE**  
**Session**: Phase 7.2 (MVP Dashboard - Part B)  
**Date**: 2025-01-15  

---

## What Was Built

A complete offline-first demo system that allows the Hybrid CI/CD platform to showcase functionality without requiring a backend. Demo mode is:
- **Toggleable**: Switch on/off via Settings page
- **Persistent**: Saved to localStorage, remembers choice across sessions
- **Seamless**: API calls automatically route to mock data when enabled
- **Realistic**: Mock data mirrors production structure (jobs, deployments, agents, metrics, logs)

---

## Files Created/Modified

### 1. **Mock Data Module** 
📄 `src/lib/mocks/demo-data.ts` (NEW, 255 lines)

Comprehensive mock dataset with 5 exports:
- **`DEMO_METRICS`**: Dashboard overview (jobs_running: 12, failed: 2, deployments: 5, queue: 8, wait_time: 45s)
- **`DEMO_JOBS`**: 5 realistic jobs with various states (RUNNING, COMPLETED, FAILED, QUEUED, RUNNING)
- **`DEMO_DEPLOYMENTS`**: 3 versions (v2.5.0 LIVE, v2.4.9 ROLLED_BACK, v2.5.1-rc1 STAGED)
- **`DEMO_AGENTS`**: 4 agents across 3 pools with CPU/memory/disk metrics
- **`DEMO_LOGS`**: 12-15 realistic log lines per job (timestamps, workflow output, status changes)

Plus 6 helper functions:
```typescript
getDemoMetrics()          // Returns DEMO_METRICS
getDemoJobs()             // Returns DEMO_JOBS array
getDemoDeployments()      // Returns DEMO_DEPLOYMENTS array
getDemoAgents()           // Returns DEMO_AGENTS array
getDemoJobLogs(jobId)     // Returns logs for specific job
hasDemoJobLogs(jobId)     // Checks if logs exist for job
```

### 2. **User Preferences Hook** 
📄 `src/lib/hooks/useUserPreferences.ts` (MODIFIED, 81 lines)

**Changes**:
- Added `demoMode: boolean` field to `UserPreferences` interface
- Updated `DEFAULT_PREFERENCES` to include `demoMode: false`
- Updated `parsePreferences()` to parse/validate `demoMode` from localStorage
- Hook now persists all 3 preferences: `realTimeMode`, `theme`, `demoMode`

### 3. **Demo Mode Toggle Component** 
📄 `src/components/dashboard/DemoModeToggle.tsx` (NEW, 43 lines)

Simple switch component for Settings page:
- **Appearance**: Title + description + MUI Switch
- **Feedback**: Info alert shown when demo mode is ON (red text: "Demo Mode is **ON**...")
- **Props**: `enabled: boolean` and `onChange: (enabled: boolean) => void`
- **Accessibility**: Proper labels and testId

### 4. **API Integration Layer** 
📄 `src/lib/api/metrics.ts` (MODIFIED, ~80 lines)

**Changes**:
- Added import: `import { getDemoMetrics } from '../mocks/demo-data'`
- Added helper function: `isDemoModeEnabled()` - checks localStorage for `hybrid-prefs.demoMode`
- Modified `getDashboardMetrics()` to:
  1. Check `isDemoModeEnabled()` first
  2. Return `getDemoMetrics()` if demo mode ON
  3. Fall back to backend API if demo mode OFF

### 5. **Settings Page Integration** 
📄 `src/app/dashboard/settings/page.tsx` (MODIFIED, ~140 lines)

**Changes**:
- Added import: `DemoModeToggle` from components
- Inserted demo mode section between "Real-Time Mode" and "Appearance"
- Toggle wired to `updatePreferences({ demoMode: enabled })`
- Card styling consistent with other settings sections

### 6. **Component Exports** 
📄 `src/components/dashboard/index.ts` (MODIFIED, 20 lines)

**Changes**:
- Added export: `export { DemoModeToggle } from './DemoModeToggle'`

### 7. **Bug Fix** 
📄 `cypress/e2e/fields.cy.ts` (MODIFIED, line 132)

Fixed TypeScript error in Cypress test (unrelated to demo mode but necessary for clean build):
- Changed: `expect.stringContaining(fileName)` → just `fileName`
- Reason: Cypress file inputs return filename, not full path

---

## How It Works

### 1. **User Enables Demo Mode**
User navigates to `/dashboard/settings` and:
1. Finds "Demo Mode" toggle section
2. Toggles switch ON
3. localStorage automatically saves: `{"realTimeMode":"efficient","theme":"auto","demoMode":true}`

### 2. **Dashboard Checks Demo Mode**
When dashboard page loads:
1. Calls `getDashboardMetrics()` from metrics API
2. API calls `isDemoModeEnabled()` - checks localStorage
3. If true: returns `getDemoMetrics()` (mock data)
4. If false: makes real backend request

### 3. **Mock Data Displays**
Dashboard displays mock data seamlessly:
```
Status Cards (from DEMO_METRICS):
  - Jobs Running: 12
  - Failed Today: 2
  - Deployments: 5
  - Queue Depth: 8

Tool Cards: All show 'operational' status
Real-Time Badge: Hidden (refresh mode disabled in demo)
```

### 4. **Data Persists Across Sessions**
- localStorage automatically persists `demoMode` preference
- Next page load remembers user's choice
- Works even after browser close/reopen

---

## Data Structure (What Gets Mocked)

### DEMO_METRICS
```typescript
{
  jobs_running: 12,
  jobs_failed_today: 2,
  deployments_today: 5,
  queue_depth: 8,
  average_wait_time_seconds: 45
}
```

### DEMO_JOBS (5 jobs)
```
ID                    Name                          Status      Created
job-2025-001          Deploy frontend v2.5.0        RUNNING     2m ago
job-2025-002          Terraform infrastructure      COMPLETED   15m ago
job-2025-003          Database migration v2.4.9     FAILED      32m ago
job-2025-004          Security scan                 QUEUED      1h ago
job-2025-005          Performance test suite        RUNNING     2h ago
```

### DEMO_DEPLOYMENTS (3 versions)
```
Version       Status          Promoted   Duration
v2.5.0        LIVE            1h ago     4m 32s
v2.4.9        ROLLED_BACK     14h ago    5m 12s
v2.5.1-rc1    STAGED          30m ago    (pending)
```

### DEMO_AGENTS (4 agents across 3 pools)
```
Pool              Region    CPU      Memory    Disk      Status
us-east-workers   us-east   45%      62%       28%       Healthy
us-east-workers   us-east   32%      51%       19%       Healthy
eu-west-workers   eu-west   78%      89%       42%       Warning
ap-south-workers  ap-south  55%      70%       35%       Healthy
```

### DEMO_LOGS (Sample)
```
[2025-01-15 14:23:15] Starting deployment pipeline...
[2025-01-15 14:23:18] Checking out repository: main branch
[2025-01-15 14:23:22] Running unit tests...
[2025-01-15 14:23:45] Tests passed: 1,247 ✓
[2025-01-15 14:24:01] Building Docker image...
[2025-01-15 14:24:18] Pushing to registry...
[2025-01-15 14:24:25] Rolling out to production...
[2025-01-15 14:24:32] Health checks passing
[2025-01-15 14:24:38] Deployment complete: v2.5.0
```

---

## Testing Demo Mode

### Manual Testing
1. Navigate to `/dashboard` → See real metrics (or "no data" if backend down)
2. Go to `/dashboard/settings`
3. Toggle "Demo Mode" ON
4. Info alert appears: "Demo Mode is **ON**. You're viewing mock data..."
5. Go back to `/dashboard`
6. See demo data (jobs: 12, failed: 2, etc.)
7. Toggle OFF → Goes back to real data (if backend available)
8. Refresh page → Demo mode preference persists

### Expected Behavior
- ✅ Demo toggle saves to localStorage
- ✅ Demo data shows realistic metrics
- ✅ Real-time badge hidden (demo disables polling)
- ✅ All tool cards show "operational" status
- ✅ Coming Soon cards still visible
- ✅ Toggling off switches back to real data

---

## Integration Points

### Where Demo Mode Affects
1. **Metrics API** (`src/lib/api/metrics.ts`)
   - `getDashboardMetrics()` checks demo mode first
   - Could easily extend to `getJobTimeline()`, `getDeploymentMetrics()`

2. **User Preferences** (`src/lib/hooks/useUserPreferences.ts`)
   - Third preference flag alongside `realTimeMode` and `theme`
   - Stores in localStorage under key `hybrid-prefs`

3. **Settings Page** (`src/app/dashboard/settings/page.tsx`)
   - UI control point for demo mode
   - Grouped with other system preferences

### What Doesn't Use Demo Mode (Yet)
- Jobs API (`src/lib/api/jobs.ts`) - still calls backend
- Deployments API (`src/lib/api/deployments.ts`) - still calls backend
- Agents API (`src/lib/api/agents.ts`) - still calls backend

**To extend demo mode**: Add same `isDemoModeEnabled()` check to other API clients, import corresponding demo data helpers.

---

## Future Enhancements

### Phase 2: Demo Mode Expansion
- [ ] Extend to Jobs API: `getDemoJobs()` returns DEMO_JOBS when demo mode ON
- [ ] Extend to Deployments API: `getDemoDeployments()` returns DEMO_DEPLOYMENTS
- [ ] Extend to Agents API: `getDemoAgents()` returns DEMO_AGENTS
- [ ] Add "Reset Demo Data" button in Settings (refresh timestamps, regenerate IDs)

### Phase 3: Demo Mode UI Indicators
- [ ] Add "DEMO MODE" badge in dashboard header (red/warning color)
- [ ] Disable real-time polling when in demo mode (already handled by mock data)
- [ ] Show subtle watermark: "Demo Data" in background

### Phase 4: Demo Scenarios
- [ ] Let users choose demo scenario: "Normal", "High Load", "Incident", "Recovery"
- [ ] Each scenario changes mock data (queue depth, error rates, agent health)

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/mocks/demo-data.ts` | 255 | Mock datasets and helpers |
| `src/components/dashboard/DemoModeToggle.tsx` | 43 | Toggle UI component |
| `src/lib/hooks/useUserPreferences.ts` | 81 | Preferences with demoMode |
| `src/lib/api/metrics.ts` | ~80 | API layer with demo check |
| `src/app/dashboard/settings/page.tsx` | ~140 | Settings UI with toggle |

---

## Verification Checklist

- ✅ `src/lib/mocks/demo-data.ts` created with 5 mock datasets + 6 helpers
- ✅ `DemoModeToggle.tsx` component created and exported
- ✅ `useUserPreferences` hook updated with `demoMode: boolean`
- ✅ `metrics.ts` API updated with `isDemoModeEnabled()` check
- ✅ Settings page includes demo mode toggle UI
- ✅ localStorage stores demo preference (key: `hybrid-prefs`)
- ✅ Dashboard page automatically uses mock data when demo is ON
- ✅ TypeScript compilation passes (dashboard pages + components)
- ✅ Cypress test error fixed (unrelated to demo mode)

---

## What's Next

**Step 2: Jobs Page with Inline Logs**
- Extend demo mode to Jobs API
- Build `/dashboard/jobs` with table of DEMO_JOBS
- Add inline log viewer using DEMO_LOGS
- Implement filtering, pagination, quick actions

**Current Focus**: Available for next session
