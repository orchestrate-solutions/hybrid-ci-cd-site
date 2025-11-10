# Frontend Rebuild Plan: React/MUI X with CodeUChain

**Document Version**: 1.0  
**Created**: November 9, 2025  
**Status**: Ready for Implementation  
**Duration**: Phase 1-4 over 4-6 weeks

---

## Executive Summary

**Objective**: Rebuild the frontend as a production-ready React/MUI X dashboard powered by CodeUChain, replacing experimental marketplace/dashboard code with clean, tested architecture.

**Key Principles**:
- ✅ Backend-driven: All state flows from FastAPI backend via REST API
- ✅ CodeUChain pipelines: Declare UI workflows as composable links + chains
- ✅ MUI X first: Use Material-UI Data Grid, charts, and components
- ✅ Test-driven: Vitest unit tests + Cypress E2E tests from day 1
- ✅ Type-safe: Full TypeScript with strict mode
- ✅ Minimal: Only essential features, no premature optimization

**Current State**:
- ✅ Backend: 100% intact (92 tests, 6 CodeUChain chains, FastAPI routes)
- ✅ Testing: Vitest + Cypress configured, ready to use
- ✅ Dependencies: MUI X installed (@mui/material, @mui/x-data-grid, @emotion/*)
- ✅ Frontend: Clean slate (~315 LOC: landing page + docs only)
- ❌ Dashboard: Needs complete rebuild
- ❌ State management: Needs CodeUChain-based implementation

---

## Architecture Overview

### Frontend Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   REACT/MUI X DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  UI Layer (React Components + MUI X)                │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  • Layout: AppShell (header, sidebar, content)     │  │
│  │  • Pages: Dashboard, Jobs, Deployments, Agents     │  │
│  │  • Grids: MUI X Data Grid for lists                │  │
│  │  • Charts: MUI X Charts for metrics                │  │
│  │  • Forms: MUI Form components (TextField, etc.)    │  │
│  │  • Dialogs: MUI Modal for actions                  │  │
│  │  • Tables: Sortable, filterable job/deployment     │  │
│  └─────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  State Management (CodeUChain Pipelines)            │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  • DashboardChain: Orchestrate dashboard load      │  │
│  │  • JobsChain: Fetch, filter, sort jobs            │  │
│  │  • DeploymentsChain: Deployment lifecycle          │  │
│  │  • AgentsChain: Agent health & metrics             │  │
│  │  • WebhookChain: Handle incoming events            │  │
│  │                                                     │  │
│  │  Each chain emits events → UI subscribes & updates │  │
│  └─────────────────────────────────────────────────────┘  │
│                         ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  API Client Layer (Typed HTTP Requests)            │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  • jobs.ts: GET/POST /api/jobs/                   │  │
│  │  • deployments.ts: GET/POST /api/deployments/    │  │
│  │  • agents.ts: GET /api/agents/                    │  │
│  │  • metrics.ts: GET /api/metrics/                  │  │
│  │  • Each client: error handling, retries, caching  │  │
│  └─────────────────────────────────────────────────────┘  │
│                         ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                   FASTAPI BACKEND (Python)                 │
│   /api/jobs, /api/deployments, /api/agents, /api/metrics  │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. CodeUChain for State Management (NOT Redux)**

Why CodeUChain instead of Redux/Zustand/Context?
- ✅ Declarative pipeline composition (same philosophy as backend)
- ✅ Testable chains (pure functions, predictable flows)
- ✅ Built-in middleware for logging/metrics/errors
- ✅ Type-safe context flow (Context[T] → Context[U])
- ✅ Mirrors backend architecture (frontend/backend parity)

**2. MUI X for Component Library (NOT Tailwind Only)**

Why MUI X instead of custom Tailwind components?
- ✅ Data Grid (sort, filter, paginate large lists)
- ✅ Charts (built-in time series, bar charts)
- ✅ Date/Time pickers (complex UI patterns)
- ✅ Theming (dark mode, custom colors)
- ✅ Accessibility (WCAG 2.1 AA certified)
- ✅ Production-proven (used by thousands of apps)

**3. Typed API Clients (NOT raw fetch)**

Why typed API clients?
- ✅ Type safety for all backend responses
- ✅ Centralized error handling
- ✅ Consistent retry logic
- ✅ Easy to mock in tests
- ✅ Documentation co-located with types

**4. Test-Driven Development (Vitest + Cypress)**

Why TDD from the start?
- ✅ Catches bugs before production
- ✅ Refactoring confidence
- ✅ Living documentation
- ✅ Prevents regressions
- ✅ Each component has ≥80% test coverage target

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + theme provider
│   ├── page.tsx                # Landing page (existing)
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout (sidebar + header)
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── jobs/
│   │   │   ├── page.tsx        # Jobs list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # Job detail
│   │   │   └── __tests__/
│   │   │       └── page.test.tsx
│   │   ├── deployments/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── __tests__/
│   │   │       └── page.test.tsx
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   └── __tests__/
│   │   │       └── page.test.tsx
│   │   └── metrics/
│   │       ├── page.tsx
│   │       └── __tests__/
│   │           └── page.test.tsx
│   └── docs/
│       └── [slug]/
│           └── page.tsx        # Existing doc pages
│
├── components/
│   ├── ThemeProvider.tsx       # Dark mode provider (existing)
│   ├── DocPage.tsx             # Markdown renderer (existing)
│   │
│   ├── layout/
│   │   ├── AppShell.tsx        # Main layout container
│   │   │   ├── Header.tsx      # Top navigation bar
│   │   │   ├── Sidebar.tsx     # Left navigation menu
│   │   │   └── __tests__/
│   │   │       └── Sidebar.test.tsx
│   │   └── Navigation.tsx       # Nav items config
│   │
│   ├── dashboard/
│   │   ├── DashboardOverview.tsx
│   │   ├── MetricsCard.tsx     # Stat cards
│   │   ├── RecentActivity.tsx  # Activity feed
│   │   └── __tests__/
│   │       ├── MetricsCard.test.tsx
│   │       └── RecentActivity.test.tsx
│   │
│   ├── jobs/
│   │   ├── JobsTable.tsx       # MUI Data Grid for jobs
│   │   ├── JobForm.tsx         # Create/edit form
│   │   ├── JobActions.tsx      # Bulk actions dropdown
│   │   ├── JobStatusBadge.tsx  # Status indicator
│   │   └── __tests__/
│   │       ├── JobsTable.test.tsx
│   │       ├── JobForm.test.tsx
│   │       └── JobStatusBadge.test.tsx
│   │
│   ├── deployments/
│   │   ├── DeploymentTimeline.tsx
│   │   ├── DeploymentStatus.tsx
│   │   ├── RollbackDialog.tsx
│   │   └── __tests__/
│   │       └── DeploymentStatus.test.tsx
│   │
│   ├── agents/
│   │   ├── AgentGrid.tsx
│   │   ├── AgentCard.tsx
│   │   ├── HealthIndicator.tsx
│   │   └── __tests__/
│   │       └── AgentCard.test.tsx
│   │
│   ├── metrics/
│   │   ├── MetricsChart.tsx    # MUI X Charts wrapper
│   │   ├── TimeSeriesChart.tsx
│   │   ├── PipelineMetrics.tsx
│   │   └── __tests__/
│   │       └── MetricsChart.test.tsx
│   │
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       ├── ConfirmDialog.tsx
│       └── __tests__/
│           ├── ErrorBoundary.test.tsx
│           └── EmptyState.test.tsx
│
├── lib/
│   ├── doc-processing.ts       # Existing markdown utils
│   │
│   ├── api/
│   │   ├── client.ts           # Base HTTP client (error handling, retries)
│   │   ├── jobs.ts             # Job endpoints
│   │   ├── deployments.ts      # Deployment endpoints
│   │   ├── agents.ts           # Agent endpoints
│   │   ├── metrics.ts          # Metrics endpoints
│   │   └── types.ts            # Shared API response types
│   │
│   ├── chains/
│   │   ├── index.ts            # Export all chains
│   │   ├── dashboard.ts        # DashboardChain: load overview
│   │   ├── jobs.ts             # JobsChain: fetch+filter+sort
│   │   ├── deployments.ts      # DeploymentsChain: lifecycle
│   │   ├── agents.ts           # AgentsChain: health monitoring
│   │   ├── webhooks.ts         # WebhookChain: handle events
│   │   └── __tests__/
│   │       ├── jobs.test.ts
│   │       ├── deployments.test.ts
│   │       └── dashboard.test.ts
│   │
│   ├── hooks/
│   │   ├── useChain.ts         # Generic chain executor hook
│   │   ├── useDashboard.ts     # Dashboard data + refetch
│   │   ├── useJobs.ts          # Jobs list + pagination + sort
│   │   ├── useDeployments.ts   # Deployments list + actions
│   │   ├── useAgents.ts        # Agents grid + health
│   │   ├── useMetrics.ts       # Metrics + time range
│   │   └── __tests__/
│   │       ├── useJobs.test.ts
│   │       └── useDashboard.test.ts
│   │
│   ├── services/
│   │   ├── eventBus.ts         # Event emitter for chain events
│   │   ├── cache.ts            # Simple in-memory cache
│   │   └── logger.ts           # Structured logging
│   │
│   ├── utils/
│   │   ├── formatters.ts       # Format dates, status, etc.
│   │   ├── validators.ts       # Form validation helpers
│   │   └── constants.ts        # App-wide constants
│   │
│   └── types/
│       ├── index.ts            # Re-export all types
│       ├── jobs.ts             # Job types (mirrors backend)
│       ├── deployments.ts      # Deployment types
│       ├── agents.ts           # Agent types
│       ├── metrics.ts          # Metrics types
│       └── ui.ts               # UI-specific types (PageState, etc.)
│
├── hooks/
│   └── (empty - use lib/hooks instead)
│
└── styles/
    ├── theme.ts                # MUI theme configuration
    └── globals.css             # Tailwind + global styles

cypress/
├── e2e/
│   ├── dashboard.cy.ts
│   ├── jobs.cy.ts
│   ├── deployments.cy.ts
│   └── agents.cy.ts
├── fixtures/
│   └── api-responses.json
└── support/
    ├── commands.ts
    └── e2e.ts

tests/
└── setup.ts                    # Vitest setup (already created)
```

---

## Phase 1: Foundation & Layout (Week 1)

### Goals
- ✅ AppShell layout (header, sidebar, content)
- ✅ Navigation routing
- ✅ MUI theme setup (light/dark)
- ✅ Basic pages (placeholder content)
- ✅ Layout tests

### Deliverables

**1.1: MUI Theme Configuration**
```typescript
// lib/styles/theme.ts
- Create theme colors (brand, semantic)
- Dark/light mode variants
- Typography scales
- Component overrides (buttons, cards, etc.)
- Export useMuiTheme() hook
```

**1.2: AppShell Layout Component**
```typescript
// components/layout/AppShell.tsx
- Root layout with Drawer + AppBar
- Responsive (hamburger on mobile)
- Theme toggle button
- User profile dropdown
```

**1.3: Navigation Sidebar**
```typescript
// components/layout/Sidebar.tsx
- Nav items: Dashboard, Jobs, Deployments, Agents, Metrics, Docs
- Active state indicator
- Icons (MUI Icons)
- Collapse/expand behavior
```

**1.4: Dashboard Layout Page**
```typescript
// app/dashboard/layout.tsx
- Wrap with AppShell
- Provide theme context
- Error boundary
```

**1.5: Placeholder Pages**
```typescript
// app/dashboard/page.tsx
// app/dashboard/jobs/page.tsx
// app/dashboard/deployments/page.tsx
// app/dashboard/agents/page.tsx
// app/dashboard/metrics/page.tsx
- Simple "Coming soon" with MUI Card
```

**1.6: Layout Tests**
```typescript
// components/layout/__tests__/Sidebar.test.tsx
- Verify nav items render
- Test active state
- Test mobile responsive behavior
```

### Success Criteria
- ✅ `npm run dev` shows working layout
- ✅ Navigation works between pages
- ✅ Theme toggle works
- ✅ Layout tests pass (80%+ coverage)
- ✅ No TypeScript errors

---

## Phase 2: API Layer & CodeUChain Chains (Week 1-2)

### Goals
- ✅ Typed API client with error handling
- ✅ Define all backend response types
- ✅ Build CodeUChain chains for data fetching
- ✅ Event bus for state updates
- ✅ API tests + chain tests

### Deliverables

**2.1: Base HTTP Client**
```typescript
// lib/api/client.ts
- Typed fetch wrapper
- Error handling (404, 500, network errors)
- Retry logic (exponential backoff)
- Request/response logging
- Timeout handling
```

**2.2: API Response Types**
```typescript
// lib/api/types.ts
- JobResponse, DeploymentResponse, AgentResponse
- MetricsResponse, PaginatedResponse
- ErrorResponse, ValidationError
- Mirror backend Pydantic models
```

**2.3: API Clients (Typed)**
```typescript
// lib/api/jobs.ts
- fetchJobs(query, filters, sort)
- getJob(id)
- createJob(data)
- updateJob(id, data)
- deleteJob(id)
- All return typed responses

// lib/api/deployments.ts
// lib/api/agents.ts
// lib/api/metrics.ts
- Similar patterns for each resource
```

**2.4: CodeUChain Chains**
```typescript
// lib/chains/jobs.ts
class FetchJobsChain extends Chain {
  // Links:
  // 1. ValidateFilterLink - Validate filter params
  // 2. FetchJobsLink - Call API
  // 3. TransformResponseLink - Map to UI types
  // 4. CacheResultLink - Store in memory cache
}

class FilterJobsChain extends Chain {
  // Links:
  // 1. ApplyFiltersLink
  // 2. ApplySortLink
  // 3. PaginateLink

// lib/chains/deployments.ts
class DeploymentLifecycleChain extends Chain {
  // Links for create → pending → running → complete

// lib/chains/dashboard.ts
class DashboardLoadChain extends Chain {
  // Parallel: Fetch metrics, recent jobs, recent deployments
  // Combine results into dashboard context
}

// lib/chains/webhooks.ts
class HandleWebhookChain extends Chain {
  // Parse webhook → emit event → update cache → notify UI
```

**2.5: Event Bus Service**
```typescript
// lib/services/eventBus.ts
class EventBus {
  subscribe(event: string, handler: (data: any) => void)
  emit(event: string, data: any)
  off(event: string, handler: (data: any) => void)
}

// Emit on chain completion:
// - 'jobs:updated'
// - 'deployments:updated'
// - 'agents:updated'
// - 'webhook:received'
```

**2.6: Tests**
```typescript
// lib/api/__tests__/jobs.test.ts
- Mock fetchJobs API call
- Verify error handling
- Test retry logic

// lib/chains/__tests__/jobs.test.ts
- Test FetchJobsChain flow
- Verify cache integration
- Test error handling
```

### Success Criteria
- ✅ All API clients typed and tested
- ✅ Chains compile without errors
- ✅ Chain tests pass (80%+ coverage)
- ✅ Error scenarios handled (404, 500, timeout)
- ✅ Parallel chain execution works

---

## Phase 3: Dashboard Pages (Week 2-3)

### Goals
- ✅ Jobs page (list, detail, create, update)
- ✅ Deployments page (timeline, status)
- ✅ Agents page (grid, health)
- ✅ Metrics page (charts, time series)
- ✅ Component tests + E2E tests

### Deliverables

**3.1: Jobs Page**
```typescript
// app/dashboard/jobs/page.tsx
- Display JobsTable component
- Show loading, error, empty states
- Filter panel (status, agent, date range)
- Create button → modal form

// components/jobs/JobsTable.tsx
- MUI Data Grid with:
  - Sortable columns (id, status, agent, created_at)
  - Filterable status dropdown
  - Pagination (20 per page)
  - Row click → detail page
  - Bulk select + delete action

// components/jobs/JobForm.tsx
- MUI Form components (TextField, Select)
- Validation (required fields, formats)
- Submit → API → success toast
- Cancel → close modal

// app/dashboard/jobs/[id]/page.tsx
- Job detail view
- Status badge + timeline
- Related deployments
- Logs viewer (if available)
```

**3.2: Deployments Page**
```typescript
// app/dashboard/deployments/page.tsx
- List with status (pending, running, complete, failed)
- Timeline visualization
- Filter by status, date range

// components/deployments/DeploymentTimeline.tsx
- Vertical timeline showing deployment stages
- Each stage with timestamp + status

// components/deployments/RollbackDialog.tsx
- Confirm rollback action
- Select target version
- Show affected jobs

// app/dashboard/deployments/[id]/page.tsx
- Full deployment detail
- Related jobs
- Rollback option
```

**3.3: Agents Page**
```typescript
// app/dashboard/agents/page.tsx
- Grid of agent cards
- Filter by status (healthy, degraded, offline)

// components/agents/AgentCard.tsx
- Agent name + status badge
- Health metric (green/yellow/red)
- Last heartbeat timestamp
- Resource usage (CPU, memory)
- Click → detail page

// app/dashboard/agents/[id]/page.tsx
- Agent detail
- Performance metrics
- Recent jobs executed
- Deregister option
```

**3.4: Metrics Page**
```typescript
// app/dashboard/metrics/page.tsx
- Time range selector (1h, 24h, 7d, 30d)
- Multiple chart sections

// components/metrics/MetricsChart.tsx
- MUI X Charts wrapper
- LineChart for time series
- BarChart for comparisons
- Responsive sizing

// components/metrics/PipelineMetrics.tsx
- Success rate over time
- Avg execution time trend
- Job volume timeline
```

**3.5: Component Tests**
```typescript
// components/jobs/__tests__/JobsTable.test.tsx
- Render with data
- Test sorting
- Test filtering
- Test row click navigation
- Test bulk select

// components/jobs/__tests__/JobForm.test.tsx
- Render form fields
- Test validation
- Test submit
- Test cancel

// components/deployments/__tests__/DeploymentTimeline.test.tsx
- Render stages
- Verify timestamps
```

**3.6: E2E Tests**
```typescript
// cypress/e2e/jobs.cy.ts
- Login (if auth added)
- Navigate to jobs page
- Verify table renders
- Filter jobs
- Click row → see detail
- Create new job → verify in list
- Delete job → verify removed

// cypress/e2e/deployments.cy.ts
// cypress/e2e/agents.cy.ts
// cypress/e2e/metrics.cy.ts
- Similar patterns
```

### Success Criteria
- ✅ All pages render without errors
- ✅ Data fetches on page load
- ✅ Filters work correctly
- ✅ Create/update/delete actions work
- ✅ Component tests pass (80%+ coverage)
- ✅ E2E tests pass
- ✅ Responsive on mobile

---

## Phase 4: Polish & Monitoring (Week 3-4)

### Goals
- ✅ Error handling + toast notifications
- ✅ Loading skeletons + animations
- ✅ Dark mode verified
- ✅ Performance optimization
- ✅ Documentation + README

### Deliverables

**4.1: Error Handling**
```typescript
// components/common/ErrorBoundary.tsx
- Catch React errors
- Display user-friendly message
- Show error details in dev mode

// Show API error toasts
- "Failed to load jobs"
- "Job creation failed: validation error"
- Retry button
```

**4.2: Loading States**
```typescript
// components/common/LoadingSpinner.tsx
- Centered spinner with message

// components/jobs/JobsTableSkeleton.tsx
- Skeleton rows while loading
- Smooth transition to data

// Skeleton loaders for each page
```

**4.3: Notifications**
```typescript
// Use MUI Snackbar for toasts
- Success: "Job created"
- Error: "Failed to create job"
- Info: "Deployment started"
- Auto-dismiss after 3-5s
```

**4.4: Dark Mode**
```typescript
// Verify theme toggle works
- Light mode looks good
- Dark mode looks good
- Persist preference to localStorage
- Test all components in both modes
```

**4.5: Performance**
```typescript
- Verify images optimized (next/image)
- Memoize expensive components
- Lazy load non-critical pages
- Code splitting for large components
- Monitor bundle size
```

**4.6: Documentation**
```typescript
// README.md
- Frontend architecture overview
- How to run locally
- How to add new pages
- How to add new CodeUChain chains
- Testing guidelines

// Component storybook (future)
- Showcase all MUI X components used
- Document prop variations
```

### Success Criteria
- ✅ All errors handled gracefully
- ✅ Loading states visible
- ✅ Dark/light modes work
- ✅ Bundle size < 500KB (gzipped)
- ✅ Lighthouse score > 80
- ✅ Documentation complete

---

## Tech Stack & Dependencies

### Core Frontend
```json
{
  "react": "19.2.0",
  "next": "16.0.0",
  "typescript": "^5"
}
```

### UI Components (Already Installed)
```json
{
  "@mui/material": "^7.3.5",
  "@mui/x-data-grid": "^8.17.0",
  "@mui/x-charts": "^8.0.0",
  "@mui/icons-material": "^7.3.5",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1"
}
```

### State Management & Async
```json
{
  "codeuchain": "^1.1.2",
  "zod": "^3.22.0"
}
```

### Styling
```json
{
  "tailwindcss": "^4",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

### Testing (Already Configured)
```json
{
  "vitest": "^1.0.0",
  "@vitest/ui": "^1.0.0",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "cypress": "^15.5.0",
  "jsdom": "^23.0.0"
}
```

### Dev Tools
```json
{
  "@vitejs/plugin-react": "^4.2.0",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/node": "^20",
  "eslint": "^9",
  "eslint-config-next": "16.0.0"
}
```

### Optional (Future)
```json
{
  "react-hook-form": "^7.48.0",      // Form state (Phase 5)
  "swr": "^2.2.0",                   // Data fetching cache (Phase 5)
  "zustand": "^4.4.0",               // Alternative state (Phase 5)
  "vitest-canvas-mock": "^0.3.3",    // Canvas mocking for charts
  "msw": "^2.0.0"                    // Mock Service Worker (testing)
}
```

---

## CodeUChain Integration Guide

### Pattern 1: Simple Data Fetch Chain

```typescript
// lib/chains/jobs.ts
import { Chain, Link, Context } from 'codeuchain';
import { fetchJobs } from '../api/jobs';

class FetchJobsLink extends Link<{ filters?: any }, { jobs: Job[] }> {
  async call(ctx: Context<{ filters?: any }>): Promise<Context<{ jobs: Job[] }>> {
    const jobs = await fetchJobs(ctx.get('filters'));
    return ctx.insert('jobs', jobs);
  }
}

class ValidateFiltersLink extends Link<{ filters?: any }, { filters?: any }> {
  async call(ctx: Context<{ filters?: any }>): Promise<Context<{ filters?: any }>> {
    const filters = ctx.get('filters') or {};
    // Validate filter structure
    return ctx;
  }
}

export class FetchJobsChain {
  private chain = new Chain();
  
  constructor() {
    this.chain.add_link(ValidateFiltersLink(), 'validate');
    this.chain.add_link(FetchJobsLink(), 'fetch');
    this.chain.connect('validate', 'fetch', () => true);
  }
  
  async execute(filters?: any) {
    const result = await this.chain.run(Context({ filters }));
    return result.get('jobs');
  }
}
```

### Pattern 2: React Hook for Chain

```typescript
// lib/hooks/useJobs.ts
import { useState, useEffect } from 'react';
import { FetchJobsChain } from '../chains/jobs';

export function useJobs(filters?: any) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const chain = new FetchJobsChain();
  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await chain.execute(filters);
        setJobs(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);
  
  return { jobs, loading, error };
}
```

### Pattern 3: Component Using Hook

```typescript
// components/jobs/JobsTable.tsx
import { useJobs } from '../../lib/hooks/useJobs';
import { DataGrid } from '@mui/x-data-grid';

export function JobsTable() {
  const [filters, setFilters] = useState({});
  const { jobs, loading, error } = useJobs(filters);
  
  if (error) return <ErrorState error={error} />;
  if (loading) return <LoadingSkeleton />;
  
  return (
    <DataGrid
      rows={jobs}
      columns={JOB_COLUMNS}
      loading={loading}
      onFilterModelChange={(model) => setFilters(model)}
    />
  );
}
```

### Pattern 4: Middleware for Logging

```typescript
// Apply middleware to chain for logging
import { Middleware } from 'codeuchain';

class LoggingMiddleware extends Middleware {
  async before(name: string, ctx: Context<any>) {
    console.log(`[Chain] ${name} started`, ctx.to_dict());
  }
  
  async after(name: string, ctx: Context<any>) {
    console.log(`[Chain] ${name} completed`, ctx.to_dict());
  }
  
  async on_error(name: string, ctx: Context<any>, err: Error) {
    console.error(`[Chain] ${name} failed:`, err);
  }
}

// In chain:
chain.use_middleware(LoggingMiddleware());
```

---

## API Endpoint Reference

### Jobs API
```
GET    /api/jobs/                  # List with filters
GET    /api/jobs/{id}/             # Get detail
POST   /api/jobs/                  # Create new job
PUT    /api/jobs/{id}/             # Update job
DELETE /api/jobs/{id}/             # Delete job
```

### Deployments API
```
GET    /api/deployments/           # List
GET    /api/deployments/{id}/      # Get detail
POST   /api/deployments/           # Create deployment
POST   /api/deployments/{id}/rollback/  # Rollback
```

### Agents API
```
GET    /api/agents/                # List all
GET    /api/agents/{id}/           # Get detail
GET    /api/agents/{id}/metrics/   # Get health metrics
```

### Metrics API
```
GET    /api/metrics/dashboard/     # Overall metrics
GET    /api/metrics/jobs/timeline/ # Job timeline data
GET    /api/metrics/deployments/   # Deployment metrics
```

---

## Testing Strategy

### Unit Tests (Vitest)
- **Location**: `src/components/**/__tests__/*.test.tsx` + `src/lib/**/__tests__/*.test.ts`
- **Coverage Target**: 80%+
- **Run**: `npm run test:unit`

```bash
# Example test structure
describe('JobsTable', () => {
  it('renders job rows', () => {
    const { getByRole } = render(<JobsTable jobs={mockJobs} />);
    expect(getByRole('grid')).toBeInTheDocument();
  });
});
```

### Integration Tests (Vitest + msw)
- **Mock backend** with Mock Service Worker (msw)
- **Test chains** with full flow: validation → API call → transform

### E2E Tests (Cypress)
- **Location**: `cypress/e2e/*.cy.ts`
- **Run**: `npm run test:e2e`
- **Coverage**: Critical user flows (create, update, delete, search)

```bash
describe('Jobs Workflow', () => {
  it('creates a new job', () => {
    cy.visit('/dashboard/jobs');
    cy.contains('Create Job').click();
    cy.get('input[name="name"]').type('My Job');
    cy.contains('Submit').click();
    cy.contains('Job created').should('be.visible');
  });
});
```

---

## Rollout Plan

### Week 1
- Phase 1 complete: Layout working
- PR review + merge
- Deployment to dev environment

### Week 1-2
- Phase 2 complete: API + chains
- API integration tested
- PR review + merge

### Week 2-3
- Phase 3 complete: Jobs, Deployments, Agents, Metrics pages
- Full E2E test coverage
- Performance optimization
- PR review + merge

### Week 3-4
- Phase 4 complete: Polish, dark mode, docs
- 80%+ test coverage
- Documentation complete
- Final PR review + merge to main

### Week 4
- Beta testing with team
- Bug fixes from feedback
- Release candidate build

### Week 5
- Production deployment
- Monitor error rates + performance
- Gather user feedback

---

## Success Metrics

### Code Quality
- ✅ 80%+ test coverage (Vitest + Cypress)
- ✅ Zero TypeScript errors (strict mode)
- ✅ ESLint passes
- ✅ Bundle size < 500KB (gzipped)

### Performance
- ✅ Lighthouse score > 80
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ No console errors/warnings

### Functionality
- ✅ All CRUD operations work (create, read, update, delete)
- ✅ Filtering + sorting work
- ✅ Pagination works
- ✅ Responsive on mobile/tablet
- ✅ Dark mode works

### User Experience
- ✅ Loading states visible
- ✅ Error messages clear
- ✅ Success feedback (toasts)
- ✅ No broken links
- ✅ Accessible (WCAG 2.1 AA)

---

## Commands Reference

```bash
# Development
npm run dev                    # Start dev server

# Testing
npm run test:unit             # Run Vitest
npm run test:unit --ui        # Run with UI
npm run test:e2e              # Run Cypress (headless)
npm run test:e2e:open         # Run Cypress (interactive)

# Building
npm run build                 # Production build
npm run start                 # Run production server

# Linting
npm run lint                  # Run ESLint

# Documentation
npm run storybook             # Start Storybook (future)
```

---

## Notes

### Why CodeUChain for Frontend?

1. **Architectural Consistency**: Backend uses CodeUChain chains; frontend mirrors this pattern
2. **Testability**: Pure function links are easy to test independently
3. **Composability**: Complex flows built from simple links
4. **Type Safety**: Context[T] ensures data flows correctly
5. **Middleware**: Built-in support for logging, metrics, error handling

### Why MUI X?

1. **Data Grid**: Production-ready sorting, filtering, pagination for large lists
2. **Charts**: Time series, bar charts without external dependencies
3. **Theming**: Consistent dark/light mode across all components
4. **Accessibility**: WCAG 2.1 AA certified components
5. **TypeScript**: Full type support out of the box

### Why Test-Driven?

1. **Regression Prevention**: Catch bugs before production
2. **Refactoring Confidence**: Safely improve code
3. **Documentation**: Tests show how components are used
4. **Speed**: TDD actually saves time long-term
5. **Quality**: 80%+ coverage reduces defects

---

## Future Enhancements (Phase 5+)

- [ ] Real-time updates via WebSockets (replace polling)
- [ ] Advanced charts with drill-down
- [ ] Webhook UI for custom integrations
- [ ] Plugin marketplace preview
- [ ] User roles + permissions UI
- [ ] Audit log viewer
- [ ] Custom dashboards (user-configurable)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Multi-language support

---

## References

- [CodeUChain Documentation](https://github.com/codeuchian/codeuchain)
- [MUI X Documentation](https://mui.com/x/)
- [React 19 Docs](https://react.dev)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Vitest Guide](https://vitest.dev/)
- [Cypress Best Practices](https://docs.cypress.io/)

---

**Status**: Ready for Implementation  
**Owner**: Frontend Team  
**Backend Dependency**: `/api/jobs`, `/api/deployments`, `/api/agents`, `/api/metrics` (Already available)  
**Start Date**: November 9, 2025  
**Target Completion**: December 6, 2025 (4 weeks)

**Next Action**: Kickoff Phase 1 - Create AppShell layout component
