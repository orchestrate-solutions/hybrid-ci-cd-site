# Demo Mode - Data Available by Page

## Overview Dashboard
**URL**: `/dashboard`  
**Demo Data**: ✅ YES

Displays:
- Jobs Running: **12**
- Failed Today: **2**
- Deployments: **5**
- Queue Depth: **8**
- Average Wait Time: **42 seconds**
- Top 7 Tools: All show "operational" status

---

## Jobs Page
**URL**: `/dashboard/jobs`  
**Demo Data**: ✅ YES

Displays 5 realistic jobs:

| ID | Name | Status | Priority | Created | Duration |
|---|---|---|---|---|---|
| job-001 | Deploy backend service v2.5.0 | RUNNING | HIGH | 5m ago | 3m 0s |
| job-002 | Run tests for frontend | COMPLETED | NORMAL | 25m ago | 2m 0s |
| job-003 | Database migration v2.5.0 | FAILED | CRITICAL | 45m ago | 1m 25s |
| job-004 | Deploy frontend to staging | QUEUED | NORMAL | 2m ago | - |
| job-005 | Security scan with trivy | RUNNING | HIGH | 8m ago | 6m 0s |

**Per-Job Data**:
- Status, priority, created_at, started_at, duration
- Git repo, branch, commit hash
- **12-15 realistic log lines** showing actual workflows:
  - job-001: Deployment steps (pull image, health checks, replicas)
  - job-002: Test output (unit tests, E2E tests, linting)
  - job-003: Failed migration (constraint error, rollback)

---

## Deployments Page
**URL**: `/dashboard/deployments`  
**Demo Data**: ✅ YES

Displays 3 deployment versions:

| Version | Status | Staging | Staging Time | Production | Production Time | Reason |
|---|---|---|---|---|---|---|
| 2.5.0 | LIVE | ✅ | 2h ago | ✅ | 30m ago | - |
| 2.4.9 | ROLLED_BACK | ✅ | 24h ago | ✅ | 22h ago | DB migration incompatibility |
| 2.5.1-rc1 | STAGED | ✅ | 45m ago | ⏳ | Pending | - |

**Per-Deployment Data**:
- Version, status, environment progression
- Timestamps for staging and production
- Rollback reason (if applicable)

---

## Agents Page
**URL**: `/dashboard/agents`  
**Demo Data**: ✅ YES

Displays 4 agents across 3 pools:

| Agent ID | Pool | Region | CPU | Memory | Disk | Status | Last Heartbeat | Jobs Queued | Jobs Done |
|---|---|---|---|---|---|---|---|---|---|
| agent-us-east-1-001 | us-east-1 | us-east-1 | 45% | 62% | 38% | HEALTHY | 5s ago | 3 | 142 |
| agent-us-east-1-002 | us-east-1 | us-east-1 | 28% | 41% | 32% | HEALTHY | 3s ago | 2 | 156 |
| agent-us-west-2-001 | us-west-2 | us-west-2 | 72% | 85% | 51% | HEALTHY | 8s ago | 4 | 98 |
| agent-eu-west-1-001 | eu-west-1 | eu-west-1 | 95% | 92% | 88% | UNHEALTHY | 45s ago | 0 | 67 |

**Per-Agent Data**:
- ID, status, pool name, region
- CPU%, memory%, disk% usage
- Last heartbeat timestamp
- Jobs queued and completed

---

## Settings Page
**URL**: `/dashboard/settings`  
**Demo Mode Control**: ✅ YES

Toggle: **Demo Mode** (ON/OFF)
- Info alert: "Demo Mode is ON. You're viewing mock data. Refresh Mode is disabled in demo."
- When ON: All pages show mock data above
- When OFF: All pages connect to real backend API

---

## Summary

**Demo Coverage**: ✅ **100% of MVP Pages**

| Page | Status | Data |
|---|---|---|
| Dashboard Overview | ✅ | Metrics + 7 tools |
| Jobs | ✅ | 5 jobs + logs |
| Deployments | ✅ | 3 versions + timeline |
| Agents | ✅ | 4 agents + metrics |
| Settings | ✅ | Demo toggle |

**What You Can Do in Demo Mode**:
- ✅ View dashboard overview
- ✅ Browse job list and see all statuses (RUNNING, COMPLETED, FAILED, QUEUED)
- ✅ Read realistic job logs (12-15 lines per job)
- ✅ Explore deployment timeline with version history
- ✅ Check agent pool health and individual metrics
- ✅ Toggle theme (Light/Dark/Auto)
- ✅ Adjust real-time slider (though it's disabled in demo)

**What's Mock**:
- ✅ All metrics are realistic but static
- ✅ Job statuses show different states
- ✅ Deployment versions show progression through environments
- ✅ Agent health varies (3 healthy, 1 unhealthy)
- ✅ Log output mirrors real CI/CD workflows

**What's NOT Mock (Real API Only)**:
- ❌ Creating new jobs (POST /api/jobs) - demo mode doesn't intercept mutations yet
- ❌ Retrying/canceling jobs - demo doesn't support mutations
- ❌ Rolling back deployments - demo doesn't support mutations
- ❌ Draining/scaling agent pools - demo doesn't support mutations

---

## Example: Toggle Demo On

1. Go to `/dashboard/settings`
2. Find "Demo Mode" section
3. Click toggle → ON
4. Info alert appears (blue): "Demo Mode is ON..."
5. Navigate to any page
6. See demo data immediately (no network requests)
7. Toggle OFF → switch to real backend API

---

## Data Freshness

Demo data uses **relative timestamps**:
- Job created 5 minutes ago: `Date.now() - 5 * 60 * 1000`
- Last heartbeat 5 seconds ago: `Date.now() - 5 * 1000`

This makes data feel "live" while being static. Perfect for demos.

---

**Ready to explore!** Toggle demo mode in Settings and navigate the dashboard.
