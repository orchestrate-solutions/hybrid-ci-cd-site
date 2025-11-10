# Copilot Instructions: Hybrid CI/CD Platform

## Project Overview

**Hybrid CI/CD Platform** is a federated DevOps orchestration system with a production-ready Python backend and Next.js/React frontend. The platform enables configuration-driven tool integrations, community-extensible plugins, and multi-region agent orchestration.

**Key Architecture**: Backend uses FastAPI + CodeUChain (immutable graph processing). Frontend uses React 19 + MUI X with CodeUChain for state management. All code is type-safe (Python 3.11+, TypeScript 5, strict mode).

---

## Backend Architecture (Python/FastAPI)

### Core Pattern: CodeUChain Chains → FastAPI Routes

Every backend feature follows this 5-layer pattern:

```
HTTP Request → Validation → CodeUChain Chain → Store/DB → HTTP Response
```

**Key Files**:
- `backend/src/dashboard/dashboard_routes.py` - REST API endpoints (554 lines)
- `backend/src/components/chains/dashboard_chains.py` - CodeUChain orchestration
- `backend/src/components/links/job_links.py` - Pure business logic (Links)
- `backend/src/db/dashboard_store.py` - Storage interface (JobStoreInterface, DeploymentStoreInterface)

### CodeUChain Pattern (Immutable Context Flow)

```python
from codeuchain.core import Context, Chain, Link

# 1. Define a Link (pure function)
class ValidateJobLink(Link[dict, dict]):
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        job_data = ctx.get("job_data") or {}
        if not job_data.get("name"):
            raise ValueError("job_name required")
        return ctx.insert("validated", True)

# 2. Compose into Chain
class JobCreationChain:
    def __init__(self, store: JobStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ValidateJobLink(), "validate")           # Link FIRST
        self.chain.add_link(CreateJobLink(store), "create")
        self.chain.add_link(SerializeJobLink(), "serialize")
        self.chain.connect("validate", "create", lambda c: True)     # Routing
        self.chain.connect("create", "serialize", lambda c: True)

    async def run(self, job_data: dict) -> dict:
        ctx = Context({"job_data": job_data})
        result = await self.chain.run(ctx)
        return result.to_dict()

# 3. Invoke from route
@router.post("/api/dashboard/jobs")
async def create_job(request: JobCreateRequest):
    result = await job_creation_chain.run(request.dict())
    return result
```

**Critical Rules**:
- ✅ `chain.add_link(link_instance, "name")` - Link FIRST, name second
- ✅ Use `ctx.insert("key", value)` to add to context
- ✅ Use `ctx.get("key") or default_value` for safe reads
- ✅ Each Link returns new Context (immutable)
- ✅ Predicates use lambda: `lambda c: condition`

### Storage Interface Pattern (Swap Implementations)

```python
from abc import ABC, abstractmethod

class JobStoreInterface(ABC):
    @abstractmethod
    async def create_job(self, job: Job) -> Job: ...
    @abstractmethod
    async def get_job(self, job_id: str) -> Job | None: ...

# Dev: In-memory implementation
class InMemoryJobStore(JobStoreInterface):
    def __init__(self):
        self.jobs = {}
    async def create_job(self, job: Job) -> Job:
        self.jobs[job.id] = job
        return job

# Production: DynamoDB implementation  
class DynamoDBJobStore(JobStoreInterface):
    async def create_job(self, job: Job) -> Job:
        await self.table.put_item(Item=job.to_dict())
        return job

# Both implement same interface → same Route code works everywhere
```

### What Exists (Verified Intact, 92/93 tests passing)

**Dashboard System** (Task 10):
- 13 REST endpoints for job + deployment lifecycle
- 6 CodeUChain chains (JobCreation, JobExecution, ListJobs, DeploymentCreation, DeploymentLifecycle, ListDeployments)
- 64 unit tests passing
- Atomic operations, state machines, full CRUD

**Agent API** (Task 11):
- 11 endpoints for agent registration, heartbeats, pool management
- Agent lifecycle chains
- Health monitoring
- 5 unit tests passing

