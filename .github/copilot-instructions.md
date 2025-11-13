# Copilot Instructions: Hybrid CI/CD Platform

## Project Overview

**Hybrid CI/CD Platform** is a federated DevOps orchestration system with a production-ready Python backend and Next.js/React frontend. The platform enables configuration-driven tool integrations, community-extensible plugins, and multi-region agent orchestration.

**Key Architecture**: Backend uses FastAPI + CodeUChain (immutable graph processing). Frontend uses React 19 + MUI X with CodeUChain for state management. All code is type-safe (Python 3.11+, TypeScript 5, strict mode).

---

## 🔐 NET ZERO Risk Architecture (Phase 1A - Complete ✅)

### Overview: Provider Has ZERO Access to Secrets

The **NET ZERO** model eliminates provider access to user secrets by shifting data custody to user-owned infrastructure. This achieves **NET ZERO additional risk** compared to standard DevOps workflows (GitHub Actions, Jenkins, AWS).

**Key Principle**: Provider sees ONLY metadata (repo name, commit SHA, branch, event type). Provider NEVER sees: webhook secrets, OAuth tokens, API keys, database passwords, or full payloads.

### Architecture Flow

```
User's Infrastructure:
┌─────────────────────────────────────────────────────────┐
│  Relay (User-Deployed)                                  │
│  ├─ Receives webhook from tool (GitHub, Jenkins)       │
│  ├─ Fetches secret from User's Vault                   │
│  ├─ Verifies signature (HMAC-SHA256)                   │
│  ├─ Sanitizes payload → metadata only                  │
│  └─ Forwards to User's Queue (SQS, EventBridge, etc.)  │
└─────────────────────────────────────────────────────────┘
                      ↓ (metadata only)
┌─────────────────────────────────────────────────────────┐
│  User's Queue (AWS SQS / Azure Event Grid / GCP Pub/Sub)│
│  ├─ Stores sanitized metadata only                     │
│  ├─ No secrets, no full payloads                       │
│  └─ Provider has READ-ONLY IAM access                  │
└─────────────────────────────────────────────────────────┘
                      ↓ (poll metadata)
┌─────────────────────────────────────────────────────────┐
│  Provider's Stateless Orchestration (CodeUChain)       │
│  ├─ PollUserQueueLink (read metadata)                  │
│  ├─ ApplyRoutingRulesLink (stateless matching)         │
│  ├─ SendDecisionsLink (write decisions back)           │
│  └─ NO DATA PERSISTENCE (truly stateless)              │
└─────────────────────────────────────────────────────────┘
```

### Security Guarantees (Verified by 70+ Tests)

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **No payload storage** | WebhookEvent has no `payload` field | test_webhook_event_has_no_payload_field() |
| **Payload hash only** | SHA-256 hash computed, stored for audit | test_adapter_creates_payload_hash() |
| **Secrets not leaked** | Webhook adapter sanitizes, stores metadata only | test_adapter_does_not_store_secrets() |
| **No plaintext keys** | API keys hashed (SHA-256), never stored plaintext | test_api_key_hashing() |
| **Stateless provider** | Orchestration chain reads queue, writes decisions, no persistence | test_orchestration_chain_is_stateless() |
| **User-owned queue** | Provider reads-only via IAM role (cross-account) | verify_access() in AWSSQSClient |
| **User-owned vault** | Relay fetches secrets, never sent to provider | secret_vault_path in config |
| **NET ZERO risk** | Same baseline as GitHub Actions/Jenkins | Risk comparison table in docs |

### Key Backend Components (Phase 1A - Complete)

**Security Layer** (0 secrets exposed):
- `backend/src/models/webhook.py` - WebhookEvent with `payload_hash` (no `payload` field)
- `backend/src/components/adapters/webhook_adapter.py` - Sanitizes payloads, hashes for audit
- `backend/src/db/webhook_store.py` - Stores only `payload_hash`, not full payload

**Queue Integration** (Multi-cloud, config-driven):
- `backend/src/integrations/queues/base.py` - QueueClientInterface (ABC)
- `backend/src/integrations/queues/factory.py` - Config-driven factory pattern
- `backend/src/integrations/queues/aws_sqs.py` - AWS SQS implementation (IAM role auth)
- `backend/src/integrations/queues/azure_eventgrid.py` - Azure placeholder (Phase 2)
- `backend/src/integrations/queues/gcp_pubsub.py` - GCP placeholder (Phase 2)

