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

---

## ✅ IMPLEMENTATION STATUS (2025-01-15)

### Frontend Components: 12/12 COMPLETE ✅

**Field Components (9)** - All in `src/components/fields/`:
```
✅ TextField           - Text input with label, placeholder, error handling
✅ SelectField         - Dropdown select with multiselect support
✅ CheckboxField       - Toggle checkbox with label
✅ TextareaField       - Multiline text input with character limits
✅ RadioGroup          - Radio button group with dynamic options
✅ DateField           - Date input with picker and format validation
✅ NumberField         - Numeric input with min/max/step constraints
✅ PasswordField       - Password input with visibility toggle
✅ FileField           - File upload with MIME type validation
```

**Dashboard Pages (3)** - All in `src/app/dashboard/*/page.tsx`:
```
✅ AgentsPage          - Agents table, registration, status monitoring
✅ JobsPage            - Jobs table, filtering, creation, bulk operations
✅ DeploymentsPage     - Deployments table, rollback, timeline, status
```

### Infrastructure Layer: 11/11 COMPLETE ✅

**API Clients** - All in `src/lib/api/`:
```
✅ jobs.ts             - listJobs, getJob, createJob, cancelJob, retryJob
✅ agents.ts           - listAgents, getAgent, registerAgent, pauseAgent, resumeAgent
✅ deployments.ts      - listDeployments, getDeployment, rollbackDeployment, cancelDeployment
✅ metrics.ts          - Dashboard metrics (existing)
```

**State Management (CodeUChain)** - All in `src/lib/chains/`:
```
✅ jobs.ts             - JobsChain with fetch, filter, sort, paginate links
✅ agents.ts           - AgentsChain with fetch, filter, paginate links
✅ deployments.ts      - DeploymentsChain with fetch, filter, sort, paginate links
✅ dashboard.ts        - DashboardChain orchestrating all three domains
✅ types.ts            - Shared chain types and interfaces
```

**Custom Hooks** - All in `src/lib/hooks/`:
```
✅ useChain            - Base hook for running CodeUChain chains (65 lines)
✅ useJobs             - Jobs state with filtering, pagination (64 lines)
✅ useAgents           - Agents state with filtering, pagination (59 lines)
✅ useDeployments      - Deployments state with filtering, pagination (64 lines)
✅ useDashboard        - Master hook orchestrating all three (96 lines)
✅ index.ts            - Exports and types (17 lines)
```

### Test Coverage: 765+ Tests ✅

**Layer 1: Vitest (Unit Tests)**
```
Status:  ✅ 194/194 PASSING (100%)
Time:    ~8 seconds
Files:   11 test files
Tests:   Logic, edge cases, mock data, error states
```

**Layer 2: Cypress Component (NEW)**
```
Status:  🟡 Operational (infrastructure fixed)
Tests:   360+ ready for validation
Files:   12 test files (.cy.tsx files)
Tests:   User interactions, accessibility, state changes
```

**Layer 3: Cypress E2E (Ready)**
```
Status:  ⏳ Ready for mock API setup
Tests:   211+ ready for validation
Tests:   Full page workflows, navigation, integration
```

### Code Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Components | 12/12 | ✅ Complete |
| API Clients | 3/3 | ✅ Complete |
| State Chains | 4/4 | ✅ Complete |
| Custom Hooks | 5/5 + base | ✅ Complete |
| Unit Tests | 194/194 | ✅ 100% Pass |
| Component Tests | 360+ | 🟡 Ready |
| E2E Tests | 211+ | ⏳ Ready |
| Total Tests | 765+ | 🟡 In-Progress |
| Total LOC Added | 379 | ✅ Hooks |
| Documentation | Complete | ✅ Yes |

### How to Use

#### 1. Field Components in Pages

```typescript
import { TextField, SelectField, DateField } from '@/components/fields';

export function MyForm() {
  return (
    <>
      <TextField label="Job Name" placeholder="Enter name..." />
      <SelectField label="Priority" options={priorityOptions} />
      <DateField label="Created After" />
    </>
  );
}
```

#### 2. Custom Hooks for Data