**Job Queue System** (Task 12):
- 12 endpoints for job claiming (atomic, no race conditions)
- Priority-based dispatch (CRITICAL > HIGH > NORMAL > LOW)
- Lease-based fault tolerance (30-second leases, auto-requeue on expiry)
- Dead-lettering for failed jobs (max 3 retries)
- Queue statistics and real-time monitoring
- 24 unit tests passing

**To Add**: Frontend chains (DashboardChain, JobsChain, DeploymentsChain, AgentsChain, WebhookChain)

### Testing Backend

```bash
# All tests
pytest tests/unit/ -v
# Expected: 93/93 passing ✅

# By component
pytest tests/unit/test_queue.py -v         # 24 tests
pytest tests/unit/test_job.py -v           # 64 tests  
pytest tests/unit/test_agent.py -v         # 5 tests

# With coverage
pytest tests/unit/ --cov=src --cov-report=term-missing
```

---

## Frontend Architecture (TypeScript/React/MUI X)

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | React 19.2 + MUI X (@mui/material, @mui/x-data-grid, @mui/x-charts) | Components, grids, charts |
| **State** | CodeUChain (frontend chains) | Immutable state flow |
| **API** | Typed clients (jobs.ts, deployments.ts, agents.ts, metrics.ts) | Fetch backend data |
| **Styling** | Tailwind CSS 4 + Emotion | Layout, theming |
| **Testing** | Vitest (unit) + Cypress (E2E) | 80%+ coverage target |
| **Framework** | Next.js 16 (App Router) | Routing, SSR |

### Frontend State Management Pattern (CodeUChain)

```typescript
// lib/chains/jobs.ts - Fetch and filter jobs
import { Context, Chain, Link } from 'codeuchain';

class FetchJobsLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const jobs = await jobsApi.list();
    return ctx.insert("jobs", jobs);
  }
}

class FilterJobsLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const jobs = ctx.get("jobs") || [];
    const status = ctx.get("filter_status") || "ALL";
    const filtered = jobs.filter(j => status === "ALL" || j.status === status);
    return ctx.insert("filtered_jobs", filtered);
  }
}

export class JobsChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new FetchJobsLink(), "fetch");
    this.chain.add_link(new FilterJobsLink(), "filter");
    this.chain.connect("fetch", "filter", () => true);
  }

  async run(filter?: string): Promise<Job[]> {
    const ctx = new Context({ filter_status: filter });
    const result = await this.chain.run(ctx);
    return result.get("filtered_jobs") || [];
  }
}

// Usage in component
export function useJobs(filter?: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsChain = useMemo(() => new JobsChain(), []);

  useEffect(() => {
    jobsChain.run(filter).then(setJobs);
  }, [filter]);

  return jobs;
}
```

**Key Difference from Backend**: Frontend chains focus on data transformation + UI coordination, not business logic.

### API Client Pattern (Typed, Error Handling)

```typescript
// lib/api/jobs.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Job {
  id: string;
  name: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  created_at: string;
}

export const jobsApi = {
  async list(limit = 100): Promise<Job[]> {
    const res = await fetch(`${BASE_URL}/api/dashboard/jobs?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to list jobs: ${res.status}`);
    const data = await res.json();
    return data.jobs || [];
  },

  async get(jobId: string): Promise<Job> {
    const res = await fetch(`${BASE_URL}/api/dashboard/jobs/${jobId}`);
    if (!res.ok) throw new Error(`Job not found: ${jobId}`);
    return res.json();
  },

  async create(name: string, priority?: string): Promise<Job> {
    const res = await fetch(`${BASE_URL}/api/dashboard/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, priority: priority || "NORMAL" }),
    });
    if (!res.ok) throw new Error(`Failed to create job`);
    return res.json();
  },
};
```

### Component Patterns (MUI X First)

```typescript
// components/jobs/JobsTable.tsx - Using MUI Data Grid
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Name', width: 200 },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    renderCell: (params) => <JobStatusBadge status={params.value} />,
  },
  { field: 'created_at', headerName: 'Created', width: 150 },
];