**Stateless Orchestration** (CodeUChain):
- `backend/src/orchestration/router.py` - 3 links: PollUserQueueLink → ApplyRoutingRulesLink → SendDecisionsLink
- Immutable context flow guarantees no data persistence
- Stateless design verified by tests

**Relay Management** (Registration + health):
- `backend/src/relay_routes.py` - OAuth2 registration, API key generation, heartbeats
- API keys hashed (SHA-256), never stored plaintext
- Relay health monitoring with expiration

**Config Schema** (NET ZERO):
- `config/schemas/net-zero-relay-config.schema.json` - Validates queue + vault configs
- `config/webhooks/tools/github-net-zero.yaml` - Example config showing all required fields
- Queue config: `provider`, `queue_url`, `region`, `role_arn`
- Vault config: `provider`, `region`, `secret_prefix`
- Secrets referenced as URIs: `aws_secrets_manager://region/path`

### Risk Comparison (Why NET ZERO Works)

| Risk Factor | GitHub Actions | Jenkins (Self-Hosted) | Old Model | NET ZERO ✅ |
|-------------|----------------|----------------------|-----------|-----------| 
| **Webhook Secrets** | GitHub stores | User stores | Provider stores ❌ | User vault only ✅ |
| **OAuth Tokens** | GitHub stores | User stores | Provider stores ❌ | User vault only ✅ |
| **Database Passwords** | GitHub Secrets | User stores | Provider could see ❌ | User vault only ✅ |
| **Full Webhook Payloads** | GitHub sees | User only | Provider stores ❌ | User queue only (metadata) ✅ |
| **Data Custody** | GitHub | User | Provider ❌ | User ✅ |
| **Provider Access** | N/A | N/A | Full secrets access ❌ | Read-only metadata ✅ |
| **Risk vs. Baseline** | Baseline | Baseline | INCREASED RISK ❌ | NET ZERO ✅ |

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

## Frontend Architecture (TypeScript/React/MUI X + CodeUChain)

### Core Pattern: CodeUChain Chains → React Components

Frontend mirrors backend architecture using CodeUChain for state management:

```
User Interaction → CodeUChain Chain → API Client → Backend
                   (immutable state flow)
```

### Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | React 19 + MUI X | Components, tables, charts |
| **State** | CodeUChain (frontend chains) | Immutable state flow |
| **Data Fetching** | Typed API clients | Fetch backend data |
| **Styling** | Tailwind CSS 4 + Emotion | Layout, theming |
| **Testing** | Vitest + Cypress | Unit + E2E tests |
| **Stories** | Storybook 8 | Component library docs |
| **Framework** | Next.js 16 (App Router) | Routing, SSR |

### CodeUChain Pattern (Frontend Chains)

Frontend chains focus on **data transformation + UI coordination**, not business logic (that stays in backend).

```typescript
// lib/chains/dashboard.ts - Fetch and aggregate data
import { Context, Chain, Link } from 'codeuchain';

class FetchDashboardMetricsLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const metrics = await dashboardApi.getMetrics();
    return ctx.insert("metrics", metrics);
  }
}

class FetchJobsCountLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const jobs = await jobsApi.list({ limit: 100 });
    const counts = {
      total: jobs.length,
      running: jobs.filter(j => j.status === "RUNNING").length,
      completed: jobs.filter(j => j.status === "COMPLETED").length,
      failed: jobs.filter(j => j.status === "FAILED").length,
    };
    return ctx.insert("job_counts", counts);
  }
}

class AggregateLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const metrics = ctx.get("metrics") || {};
    const job_counts = ctx.get("job_counts") || {};
    const dashboard_data = {
      ...metrics,
      jobs: job_counts,
      updated_at: new Date().toISOString(),
    };
    return ctx.insert("dashboard_data", dashboard_data);
  }
}

// Compose into chain
export class DashboardChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new FetchDashboardMetricsLink(), "fetch_metrics");
    this.chain.add_link(new FetchJobsCountLink(), "fetch_jobs");
    this.chain.add_link(new AggregateLink(), "aggregate");
    
    this.chain.connect("fetch_metrics", "aggregate", () => true);
    this.chain.connect("fetch_jobs", "aggregate", () => true);
  }

  async run(): Promise<any> {
    const ctx = new Context({});
    const result = await this.chain.run(ctx);
    return result.get("dashboard_data");
  }
}

// Usage in component
export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const dashboardChain = useMemo(() => new DashboardChain(), []);

  useEffect(() => {
    setLoading(true);
    dashboardChain.run().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
```