```typescript
import { useJobs, useAgents, useDashboard } from '@/lib/hooks';

export function JobsPage() {
  // Simple domain fetch
  const { jobs, loading, error, refetch } = useJobs({ 
    status: 'RUNNING',
    limit: 20 
  });

  // Or master dashboard
  const dashboard = useDashboard(); // Gets jobs, agents, deployments, metrics

  return (
    <JobsTable 
      jobs={jobs} 
      loading={loading}
      onRefresh={refetch}
    />
  );
}
```

#### 3. CodeUChain Chains (Advanced)

```typescript
import { JobsChain } from '@/lib/chains/jobs';
import { Context } from 'codeuchain';

const chain = new JobsChain();
const ctx = await chain.run(new Context({
  filters: { status: 'RUNNING', priority: 'HIGH' },
  pagination: { limit: 50, offset: 0 }
}));

const jobs = ctx.get('paginated_jobs'); // Immutable context flow
```

### Related Documentation

- `COMPONENT_IMPLEMENTATION_STATUS.md` - Detailed component inventory
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete implementation summary
- `CYPRESS_COMPONENT_TESTING.md` - Component testing guide
- `README.md` - Testing workflow section

---

### Testing Pattern: Three-Layer Strategy (Vitest + Cypress Components + Cypress E2E)

**NEW STANDARD**: All components follow a **three-layer testing pyramid**:

```
Layer 3: E2E (Full Page Workflows)     [Cypress E2E]
           ↑ Integration, navigation, full workflows
Layer 2: Component (Interactive)       [Cypress Component Tests] ⭐ NEW
           ↑ User interactions, state changes, accessibility
Layer 1: Unit (Logic & Edge Cases)     [Vitest + jsdom]
           ↓ Logic, mocking, error states
```

#### Layer 1: Unit Tests (Vitest)
Fast, logic-focused tests using jsdom. Ideal for edge cases and mocking.

```typescript
// components/fields/TextField/__tests__/TextField.test.tsx
import { render, screen } from '@testing-library/react';
import { TextField } from '../TextField';

describe('TextField Unit', () => {
  it('renders with label', () => {
    render(<TextField label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('handles edge case: very long text', () => {
    render(<TextField label="Input" value="a".repeat(1000) onChange={() => {}} />);
    expect(screen.getByDisplayValue("a".repeat(1000))).toBeInTheDocument();
  });

  it('validates special characters', () => {
    render(<TextField label="Special" value="!@#$%^&*()" onChange={() => {}} />);
    expect(screen.getByDisplayValue("!@#$%^&*()")).toBeInTheDocument();
  });
});

// Run: npm run test:unit
// Speed: ⚡ ~50ms per test
// Scope: Logic, edge cases, error handling
```

#### Layer 2: Component Tests (Cypress) ⭐ NEW STANDARD
Real browser environment. Tests user interactions, state management, accessibility in isolation.

```typescript
// components/fields/TextField/__tests__/TextField.cy.tsx
import { mount } from 'cypress/react';
import { TextField } from '../TextField';

describe('TextField Component', () => {
  it('updates value on user input', () => {
    mount(<TextField label="Name" />);
    cy.get('input').type('John Doe');
    cy.get('input').should('have.value', 'John Doe');
  });

  it('handles controlled state', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <>
          <TextField 
            label="Name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div data-testid="display">{value}</div>
        </>
      );
    };
    mount(<TestComponent />);
    cy.get('input').type('Alice');
    cy.get('[data-testid="display"]').should('have.text', 'Alice');
  });

  it('is accessible with keyboard navigation', () => {
    mount(<TextField label="Search" />);
    cy.get('input').focus();
    cy.focused().should('have.attr', 'data-testid', 'text-field-input');
  });
});

// Run: npm run test:component
// Speed: ⚡⚡ ~200ms per test (real browser)
// Scope: User interactions, state changes, accessibility, plug-and-play validation
```

#### Layer 3: E2E Tests (Cypress)
Full page workflows. Tests navigation, integration, user journeys.