export function JobsTable() {
  const jobs = useJobs();
  const [loading, setLoading] = useState(false);

  return (
    <DataGrid
      rows={jobs}
      columns={columns}
      loading={loading}
      pageSizeOptions={[25, 50, 100]}
      checkboxSelection
      disableRowSelectionOnClick
    />
  );
}

// components/jobs/JobStatusBadge.tsx - Semantic component
import { Chip, ChipProps } from '@mui/material';

interface JobStatusBadgeProps {
  status: Job['status'];
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const colorMap: Record<Job['status'], ChipProps['color']> = {
    QUEUED: 'warning',
    RUNNING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
  };
  return <Chip label={status} color={colorMap[status]} variant="outlined" />;
}
```

### Directory Structure (Current State)

```
src/
├── app/
│   ├── layout.tsx              # Root layout (40 LOC) ✅ Keep as-is
│   ├── page.tsx                # Landing page (60 LOC) ✅ Keep as-is
│   ├── globals.css             # Global styles ✅ Keep as-is
│   └── docs/[slug]/page.tsx    # Doc routing (30 LOC) ✅ Keep as-is
│
├── components/
│   ├── ThemeProvider.tsx       # Dark mode provider (20 LOC) ✅ Keep
│   ├── DocPage.tsx             # Markdown renderer (95 LOC) ✅ Keep
│   │
│   ├── layout/                 # NEW: Implement in Phase 1
│   │   ├── AppShell.tsx        # Main container (Header + Sidebar + Content)
│   │   ├── Header.tsx          # Top nav bar (logo, user menu)
│   │   ├── Sidebar.tsx         # Left nav (Jobs, Deployments, Agents, Metrics)
│   │   └── Navigation.tsx      # Nav items config (shared structure)
│   │
│   ├── dashboard/              # NEW: Phase 1-3
│   │   ├── DashboardOverview.tsx
│   │   ├── MetricsCard.tsx
│   │   └── RecentActivity.tsx
│   │
│   ├── jobs/                   # NEW: Phase 3
│   │   ├── JobsTable.tsx       # MUI Data Grid
│   │   ├── JobForm.tsx
│   │   ├── JobStatusBadge.tsx
│   │   └── __tests__/
│   │
│   └── [feature]/              # More components as needed
│
├── lib/
│   ├── api/                    # NEW: Phase 2
│   │   ├── client.ts           # Base HTTP client
│   │   ├── jobs.ts             # GET/POST /api/jobs
│   │   ├── deployments.ts      # GET/POST /api/deployments
│   │   ├── agents.ts           # GET /api/agents
│   │   └── metrics.ts          # GET /api/metrics
│   │
│   ├── chains/                 # NEW: Phase 2
│   │   ├── jobs.ts             # JobsChain (fetch + filter)
│   │   ├── deployments.ts      # DeploymentsChain
│   │   ├── agents.ts           # AgentsChain
│   │   ├── dashboard.ts        # DashboardChain (orchestrate)
│   │   └── webhooks.ts         # WebhookChain (incoming events)
│   │
│   ├── hooks/                  # NEW: Phase 2
│   │   ├── useChain.ts         # Base hook for running chains
│   │   ├── useJobs.ts          # useJobs(filter?)
│   │   ├── useDashboard.ts     # useDashboard()
│   │   ├── useDeployments.ts   # useDeployments()
│   │   └── useAgents.ts        # useAgents()
│   │
│   ├── services/               # NEW: Phase 2
│   │   ├── eventBus.ts         # Publish/subscribe
│   │   ├── cache.ts            # Client-side caching
│   │   └── logger.ts           # Structured logging
│   │
│   ├── types/                  # NEW: Phase 2
│   │   ├── jobs.ts             # Job, JobStatus, etc.
│   │   ├── deployments.ts      # Deployment types
│   │   ├── agents.ts           # Agent, AgentStatus
│   │   └── metrics.ts          # Metrics types
│   │
│   ├── doc-processing.ts       # Markdown utils (95 LOC) ✅ Keep
│   └── utils/                  # Helpers
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
│
└── hooks/                      # EMPTY: Use lib/hooks instead
```

### Testing Pattern (Vitest + Cypress)

**Unit Tests (Vitest)**:
```typescript
// components/jobs/__tests__/JobStatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { JobStatusBadge } from '../JobStatusBadge';