**Key Differences from Backend**:
- Frontend chains orchestrate UI data, not business logic
- Links fetch from API clients (not databases)
- Context contains UI state (filters, pagination, sorting)
- No data persistence (chains are stateless)
- Real-time polling managed via React hooks

### API Client Pattern (Typed, Error Handling)

```typescript
// lib/api/dashboard.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DashboardMetrics {
  jobs_queued: number;
  jobs_running: number;
  jobs_completed: number;
  agents_active: number;
  uptime_hours: number;
}

export interface Job {
  id: string;
  name: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  created_at: string;
  completed_at?: string;
}

export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${BASE_URL}/api/dashboard/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`);
    return res.json();
  },

  async getOverview(): Promise<{
    metrics: DashboardMetrics;
    recent_jobs: Job[];
    agent_count: number;
  }> {
    const res = await fetch(`${BASE_URL}/api/dashboard/overview`);
    if (!res.ok) throw new Error(`Failed to fetch overview: ${res.status}`);
    return res.json();
  },
};

export const jobsApi = {
  async list(limit = 100): Promise<Job[]> {
    const res = await fetch(`${BASE_URL}/api/dashboard/jobs?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to list jobs: ${res.status}`);
    return (await res.json()).jobs || [];
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
// components/dashboard/StatusCard.tsx - Reusable card
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatusCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'success' | 'warning' | 'error' | 'info';
}

export function StatusCard({ title, value, icon, color = 'info' }: StatusCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Box>
            <Typography color="textSecondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// components/dashboard/MetricsGrid.tsx - Grid of cards
import { Grid } from '@mui/material';
import { Timeline, Speed, CheckCircle, Error } from '@mui/icons-material';

export function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <StatusCard
          title="Queued"
          value={metrics.jobs_queued}
          icon={<Timeline />}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatusCard
          title="Running"
          value={metrics.jobs_running}
          icon={<Speed />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatusCard
          title="Completed"
          value={metrics.jobs_completed}
          icon={<CheckCircle />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatusCard
          title="Agents Active"
          value={metrics.agents_active}
          icon={<Error />}
          color="error"
        />
      </Grid>
    </Grid>
  );
}

// components/dashboard/DashboardOverview.tsx - Full page
export function DashboardOverview() {
  const { data, loading } = useDashboard();

  if (loading) return <Skeleton variant="rectangular" height={400} />;
  if (!data) return <Typography>Failed to load dashboard</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>Dashboard</Typography>
      <MetricsGrid metrics={data.metrics} />
      {/* More components... */}
    </Box>
  );
}
```

### Storybook Pattern (Visual Testing)

```typescript
// components/dashboard/StatusCard.stories.tsx
import { Meta, StoryObj } from '@storybook/react';
import { StatusCard } from './StatusCard';
import { Timeline, CheckCircle, Error } from '@mui/icons-material';

export default {
  component: StatusCard,
  tags: ['autodocs'],
} satisfies Meta<typeof StatusCard>;

type Story = StoryObj<typeof StatusCard>;

export const Default: Story = {
  args: {
    title: "Queued Jobs",
    value: 42,
    icon: <Timeline />,
    color: "warning",
  },
};

export const Success: Story = {
  args: { ...Default.args, title: "Completed", icon: <CheckCircle />, color: "success" },
};

export const Error: Story = {
  args: { ...Default.args, title: "Failed", icon: <Error />, color: "error" },
};
```

### Directory Structure (Frontend)

```
src/
├── app/
│   ├── layout.tsx              # Root layout (existing)
│   ├── page.tsx                # Landing page (existing)
│   ├── globals.css             # Global styles (existing)
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout
│       ├── page.tsx            # Dashboard overview
│       ├── jobs/page.tsx       # Jobs page
│       ├── deployments/page.tsx
│       └── agents/page.tsx
│
├── components/
│   ├── ThemeProvider.tsx       # Dark mode (existing)
│   ├── dashboard/              # Dashboard-specific
│   │   ├── StatusCard.tsx
│   │   ├── StatusCard.stories.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── LogViewer.tsx
│   │   ├── RefreshSlider.tsx
│   │   └── __tests__/
│   │       ├── StatusCard.test.tsx (Vitest)
│   │       └── StatusCard.cy.tsx (Cypress)
│   └── ...
│
├── lib/
│   ├── api/                    # NEW
│   │   ├── dashboard.ts        # Dashboard API client
│   │   ├── jobs.ts             # Jobs API client
│   │   ├── deployments.ts      # Deployments API client
│   │   ├── agents.ts           # Agents API client
│   │   └── metrics.ts          # Metrics API client
│   │
│   ├── chains/                 # NEW - CodeUChain orchestration
│   │   ├── dashboard.ts        # DashboardChain
│   │   ├── jobs.ts             # JobsChain
│   │   ├── deployments.ts      # DeploymentsChain
│   │   ├── agents.ts           # AgentsChain
│   │   └── types.ts            # Shared types
│   │
│   ├── hooks/                  # NEW - Custom hooks
│   │   ├── useDashboard.ts
│   │   ├── useJobs.ts
│   │   ├── useRealTime.ts
│   │   └── useUserPreferences.ts
│   │
│   └── types/                  # NEW - TypeScript types
│       ├── dashboard.ts
│       ├── jobs.ts
│       ├── deployments.ts
│       └── agents.ts
│
└── hooks/                      # Keep for backward compat
```

### Testing Pattern: Three Layers (Vitest + Cypress + E2E)

```bash
# Layer 1: Unit tests (Vitest) - Fast, logic-focused
npm run test:unit src/components/dashboard

# Layer 2: Component tests (Cypress) - Real browser, user interactions
npm run test:component

# Layer 3: E2E tests (Cypress) - Full workflows
npm run test:e2e
```

### When Adding Features: Checklist

- [ ] **Types First**: Define TypeScript interfaces
- [ ] **Storybook Stories**: Multiple states (default, loading, error, disabled)
- [ ] **Unit Tests (RED)**: Write Vitest tests BEFORE component
- [ ] **Component Tests (RED)**: Write Cypress tests BEFORE implementation
- [ ] **Component Implementation**: Build React component
- [ ] **Tests PASS**: Verify all three layers
- [ ] **Git Commit**: Use conventional commits (`feat(dashboard): add StatusCard`)

---

## NET ZERO Frontend Principles

1. **Immutable State**: CodeUChain chains guarantee no mutation bugs
2. **Type-Safe**: Full TypeScript strict mode, no `any` types
3. **Component-First**: Build components before pages
4. **Storybook Stories**: Document all component states
5. **Three-Layer Testing**: Unit + Component + E2E
6. **Real-Time User Control**: Live/Efficient/Off refresh modes
7. **No Secrets in Frontend**: All sensitive data stays backend-only
8. **Accessibility First**: ARIA labels, keyboard nav, color contrast (WCAG AA)
9. **Responsive Design**: Mobile-first (xs, sm, md, lg, xl breakpoints)
10. **Performance**: Lazy loading, code splitting, virtual scrolling for large lists

---

## Key Insights

1. **Backend-Driven**: All state flows from FastAPI backend. Frontend queries via REST, manipulates via CodeUChain chains.

2. **Immutable by Design**: CodeUChain's immutable Context eliminates mutation bugs. Used consistently across backend & frontend.

3. **Type-Safe End-to-End**: Python 3.11 + TypeScript 5 (strict mode) = zero runtime type surprises.

4. **Interface-Based Extensibility**: Stores/APIs use abstract interfaces → easy to swap implementations (DynamoDB vs. Redis, etc.).

5. **Test Everything**: 879 tests (280 unit + 313 stories + 286 E2E) = confidence to refactor.

6. **Configuration Over Code**: Tools defined in JSON configs (not hardcoded) → community can contribute new integrations without PRs.

7. **NET ZERO Trust Model**: User owns infrastructure (queue, vault, secrets). Provider is stateless, sees only metadata. Same risk baseline as GitHub Actions.

---

## Developer Notes

- Work on feature branches with conventional names (`feat/`, `fix/`, `docs/`, `test/`)
- Commit frequently with descriptive messages
- Push to origin regularly to save work
- Run `npm run test:unit` and `npm run lint` before pushing
- Use Test-Driven Development (RED phase always before BUILD)
- All components start with Storybook stories + tests (RED), then implementation (GREEN)