```typescript
// cypress/e2e/jobs.cy.ts
describe('Jobs Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/jobs');
  });

  it('loads jobs page with data', () => {
    cy.get('[data-testid="jobs-table"]').should('exist');
    cy.get('button').contains('Create Job').should('exist');
  });

  it('can create a new job', () => {
    cy.get('button').contains('Create Job').click();
    cy.get('input[placeholder="Job name"]').type('Deploy v2.0');
    cy.get('button').contains('Submit').click();
    cy.contains('Job created successfully').should('be.visible');
  });

  it('filters jobs by status', () => {
    cy.get('[data-testid="filter-status"]').click();
    cy.contains('RUNNING').click();
    cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
      cy.wrap(row).should('contain', 'RUNNING');
    });
  });
});

// Run: npm run test:e2e
// Speed: ⚡⚡⚡ ~2-5s per test (full app)
// Scope: Full page workflows, navigation, integration
```

#### Directory Structure & Naming

```
src/components/fields/
├── TextField/
│   ├── TextField.tsx                    # Component
│   ├── TextField.stories.tsx            # Storybook visual docs
│   └── __tests__/
│       ├── TextField.test.tsx           # Vitest: unit & edge cases
│       └── TextField.cy.tsx             # Cypress: component interactions ⭐ NEW
│
├── SelectField/
│   ├── SelectField.tsx
│   ├── SelectField.stories.tsx
│   └── __tests__/
│       ├── SelectField.test.tsx
│       └── SelectField.cy.tsx           # Component: dropdown, options, state
│
└── CheckboxField/
    ├── CheckboxField.tsx
    ├── CheckboxField.stories.tsx
    └── __tests__/
        ├── CheckboxField.test.tsx
        └── CheckboxField.cy.tsx         # Component: toggle, controlled, a11y
```

**Test Naming Convention**:
- `FileName.test.tsx` = Vitest unit tests (fast, isolated, jsdom)
- `FileName.cy.tsx` = Cypress component tests (real browser, interactive, plug-and-play)

#### When to Use Each Layer

| Scenario | Layer | Tool | Why |
|----------|-------|------|-----|
| Unit logic (math, parsing, edge cases) | 1 | Vitest | Fast, mocking-friendly |
| Component renders correctly | 1 | Vitest | jsdom sufficient |
| User types in field | 2 | Cypress | Need real browser input handling |
| Field state updates on change | 2 | Cypress | Real event propagation |
| Accessibility (keyboard, screen reader) | 2 | Cypress | Real keyboard events, ARIA |
| Component works standalone/plug-and-play | 2 | Cypress | Validates component isolation |
| Full page workflow (navigate → filter → submit) | 3 | Cypress E2E | Multiple components, routing |
| Cross-feature integration | 3 | Cypress E2E | Full app state |

#### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:unit": "vitest run src/components src/app --coverage",
    "test:unit:watch": "vitest watch src/components src/app",
    "test:component": "cypress open --component",
    "test:component:run": "cypress run --component",
    "test:component:watch": "cypress run --component --watch",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test": "npm run test:unit && npm run test:component:run && npm run test:e2e"
  }
}
```

#### Example: Complete Field Component Testing

**TextField.cy.tsx** - Comprehensive component test template:

```typescript
import React from 'react';
import { mount } from 'cypress/react';
import { TextField } from '../TextField';

describe('TextField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<TextField label="Email" />);
      cy.get('label').should('have.text', 'Email');
    });

    it('shows required indicator', () => {
      mount(<TextField label="Email" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders helper text', () => {
      mount(<TextField label="Password" helperText="Min 8 chars" />);
      cy.get('.MuiFormHelperText-root').should('have.text', 'Min 8 chars');
    });
  });

  describe('User Interactions', () => {
    it('updates value on type', () => {
      mount(<TextField label="Name" />);
      cy.get('input').type('John');
      cy.get('input').should('have.value', 'John');
    });

    it('calls onChange callback', () => {
      const onChange = cy.stub();
      mount(<TextField label="Email" onChange={onChange} />);
      cy.get('input').type('test@example.com');
      // onChange called during typing
    });
  });

  describe('State Management', () => {
    it('handles controlled component', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <TextField value={value} onChange={(e) => setValue(e.target.value)} />
            <div data-testid="display">{value}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input').type('test');
      cy.get('[data-testid="display"]').should('have.text', 'test');
    });
  });

  describe('Error States', () => {
    it('shows error styling', () => {
      mount(
        <TextField label="Email" error helperText="Invalid" />
      );
      cy.get('input').should('have.class', 'Mui-error');
    });
  });

  describe('Accessibility', () => {
    it('links label to input', () => {
      mount(<TextField label="Email" />);
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`input#${id}`).should('exist');
      });
    });

    it('supports keyboard navigation', () => {
      mount(<TextField label="Field" />);
      cy.get('input').focus();
      cy.focused().should('have.attr', 'data-testid', 'text-field-input');
    });
  });
});
```

#### Running Tests

```bash
# Vitest (unit tests) - Fast
npm run test:unit                # Run all
npm run test:unit:watch          # Watch mode
npm run test:unit src/components # Specific folder