describe('JobStatusBadge', () => {
  it('renders COMPLETED as green', () => {
    render(<JobStatusBadge status="COMPLETED" />);
    expect(screen.getByText('COMPLETED')).toHaveClass('success');
  });

  it('renders FAILED as red', () => {
    render(<JobStatusBadge status="FAILED" />);
    expect(screen.getByText('FAILED')).toHaveClass('error');
  });
});
```

**E2E Tests (Cypress)**:
```typescript
// cypress/e2e/jobs.cy.ts
describe('Jobs Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/jobs');
  });

  it('loads jobs table with data', () => {
    cy.get('[data-testid="jobs-table"]').should('exist');
    cy.get('button').contains('Create Job').should('exist');
  });

  it('can create a new job', () => {
    cy.get('button').contains('Create Job').click();
    cy.get('input[placeholder="Job name"]').type('Deploy v2.0');
    cy.get('button').contains('Submit').click();
    cy.contains('Job created successfully').should('be.visible');
  });
});
```

**Target**: 80%+ coverage for all components

---

## Development Workflows

### Running Locally

```bash
# Terminal 1: Frontend (Next.js)
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Backend (Python/FastAPI)
cd backend
python -m uvicorn src.main:app --reload
# Runs on http://localhost:8000
# Docs: http://localhost:8000/api/docs

# Terminal 3: Data service (mock data)
npm run data-service
# Runs on http://localhost:8001
```

### Testing

```bash
# Frontend unit tests (watch mode)
npm run test:watch

# Frontend E2E tests
npm run test:e2e

# Backend tests
cd backend && pytest tests/unit/ -v

# All tests at once
npm run test && (cd backend && pytest tests/unit/ -v)
```

### Building

```bash
# Frontend
npm run build
npm start

# Backend (no build needed)
python -m uvicorn src.main:app
```

---

## Project-Specific Patterns & Conventions

### 1. Type Safety First

✅ **DO**: Full TypeScript types everywhere
```typescript
interface Job {
  id: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  created_at: Date;
}
```

❌ **DON'T**: `any` types, untyped fetch responses
```typescript
// Bad
const response: any = await fetch(...);
```

### 2. Immutability (CodeUChain Principle)

✅ **DO**: Create new objects
```python
ctx = ctx.insert("key", new_value)  # Returns new Context
```

❌ **DON'T**: Mutate shared state
```python
data["key"] = value  # Mutates in-place (can cause bugs)
```

### 3. Interface-Based Design (Extensibility)

✅ **DO**: Abstract interfaces for all stores/services
```python
class JobStoreInterface(ABC):
    @abstractmethod
    async def create_job(self, job: Job) -> Job: ...
```

❌ **DON'T**: Concrete implementations as dependencies
```python
store = PostgresJobStore()  # Too specific
```

### 4. CodeUChain Chain Order: Link First, Name Second

✅ **CORRECT**:
```python
chain.add_link(ValidateLink(), "validate")
```

❌ **WRONG**:
```python
chain.add_link("validate", ValidateLink())
```

### 5. Test-Driven Development

- Write tests FIRST (especially edge cases)
- Run tests after every change: `npm run test:watch` / `pytest tests/ -v`
- Aim for 80%+ coverage on components

### 6. Error Handling

```typescript
// Frontend: Always handle errors
try {
  const jobs = await jobsApi.list();
} catch (error) {
  toast.error(`Failed to load jobs: ${error.message}`);
  setJobs([]);  // Fallback state
}

// Backend: Raise exceptions, let middleware handle
async def create_job(...) -> Job:
    if not job_data:
        raise ValueError("job_data required")
    # Route error handling converts to 400/500