# Cypress Component - Interactive
npm run test:component           # Open Cypress UI
npm run test:component:run       # Headless
npm run test:component:watch     # Watch mode

# Cypress E2E - Full app
npm run test:e2e:open           # Interactive
npm run test:e2e                # Headless

# All tests
npm run test                     # Vitest + Cypress Component + Cypress E2E
```

#### Target Coverage

| Layer | Target | Current |
|-------|--------|---------|
| Vitest (unit) | 80%+ | ~85% (dashboard) |
| Cypress Component | 80%+ | ~60% (fields) |
| Cypress E2E | Critical paths | ~70+ workflows |
| **Total** | **Comprehensive** | **Growing** |

#### Key Benefits

✅ **Plug-and-Play Components**: Cypress component tests validate fields work standalone  
✅ **Real Browser Testing**: Catch DOM/browser-specific bugs before production  
✅ **Accessibility First**: Keyboard nav, screen reader support tested in Layer 2  
✅ **Fast Feedback**: Vitest for quick iteration, Cypress for confidence  
✅ **Reduced Integration Bugs**: Component tests catch issues before page assembly  
✅ **Documentation**: Tests serve as usage examples  

---

**Target**: 80%+ coverage at all three layers. Write tests FIRST, watch them fail (RED), then implement code to make them pass (GREEN).

**See also**: `CYPRESS_COMPONENT_TESTING.md` for comprehensive guide and examples.

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

### For Field/Micro Components (TextField, SelectField, etc.)
- [ ] **Types First**: Define TypeScript interfaces for component props
- [ ] **Storybook Stories**: Write stories BEFORE component (multiple states: default, loading, error, disabled)
- [ ] **Unit Tests (RED)**: Write Vitest tests first for logic & edge cases
- [ ] **Component Tests (RED)**: Write Cypress `.cy.tsx` tests for user interactions & accessibility
- [ ] **E2E Tests (RED)**: Write Cypress E2E tests for page-level workflows
- [ ] **Component Implementation**: Build React component using MUI X (minimal code to pass tests)
- [ ] **Tests PASS**: Verify all three layers (Vitest + Cypress Component + Cypress E2E) passing
- [ ] **Git Commit**: Use conventional commits (`feat(components): add TextField component`)

### For Feature Modules (Dashboard, Deployments, etc.)
- [ ] **Types First**: Define TypeScript interfaces (frontend) / Pydantic models (backend)
- [ ] **Tests First**: Write tests before implementation (all three layers)
- [ ] **Backend API**: Create endpoint + CodeUChain chain + Links
- [ ] **Frontend Chain**: Create CodeUChain chain for state management
- [ ] **API Client**: Create typed client for backend endpoint
- [ ] **Page Component**: Build page using field components + MUI X
- [ ] **Cypress Component Tests**: Test page interactions in isolation (before E2E)
- [ ] **Cypress E2E Tests**: Test full workflows with navigation & integration
- [ ] **Tests Pass**: Vitest (unit) + Cypress Component + Cypress E2E + backend pytest
- [ ] **Git Commit**: Use conventional commits (`feat(dashboard): add jobs page`)

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


---

## NET ZERO Risk Architecture (Relay + User-Owned Queue + Vault)

### Overview

The **NET ZERO Risk Architecture** eliminates provider access to user secrets by shifting data custody to user-owned infrastructure. This achieves **NET ZERO additional risk** compared to standard DevOps workflows (GitHub Actions, Jenkins, AWS).

**Key Principle**: Provider sees ONLY metadata (repo name, commit SHA, branch, event type). Provider NEVER sees: webhook secrets, OAuth tokens, API keys, database passwords, or full payloads.

### Architecture Components

```
User's Infrastructure:
┌─────────────────────────────────────────────────────────────┐
│  Relay (User-Deployed)                                      │
│  ├─ Receives webhook from tool (GitHub, Jenkins, etc.)     │
│  ├─ Fetches secret from User's Vault                       │
│  ├─ Verifies signature (HMAC-SHA256, token, etc.)          │
│  ├─ Sanitizes payload → metadata only                      │
│  └─ Forwards to User's Queue (SQS, EventBridge, Pub/Sub)   │
└─────────────────────────────────────────────────────────────┘
                            ↓ (metadata only)