```

### 7. Configuration-Driven Approach

All integrations are defined via configs (not hardcoded):
- Tool configs: `config/tools/cicd/github-actions.json`
- Schema validation: `schemas/tool-config.schema.json`
- Can add new tools without code changes

---

## Key Files to Know

| File | Purpose | Lines |
|------|---------|-------|
| `backend/src/dashboard/dashboard_routes.py` | Dashboard REST API | 554 |
| `backend/src/components/chains/dashboard_chains.py` | CodeUChain orchestration | 226+ |
| `backend/src/components/links/job_links.py` | Business logic (Links) | 350+ |
| `backend/src/db/dashboard_store.py` | Storage interfaces | 280+ |
| `package.json` | Frontend dependencies (MUI X, CodeUChain, Vitest) | 50 |
| `FRONTEND_REBUILD_PLAN.md` | Complete 4-phase implementation plan | 1,145 |
| `README.md` | Platform vision, features, architecture | 500+ |

---

## Common Commands Reference

```bash
# Development
npm run dev                    # Start frontend
cd backend && uvicorn src.main:app --reload

# Testing
npm run test:watch            # Frontend unit tests (watch)
npm run test:e2e              # Frontend E2E tests
cd backend && pytest tests/unit/ -v  # Backend tests

# Linting
npm run lint                   # ESLint check

# Documentation
npm run storybook              # Component library docs (http://localhost:6006)

# Building
npm run build                  # Production frontend build
npm run storybook:build        # Static Storybook

# Utilities
npm run data-service           # Mock data server on :8001
```

---

## When Adding Features: Quick Checklist

- [ ] **Types First**: Define TypeScript interfaces (frontend) / Pydantic models (backend)
- [ ] **Tests First**: Write tests before implementation
- [ ] **Backend API**: Create endpoint + CodeUChain chain + Links
- [ ] **Frontend Chain**: Create CodeUChain chain for state management
- [ ] **API Client**: Create typed client for backend endpoint
- [ ] **Component**: Build React component using MUI X
- [ ] **Tests Pass**: Vitest (unit) + Cypress (E2E) + backend pytest
- [ ] **Git Commit**: Use conventional commits (`feat:`, `fix:`, `test:`, `docs:`)

---

## Key Insights

1. **Backend-Driven**: All state flows from FastAPI backend. Frontend queries via REST, manipulates via CodeUChain chains.

2. **Immutable by Design**: CodeUChain's immutable Context eliminates mutation bugs. Used consistently across backend & frontend.

3. **Type-Safe End-to-End**: Python 3.11 + TypeScript 5 (strict mode) = zero runtime type surprises.

4. **Interface-Based Extensibility**: Stores/APIs use abstract interfaces → easy to swap implementations (DynamoDB vs. Redis, etc.).

5. **Test Everything**: 879 tests (280 unit + 313 stories + 286 E2E) = confidence to refactor.

6. **Configuration Over Code**: Tools defined in JSON configs (not hardcoded) → community can contribute new integrations without PRs.

---

## Developer Workflow Notes (for AI Agents)

When working on this codebase:

- **Work on feature branches**: Create branches from `main` using conventional names (`feat/`, `fix/`, `docs/`, `test/`)
- **Commit often**: Push small, logical commits with descriptive messages after each meaningful change
- **Push to origin**: `git push origin <branch-name>` to save work to remote frequently
- **Test before pushing**: Run `npm run test:unit` and `npm run lint` locally before each push
- **Keep branches up to date**: Pull from `main` regularly to avoid merge conflicts
- **Create PRs for review**: When phase complete, create pull request with description of changes
- **Use conventional commits**: Follow format `type(scope): description` (e.g., `feat(jobs): add JobsTable component`)

This approach enables collaboration, prevents losing work, and maintains code quality through continuous integration.

---

## Test-Driven Development (TDD) Workflow: Red Phase Always Before Build

**Core Principle**: Write tests FIRST, watch them fail (RED), then implement code to make them pass (GREEN). This workflow applies to all layers: Storybook, Cypress E2E, CodeUChain TypeScript, and Python backend.

### Why Red Phase First?

- ✅ **Clarifies Requirements**: Writing tests forces you to think through the contract before implementation
- ✅ **Prevents Over-Engineering**: Only code what's needed to pass tests
- ✅ **Catches Design Issues Early**: Failing tests reveal bad APIs or patterns
- ✅ **Catches Bugs Before Production**: Tests show intended behavior upfront
- ✅ **Living Documentation**: Tests are examples of how to use code
- ✅ **Refactoring Confidence**: Green tests = safe to improve code

### Universal TDD Workflow

```
1. RED: Write failing test (code doesn't exist yet)
   └─ npm run test:unit -- --watch
   └─ npm run test:e2e:open
   └─ npm run storybook
   
2. GREEN: Write minimal code to pass test
   └─ Implement only what's needed
   └─ No premature optimization
   
3. REFACTOR: Improve code while keeping tests green
   └─ Extract common logic
   └─ Optimize performance
   └─ Improve type safety
   
4. COMMIT: Push when all tests pass
   └─ git add -A && git commit -m "feat: ..."
   └─ git push origin <branch>
```

### Layer 1: Storybook Stories (Red Phase)

**Write Storybook stories BEFORE building components.**

```typescript
// components/jobs/JobsTable.stories.tsx (RED - write first)
import { Meta, StoryObj } from '@storybook/react';
import { JobsTable } from './JobsTable';

export default {
  component: JobsTable,
  tags: ['autodocs'],
} satisfies Meta<typeof JobsTable>;

type Story = StoryObj<typeof meta>;

// RED: These stories fail - component doesn't exist yet
export const Default: Story = {
  args: {
    jobs: [
      { id: '1', name: 'Deploy v2.0', status: 'RUNNING' },
      { id: '2', name: 'Rollback v1.9', status: 'COMPLETED' },
    ],
    loading: false,
  },
};

export const Loading: Story = {
  args: { ...Default.args, loading: true },
};

export const Empty: Story = {
  args: { jobs: [], loading: false },
};

export const WithError: Story = {
  args: {
    jobs: [],
    loading: false,
    error: 'Failed to load jobs',
  },
};

// Run: npm run storybook
// Result: RED - JobsTable component not found ❌
```

### Layer 2: Unit Tests (Red Phase - Vitest)

**Write unit tests BEFORE implementing components.**

```typescript
// components/jobs/__tests__/JobsTable.test.tsx (RED - write first)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobsTable } from '../JobsTable';

describe('JobsTable', () => {
  // RED: These tests fail because component doesn't exist
  
  it('renders job rows in data grid', () => {
    const jobs = [{ id: '1', name: 'Deploy v2.0', status: 'RUNNING' }];
    render(<JobsTable jobs={jobs} loading={false} />);
    expect(screen.getByText('Deploy v2.0')).toBeInTheDocument();
  });

  it('shows loading spinner when loading=true', () => {
    render(<JobsTable jobs={[]} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', async () => {
    const onRowClick = vi.fn();
    const jobs = [{ id: '1', name: 'Deploy v2.0', status: 'RUNNING' }];
    render(<JobsTable jobs={jobs} loading={false} onRowClick={onRowClick} />);
    
    await userEvent.click(screen.getByText('Deploy v2.0'));
    expect(onRowClick).toHaveBeenCalledWith('1');
  });

  it('shows error message when error prop is set', () => {
    render(<JobsTable jobs={[]} loading={false} error="Failed to load" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});

// Run: npm run test:unit
// Result: RED - component doesn't exist ❌
```

### Layer 3: CodeUChain Chains (Red Phase - TypeScript)

**Write chain tests BEFORE implementing chains.**

```typescript
// lib/chains/__tests__/jobs.test.ts (RED - write first)
import { Context } from 'codeuchain';
import { FetchJobsChain } from '../jobs';
import * as jobsApi from '../../api/jobs';

vi.mock('../../api/jobs');

describe('FetchJobsChain', () => {
  // RED: Chain links don't exist yet
  
  it('fetches jobs successfully', async () => {
    const mockJobs = [{ id: '1', name: 'Deploy v2.0', status: 'RUNNING' }];
    vi.mocked(jobsApi.fetchJobs).mockResolvedValue(mockJobs);

    const chain = new FetchJobsChain();
    const result = await chain.execute({ status: 'RUNNING' });

    expect(result).toEqual(mockJobs);
  });

  it('validates filter parameters before fetching', async () => {
    const chain = new FetchJobsChain();
    await expect(chain.execute({ invalid: 'filter' })).rejects.toThrow(
      'Invalid filter'
    );
  });

  it('caches results to avoid duplicate fetches', async () => {
    const mockJobs = [{ id: '1', name: 'Job 1', status: 'RUNNING' }];
    vi.mocked(jobsApi.fetchJobs).mockResolvedValue(mockJobs);

    const chain = new FetchJobsChain();
    await chain.execute({});
    await chain.execute({});
    
    // Should only call API once (second uses cache)
    expect(jobsApi.fetchJobs).toHaveBeenCalledTimes(1);
  });
});

// Run: npm run test:unit lib/chains/__tests__/jobs.test.ts
// Result: RED - FetchJobsChain doesn't exist ❌
```

### Layer 4: Cypress E2E (Red Phase)

**Write E2E tests BEFORE building pages.**

```typescript
// cypress/e2e/jobs.cy.ts (RED - write first)
describe('Jobs Page Workflow', () => {
  // RED: Pages and endpoints don't exist yet
  
  it('navigates to jobs page from sidebar', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Jobs').click();
    cy.url().should('include', '/dashboard/jobs');
  });

  it('displays jobs in data grid', () => {
    cy.visit('http://localhost:3000/dashboard/jobs');
    cy.get('[data-testid="jobs-table"]').should('exist');
    cy.get('[data-testid="jobs-table"] tbody tr').should('have.length.greaterThan', 0);
  });

  it('filters jobs by status', () => {
    cy.visit('http://localhost:3000/dashboard/jobs');
    cy.get('[data-testid="status-filter"]').click();
    cy.contains('RUNNING').click();
    
    // Verify only running jobs shown
    cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
      cy.wrap(row).should('contain', 'RUNNING');
    });
  });

  it('creates a new job', () => {
    cy.visit('http://localhost:3000/dashboard/jobs');
    cy.contains('Create Job').click();
    
    cy.get('input[name="name"]').type('Deploy v2.0');
    cy.get('select[name="priority"]').select('HIGH');
    cy.contains('Submit').click();
    
    cy.contains('Job created successfully').should('be.visible');
    cy.get('[data-testid="jobs-table"]').should('contain', 'Deploy v2.0');
  });
});

// Run: npm run test:e2e:open
// Result: RED - pages don't exist, endpoints not responding ❌
```

### Layer 5: Backend CodeUChain Chains (Red Phase - Python)

**Write backend chain tests BEFORE implementing chains.**

```python
# backend/tests/unit/test_jobs_chain.py (RED - write first)
import pytest
from codeuchain.core import Context
from src.components.chains.dashboard_chains import JobCreationChain
from src.db.dashboard_store import InMemoryJobStore

@pytest.mark.asyncio
async def test_job_creation_chain_validates_input():
    """RED: Chain doesn't exist yet"""
    store = InMemoryJobStore()
    chain = JobCreationChain(store)
    
    # Missing required field should fail validation
    ctx = Context({"job_data": {}})
    
    with pytest.raises(ValueError, match="job_name required"):
        await chain.run(ctx)

@pytest.mark.asyncio
async def test_job_creation_chain_creates_job():
    """RED: Chain links don't exist yet"""
    store = InMemoryJobStore()
    chain = JobCreationChain(store)
    
    ctx = Context({
        "job_data": {
            "name": "Deploy v2.0",
            "priority": "HIGH"
        }
    })
    
    result = await chain.run(ctx)
    
    assert result.get("job_id") is not None
    assert result.get("status") == "QUEUED"

# Run: pytest backend/tests/unit/test_jobs_chain.py -v
# Result: RED - Chain classes don't exist ❌
```

### TDD Workflow Example: Building JobsTable

**Step 1: RED - Write all tests first**
```bash
# Write Storybook stories (component states)
vim components/jobs/JobsTable.stories.tsx

# Write unit tests (component behavior)
vim components/jobs/__tests__/JobsTable.test.tsx

# Write E2E tests (user workflows)
vim cypress/e2e/jobs.cy.ts

# Verify all tests FAIL
npm run storybook          # ❌ Component doesn't exist
npm run test:unit          # ❌ Tests fail
npm run test:e2e:open      # ❌ Pages don't exist
```

**Step 2: GREEN - Implement minimal code**
```bash
# Create component to pass tests
vim components/jobs/JobsTable.tsx

# Verify all tests PASS
npm run test:unit          # ✅ All green
npm run storybook          # ✅ Stories render
npm run test:e2e           # ✅ Workflows pass
```

**Step 3: REFACTOR - Improve while keeping tests green**
```bash
# Extract skeleton loader, optimize rendering
vim components/jobs/JobsTableSkeleton.tsx

# Tests still pass
npm run test:unit          # ✅ Still green
```

**Step 4: COMMIT - Push when complete**
```bash
git add components/jobs/
git commit -m "feat(jobs): add JobsTable with MUI Data Grid"
git push origin feat/jobs-table
```

### TDD Rules (Red Phase Mandatory)

**✅ DO:**
- Write tests BEFORE code (always)
- Watch tests fail (RED phase is required)
- Implement minimal code to pass
- Commit frequently (after each RED→GREEN cycle)
- Use mocks for dependencies (API, database)
- Test edge cases (errors, empty states, loading)

**❌ DON'T:**
- Skip tests "we'll add them later" (you won't)
- Write code then try to add tests (too late)
- Test implementation details (test behavior)
- Have flaky tests (use `vi.useFakeTimers()`)
- Leave failing tests before pushing

### Pre-Implementation Checklist

**Before starting ANY feature:**

- [ ] **Storybook stories written** (component states documented)
- [ ] **Unit tests written** (component behavior specified)
- [ ] **Chain tests written** (API/state flow tested)
- [ ] **E2E tests written** (user workflows defined)
- [ ] **All tests RED** (watch them fail first!)
- [ ] **Run `npm run test:unit`** and confirm failures
- [ ] **Run `npm run test:e2e:open`** and confirm failures
- [ ] **Run `npm run storybook`** and confirm component missing

**Only after verifying tests fail (RED), start implementation.**

### Example: Feature Branch with TDD

```bash
# 1. Create feature branch
git checkout -b feat/jobs-table

# 2. Write all tests (RED phase)
# - components/jobs/JobsTable.stories.tsx
# - components/jobs/__tests__/JobsTable.test.tsx
# - cypress/e2e/jobs.cy.ts
# - lib/chains/__tests__/jobs.test.ts

# 3. Verify tests fail
npm run test:unit          # ❌ RED
npm run test:e2e:open      # ❌ RED

# 4. Implement code (minimal)
# - components/jobs/JobsTable.tsx
# - lib/chains/jobs.ts
# - lib/api/jobs.ts

# 5. Verify tests pass
npm run test:unit          # ✅ GREEN
npm run test:e2e           # ✅ GREEN
npm run storybook          # ✅ All render

# 6. Refactor if needed (keep tests green)
# - Extract components
# - Optimize performance

# 7. Commit and push
git add -A
git commit -m "feat(jobs): add JobsTable with filtering

- Render jobs in MUI Data Grid
- Support filtering by status
- Support pagination (20 per page)
- Handle loading and error states
- Full test coverage (unit + E2E)"

git push origin feat/jobs-table
```

### Success Metrics for TDD

- ✅ **All features have tests BEFORE implementation**
- ✅ **80%+ code coverage** (measured by Vitest)
- ✅ **Zero test flakiness** (tests pass consistently)
- ✅ **All tests pass before pushing** (CI enforces this)
- ✅ **Refactoring confidence** (green tests = safe changes)
- ✅ **Documentation via tests** (tests show behavior)