┌─────────────────────────────────────────────────────────────┐
│  User's Queue (AWS SQS / Azure Event Grid / GCP Pub/Sub)   │
│  ├─ Stores sanitized metadata only                         │
│  ├─ No secrets, no full payloads                           │
│  └─ Provider has READ-ONLY IAM access (cross-account)      │
└─────────────────────────────────────────────────────────────┘
                            ↓ (poll metadata)
┌─────────────────────────────────────────────────────────────┐
│  Provider's Stateless Orchestration (CodeUChain)           │
│  ├─ PollUserQueueLink (read metadata from user's queue)    │
│  ├─ ApplyRoutingRulesLink (stateless rule matching)        │
│  ├─ SendDecisionsLink (write decisions back to queue)      │
│  └─ NO DATA PERSISTENCE (truly stateless)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ (routing decisions)
┌─────────────────────────────────────────────────────────────┐
│  User's Queue (Decisions)                                   │
│  ├─ Relay polls for routing decisions                      │
│  ├─ Executes actions in user's infrastructure              │
│  └─ All execution happens in user's account                │
└─────────────────────────────────────────────────────────────┘
```

### Risk Comparison Table

| Risk Factor | GitHub Actions | Jenkins (Self-Hosted) | Hybrid CI/CD (OLD - Vulnerable) | Hybrid CI/CD (NET ZERO) |
|-------------|----------------|----------------------|--------------------------------|------------------------|
| **Webhook Secrets** | GitHub stores | User stores | **Provider stores** ❌ | User vault only ✅ |
| **OAuth Tokens** | GitHub stores | User stores | **Provider stores** ❌ | User vault only ✅ |
| **Database Passwords** | GitHub Secrets | User stores | **Provider could see** ❌ | User vault only ✅ |
| **Full Webhook Payloads** | GitHub sees | User only | **Provider stores** ❌ | User queue only (metadata) ✅ |
| **Data Custody** | GitHub | User | **Provider** ❌ | User ✅ |
| **Provider Access** | N/A | N/A | Full secrets access ❌ | Read-only metadata ✅ |
| **Risk vs. Baseline** | Baseline | Baseline | **INCREASED RISK** ❌ | **NET ZERO** ✅ |

**Conclusion**: NET ZERO architecture matches GitHub Actions/Jenkins baseline risk. User trusts only their own infrastructure, not provider.

### Implementation Files

**Backend (Python/FastAPI)**:
- `backend/src/models/webhook.py` - WebhookEvent with `payload_hash` (no `payload` field)
- `backend/src/components/adapters/webhook_adapter.py` - Payload hashing (line ~106: `hashlib.sha256(payload).hexdigest()`)
- `backend/src/db/webhook_store.py` - Stores only `payload_hash`, not full payload
- `backend/src/integrations/queues/base.py` - QueueClientInterface (multi-cloud abstraction)
- `backend/src/integrations/queues/factory.py` - Config-driven queue client factory
- `backend/src/integrations/queues/aws_sqs.py` - AWS SQS implementation (IAM role auth)
- `backend/src/integrations/queues/azure_eventgrid.py` - Azure Event Grid placeholder
- `backend/src/integrations/queues/gcp_pubsub.py` - GCP Pub/Sub placeholder
- `backend/src/orchestration/router.py` - Stateless orchestration (PollUserQueueLink, ApplyRoutingRulesLink, SendDecisionsLink)
- `backend/src/relay_routes.py` - Relay registration endpoint (OAuth2, API key generation)

**Config Files**:
- `config/webhooks/tools/github-net-zero.yaml` - Example NET ZERO config with queue + vault
- `config/schemas/net-zero-relay-config.schema.json` - JSON schema for validation

### CodeUChain Orchestration Pattern (Stateless)

```python
from codeuchain.core import Context, Chain, Link
from src.integrations.queues.factory import create_queue_client

class PollUserQueueLink(Link[dict, dict]):
    """Poll user's queue for metadata (no secrets)."""
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        queue_config = ctx.get("queue_config") or {}
        queue_client = create_queue_client(queue_config)
        
        # Poll messages (long-polling)
        messages = await queue_client.poll_messages(max_messages=10, wait_seconds=20)
        
        # Store in context (immutable)
        return ctx.insert("messages", messages).insert("queue_client", queue_client)

class ApplyRoutingRulesLink(Link[dict, dict]):
    """Apply config-driven routing rules (stateless)."""
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        messages = ctx.get("messages") or []
        routing_config = ctx.get("routing_config") or {}
        
        routing_decisions = []
        for msg in messages:
            tool = msg.get("tool")
            event_type = msg.get("event_type")
            rule = routing_config.get(tool, {}).get(event_type)
            
            if rule:
                routing_decisions.append({
                    "event_id": msg.get("event_id"),
                    "action": rule.get("action"),
                    "target": rule.get("target"),
                    "metadata": msg.get("metadata")
                })
        
        return ctx.insert("routing_decisions", routing_decisions)

class SendDecisionsLink(Link[dict, dict]):
    """Send routing decisions back to user's queue."""
    async def call(self, ctx: Context[dict]) -> Context[dict]:
        routing_decisions = ctx.get("routing_decisions") or []
        queue_client = ctx.get("queue_client")
        
        for decision in routing_decisions:
            await queue_client.send_message(decision)
        
        # Delete processed messages
        messages = ctx.get("messages") or []
        for msg in messages:
            await queue_client.delete_message(msg.get("receipt_handle"))
        
        return ctx.insert("sent_count", len(routing_decisions))

# Compose into chain
class RelayOrchestrationChain:
    def __init__(self):
        self.chain = Chain()
        self.chain.add_link(PollUserQueueLink(), "poll_queue")
        self.chain.add_link(ApplyRoutingRulesLink(), "apply_rules")
        self.chain.add_link(SendDecisionsLink(), "send_decisions")
        
        # Conditional routing
        self.chain.connect("poll_queue", "apply_rules", lambda c: len(c.get("messages") or []) > 0)
        self.chain.connect("apply_rules", "send_decisions", lambda c: len(c.get("routing_decisions") or []) > 0)
    
    async def run(self, request_data: dict) -> dict:
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        return {"sent_count": result_ctx.get("sent_count") or 0}
```

### Config Schema (NET ZERO)

**Key Changes from OLD Config**:
- ❌ REMOVED: `secret_env_var` (no secrets in provider environment)
- ✅ ADDED: `relay.queue` (user's queue config)
- ✅ ADDED: `relay.vault` (user's vault config)
- ✅ ADDED: `secret_vault_path` (vault URI references)
- ✅ ADDED: `routing` (stateless routing rules)

**Example Config**:
```yaml
version: 1.0.0
type: tool

metadata:
  id: github
  name: GitHub / GitHub Actions
  category: version-control

relay:
  enabled: true
  relay_id: relay_a1b2c3d4e5f6
  
  queue:
    provider: aws_sqs
    queue_url: https://sqs.us-east-1.amazonaws.com/123456789012/github-webhook-queue
    region: us-east-1
    role_arn: arn:aws:iam::123456789012:role/HybridCICDRelayPollerRole
  
  vault:
    provider: aws_secrets_manager
    region: us-east-1
    secret_prefix: hybrid-ci-cd/github/
    secrets:
      webhook_secret: aws_secrets_manager://us-east-1/hybrid-ci-cd/github/webhook-secret
      oauth_token: aws_secrets_manager://us-east-1/hybrid-ci-cd/github/oauth-token

integration:
  webhooks:
    enabled: true
    endpoint: /relay/webhooks/github
    verification:
      method: hmac-sha256
      header: X-Hub-Signature-256
      secret_vault_path: aws_secrets_manager://us-east-1/hybrid-ci-cd/github/webhook-secret
    events:
      push:
        http_event_header: X-GitHub-Event
        header_value: push
        data_mapping:
          event_type: push
          repository: $.repository.full_name
          branch: $.ref
          commit_sha: $.head_commit.id

routing:
  push:
    action: trigger_build
    target: build-pipeline
    conditions:
      - branch: main
```

### Implementation Rules (DO / DON'T)

**✅ DO**:
- Use `payload_hash` for audit trail (SHA-256)
- Use queue factory: `create_queue_client(queue_config)`
- Verify relay_id and API key on every request
- Store only metadata in WebhookEvent (no `payload` field)
- Use vault URIs for secrets: `aws_secrets_manager://region/path`
- Keep orchestration stateless (no data persistence)
- Use IAM role assumption for cross-account queue access
- Poll with long-polling (20 seconds wait time)
- Delete messages after processing (atomic)

**❌ DON'T**:
- Store full webhook payloads (security vulnerability)
- Access user's vault from provider (relay does this)
- Persist routing decisions (stateless only)
- Hard-code queue providers (use factory pattern)
- Store API keys in plaintext (hash with SHA-256)
- Skip signature verification (relay must verify)
- Use short polling (wasteful, high cost)
- Keep processed messages in queue (delete after send)

### Multi-Cloud Queue Support

**Supported Providers** (config-driven):
- AWS SQS (`aws_sqs`) - ✅ Fully implemented
- Azure Event Grid (`azure_eventgrid`) - 🟡 Placeholder (Phase 2)
- GCP Pub/Sub (`gcp_pubsub`) - 🟡 Placeholder (Phase 2)

**Queue Client Factory**:
```python
from src.integrations.queues.factory import create_queue_client, list_supported_providers

# Create client from config
queue_config = {
    "provider": "aws_sqs",
    "queue_url": "https://sqs.us-east-1.amazonaws.com/...",
    "role_arn": "arn:aws:iam::123456789012:role/RelayPollerRole",
    "region": "us-east-1"
}
client = create_queue_client(queue_config)

# List supported providers
providers = list_supported_providers()  # ["aws_sqs", "azure_eventgrid", "gcp_pubsub"]
```

**Adding New Providers** (extensible):
1. Implement `QueueClientInterface` in `backend/src/integrations/queues/<provider>.py`
2. Add provider to factory map in `factory.py`
3. Document config format in placeholder file
4. No code changes needed in orchestration layer (abstraction works!)

### Relay Registration Flow

**Endpoint**: `POST /api/relays/register`

**Request**:
```json
{
  "relay_name": "Production GitHub Actions Relay",
  "queue_config": {
    "provider": "aws_sqs",
    "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/relay-queue",
    "role_arn": "arn:aws:iam::123456789012:role/RelayPollerRole",
    "region": "us-east-1"
  },
  "vault_config": {
    "provider": "aws_secrets_manager",
    "region": "us-east-1",
    "secret_prefix": "hybrid-ci-cd/"
  },
  "oauth_token": "ya29.a0AfH6SMBx..."
}
```

**Response** (one-time API key display):
```json
{
  "relay_id": "relay_a1b2c3d4e5f6",
  "api_key": "sk_relay_1234567890abcdefghijklmnopqrstuvwxyz",
  "relay_name": "Production GitHub Actions Relay",
  "queue_config": { ... },
  "created_at": "2025-11-12T10:00:00Z",
  "expires_at": "2026-11-12T10:00:00Z"
}
```

**Security**:
- OAuth2 token validated before registration
- API key shown ONCE (user must save in vault)
- Only API key HASH stored (SHA-256, never plaintext)
- API key used for relay heartbeats and queue message verification
- Relay_id + API key required for all relay operations

### Relay Deployment Workflow

**User Steps**:
1. Register relay: `POST /api/relays/register` with OAuth2 token
2. Save API key in vault: `aws secretsmanager put-secret-value --secret-id hybrid-ci-cd/relay-api-key --secret-string "sk_relay_..."`
3. Deploy relay to user's infrastructure:
   - Docker: `docker run -e RELAY_ID=relay_xxx -e API_KEY_VAULT_PATH=aws_secrets_manager://us-east-1/hybrid-ci-cd/relay-api-key ...`
   - Kubernetes: `kubectl apply -f relay-deployment.yaml`
   - Lambda: Deploy relay Lambda function with IAM role for vault access
4. Configure webhook on tool (GitHub, Jenkins, etc.):
   - Webhook URL: `https://relay.user-infra.com/webhooks/github`
   - Webhook secret: Store in vault, relay fetches on each request
5. Relay forwards metadata to user's queue
6. Provider polls queue, sends routing decisions back
7. Relay executes actions in user's infrastructure

**Provider Steps** (automated):
1. Poll user's queue every 20 seconds (long-polling)
2. Apply routing rules to metadata
3. Send routing decisions back to queue
4. Delete processed messages
5. Monitor relay health via heartbeats

### Testing Strategy (NET ZERO)

**Unit Tests** (backend/tests/unit/test_net_zero.py):
```python
import pytest
from src.models.webhook import WebhookEvent
from src.components.adapters.webhook_adapter import UniversalWebhookAdapter
from src.integrations.queues.factory import create_queue_client
from src.orchestration.router import RelayOrchestrationChain

@pytest.mark.asyncio
async def test_webhook_event_no_payload_field():
    """Verify WebhookEvent does NOT have payload field (security)."""
    event = WebhookEvent(
        event_id="evt_123",
        tool="github",
        event_type="push",
        timestamp="2025-11-12T10:00:00Z",
        source_url="https://github.com/...",
        metadata={"repo": "user/repo"},
        payload_hash="abc123..."
    )
    
    # Should not have payload field
    assert not hasattr(event, "payload")
    assert event.payload_hash == "abc123..."

@pytest.mark.asyncio
async def test_webhook_adapter_sanitizes_payload():
    """Verify adapter hashes payload instead of storing it."""
    adapter = UniversalWebhookAdapter(config={...})
    raw_payload = b'{"secret": "should_never_be_stored", "repo": "user/repo"}'
    
    event = await adapter.parse(raw_payload, headers={...})
    
    # Should have payload_hash, not payload
    assert event.payload_hash is not None
    assert "secret" not in str(event)  # Secret not in event
    assert event.metadata.get("repo") == "user/repo"  # Metadata extracted

@pytest.mark.asyncio
async def test_queue_client_factory():
    """Verify queue factory creates correct clients."""
    aws_config = {"provider": "aws_sqs", "queue_url": "...", "region": "us-east-1"}
    client = create_queue_client(aws_config)
    
    assert client.__class__.__name__ == "AWSSQSClient"

@pytest.mark.asyncio
async def test_orchestration_chain_stateless():
    """Verify orchestration chain is stateless (no persistence)."""
    chain = RelayOrchestrationChain()
    
    # Run chain
    result = await chain.run({
        "queue_config": {...},
        "routing_config": {...}
    })
    
    # Should return sent_count, no stored state
    assert "sent_count" in result
```

**Integration Tests** (backend/tests/integration/test_relay_e2e.py):
- Test full relay registration → queue polling → routing → decision sending
- Test multi-cloud queue support (AWS SQS, Azure Event Grid placeholders)
- Test relay heartbeats and health monitoring

### Security Audit Checklist

**Before Production**:
- [ ] Verify no `payload` field in WebhookEvent model
- [ ] Verify `payload_hash` present in all webhook events
- [ ] Verify secrets not leaked in logs (grep for "secret", "token", "password")
- [ ] Verify queue client factory uses correct provider
- [ ] Verify orchestration chain is stateless (no DB writes)
- [ ] Verify API keys hashed (SHA-256), never plaintext
- [ ] Verify IAM role permissions (read-only queue access)
- [ ] Verify relay signature verification before forwarding
- [ ] Verify OAuth2 token validation on registration
- [ ] Verify rate limiting on relay registration endpoint

### Future Enhancements (Phase 2)

- [ ] Azure Event Grid client implementation
- [ ] GCP Pub/Sub client implementation
- [ ] WebSocket support (real-time instead of polling)
- [ ] Advanced routing rules (complex conditions, filters)
- [ ] Relay health dashboards (uptime, message throughput)
- [ ] Multi-region relay deployment templates
- [ ] Automated relay scaling (based on queue depth)
- [ ] Dead-letter queue monitoring and alerting
- [ ] Cost optimization (reduce polling frequency when idle)
- [ ] Relay versioning and auto-updates

---
