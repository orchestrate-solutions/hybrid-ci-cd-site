/**
 * Mock Data for Demo Mode
 * 
 * Realistic demo data for jobs, deployments, agents, and metrics
 * Used when demo mode is enabled in Settings
 */

import { DashboardMetrics } from '@/lib/api/metrics';

/**
 * Demo metrics - realistic snapshot
 */
export const DEMO_METRICS: DashboardMetrics = {
  jobs_running: 12,
  jobs_failed_today: 2,
  deployments_today: 5,
  queue_depth: 8,
  average_wait_time_seconds: 42,
};

/**
 * Demo jobs for the jobs page
 */
export const DEMO_JOBS = [
  {
    id: 'job-001',
    name: 'Deploy backend service v2.5.0',
    status: 'RUNNING',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    duration_seconds: 180,
    git_repo: 'orchestrate-solutions/backend',
    git_branch: 'main',
    git_commit: 'abc123def456',
  },
  {
    id: 'job-002',
    name: 'Run tests for frontend',
    status: 'COMPLETED',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    duration_seconds: 120,
    git_repo: 'orchestrate-solutions/frontend',
    git_branch: 'feat/dashboard',
    git_commit: 'xyz789uvw012',
  },
  {
    id: 'job-003',
    name: 'Database migration v2.5.0',
    status: 'FAILED',
    priority: 'CRITICAL',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 43 * 60 * 1000).toISOString(),
    duration_seconds: 85,
    git_repo: 'orchestrate-solutions/db',
    git_branch: 'main',
    git_commit: 'mno345pqr678',
  },
  {
    id: 'job-004',
    name: 'Deploy frontend to staging',
    status: 'QUEUED',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    started_at: null,
    duration_seconds: null,
    git_repo: 'orchestrate-solutions/frontend',
    git_branch: 'main',
    git_commit: 'stu901vwx234',
  },
  {
    id: 'job-005',
    name: 'Security scan with trivy',
    status: 'RUNNING',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    duration_seconds: 360,
    git_repo: 'orchestrate-solutions/docker-images',
    git_branch: 'main',
    git_commit: 'yza567bcd890',
  },
];

/**
 * Demo deployments
 */
export const DEMO_DEPLOYMENTS = [
  {
    id: 'deploy-001',
    version: '2.5.0',
    status: 'LIVE',
    deployed_to_staging: true,
    staged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deployed_to_production: true,
    production_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    rolled_back_reason: null,
  },
  {
    id: 'deploy-002',
    version: '2.4.9',
    status: 'ROLLED_BACK',
    deployed_to_staging: true,
    staged_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    deployed_to_production: true,
    production_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    rolled_back_reason: 'Database migration incompatibility',
  },
  {
    id: 'deploy-003',
    version: '2.5.1-rc1',
    status: 'STAGED',
    deployed_to_staging: true,
    staged_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    deployed_to_production: false,
    production_at: null,
    rolled_back_reason: null,
  },
];

/**
 * Demo agents - includes resource metrics for pool health indicators
 */
export const DEMO_AGENTS = [
  {
    id: 'agent-us-east-1-001',
    name: 'us-east-1-worker-01',
    status: 'HEALTHY',
    pool_name: 'us-east-1',
    cpu_percent: 45,
    memory_percent: 62,
    disk_percent: 38,
    cpu_cores: 8,
    memory_mb: 16384,
    disk_gb: 256,
    version: '1.2.5',
    last_heartbeat: new Date(Date.now() - 5 * 1000).toISOString(),
    jobs_queued: 3,
    jobs_completed: 142,
  },
  {
    id: 'agent-us-east-1-002',
    name: 'us-east-1-worker-02',
    status: 'HEALTHY',
    pool_name: 'us-east-1',
    cpu_percent: 28,
    memory_percent: 41,
    disk_percent: 32,
    cpu_cores: 8,
    memory_mb: 16384,
    disk_gb: 256,
    version: '1.2.5',
    last_heartbeat: new Date(Date.now() - 3 * 1000).toISOString(),
    jobs_queued: 2,
    jobs_completed: 156,
  },
  {
    id: 'agent-us-west-2-001',
    name: 'us-west-2-worker-01',
    status: 'HEALTHY',
    pool_name: 'us-west-2',
    cpu_percent: 72,
    memory_percent: 85,
    disk_percent: 51,
    cpu_cores: 16,
    memory_mb: 32768,
    disk_gb: 512,
    version: '1.2.5',
    last_heartbeat: new Date(Date.now() - 8 * 1000).toISOString(),
    jobs_queued: 4,
    jobs_completed: 98,
  },
  {
    id: 'agent-eu-west-1-001',
    name: 'eu-west-1-worker-01',
    status: 'UNHEALTHY',
    pool_name: 'eu-west-1',
    cpu_percent: 95,
    memory_percent: 92,
    disk_percent: 88,
    cpu_cores: 4,
    memory_mb: 8192,
    disk_gb: 128,
    version: '1.2.4',
    last_heartbeat: new Date(Date.now() - 45 * 1000).toISOString(),
    jobs_queued: 0,
    jobs_completed: 67,
  },
];

/**
 * Demo sample logs for jobs
 */
export const DEMO_LOGS: Record<string, string[]> = {
  'job-001': [
    '[2025-11-10T14:32:10Z] Starting deployment of backend v2.5.0',
    '[2025-11-10T14:32:12Z] Pulling Docker image: orchestrate-solutions/backend:2.5.0',
    '[2025-11-10T14:32:18Z] Image pulled successfully (sha256: abc123...)',
    '[2025-11-10T14:32:20Z] Running pre-deployment health checks',
    '[2025-11-10T14:32:22Z] ✅ Database connectivity: OK',
    '[2025-11-10T14:32:23Z] ✅ API health check: 200 OK',
    '[2025-11-10T14:32:25Z] Deploying 3 replicas to us-east-1',
    '[2025-11-10T14:32:30Z] Replica 1: Running',
    '[2025-11-10T14:32:32Z] Replica 2: Running',
    '[2025-11-10T14:32:34Z] Replica 3: Running',
    '[2025-11-10T14:32:36Z] Verifying deployment stability',
    '[2025-11-10T14:32:40Z] ✅ All replicas healthy',
    '[2025-11-10T14:32:42Z] Deployment complete',
  ],
  'job-002': [
    '[2025-11-10T14:20:00Z] Running test suite for frontend',
    '[2025-11-10T14:20:05Z] Installing dependencies...',
    '[2025-11-10T14:20:15Z] ✅ Dependencies installed (142 packages)',
    '[2025-11-10T14:20:20Z] Running unit tests (vitest)',
    '[2025-11-10T14:20:45Z] ✅ 194 tests passed',
    '[2025-11-10T14:20:50Z] Running E2E tests (Cypress)',
    '[2025-11-10T14:21:15Z] ✅ 42 E2E tests passed',
    '[2025-11-10T14:21:20Z] Running linter',
    '[2025-11-10T14:21:25Z] ✅ No linting errors',
    '[2025-11-10T14:21:30Z] Test suite completed successfully',
  ],
  'job-003': [
    '[2025-11-10T14:15:00Z] Running database migration v2.5.0',
    '[2025-11-10T14:15:05Z] Connecting to production database',
    '[2025-11-10T14:15:08Z] ✅ Connected to primary DB',
    '[2025-11-10T14:15:10Z] Starting migration: add_user_profiles_table',
    '[2025-11-10T14:15:15Z] Creating table user_profiles...',
    '[2025-11-10T14:15:18Z] ✅ Table created',
    '[2025-11-10T14:15:20Z] Adding foreign key constraints...',
    '[2025-11-10T14:15:25Z] ❌ ERROR: Foreign key constraint failed',
    '[2025-11-10T14:15:25Z] Details: Constraint violation on users table',
    '[2025-11-10T14:15:26Z] Rolling back changes...',
    '[2025-11-10T14:15:30Z] Migration rolled back',
    '[2025-11-10T14:15:32Z] FATAL: Migration failed',
  ],
};

/**
 * Get demo metrics
 */
export function getDemoMetrics(): DashboardMetrics {
  return DEMO_METRICS;
}

/**
 * Get demo jobs
 */
export function getDemoJobs() {
  return DEMO_JOBS;
}

/**
 * Get demo deployments
 */
export function getDemoDeployments() {
  return DEMO_DEPLOYMENTS;
}

/**
 * Get demo agents
 */
export function getDemoAgents() {
  return DEMO_AGENTS;
}

/**
 * Get demo logs for a job
 */
export function getDemoJobLogs(jobId: string): string[] {
  return DEMO_LOGS[jobId] || [
    '[INFO] No logs available for this job',
  ];
}

/**
 * Get demo jobs as ListJobsResponse
 */
export function getDemoJobsResponse() {
  return {
    jobs: DEMO_JOBS,
    total: DEMO_JOBS.length,
    limit: 100,
    offset: 0,
  };
}

/**
 * Get demo deployments as ListDeploymentsResponse
 */
export function getDemoDeploymentsResponse() {
  return {
    deployments: DEMO_DEPLOYMENTS,
    total: DEMO_DEPLOYMENTS.length,
    limit: 100,
    offset: 0,
  };
}

/**
 * Get demo agents as ListAgentsResponse
 */
export function getDemoAgentsResponse() {
  return {
    agents: DEMO_AGENTS,
    total: DEMO_AGENTS.length,
    limit: 100,
    offset: 0,
  };
}

/**
 * Get demo metrics as MetricsResponse
 */
export function getDemoMetricsResponse() {
  return {
    metrics: DEMO_METRICS,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get demo dashboard overview (aggregate of metrics, recent jobs, and agent count)
 */
export function getDemoDashboardOverview() {
  return {
    metrics: DEMO_METRICS,
    recent_jobs: DEMO_JOBS.slice(0, 5),
    recent_deployments: DEMO_DEPLOYMENTS.slice(0, 3),
    agent_count: DEMO_AGENTS.length,
    agent_health: {
      healthy: DEMO_AGENTS.filter(a => a.status === 'HEALTHY').length,
      unhealthy: DEMO_AGENTS.filter(a => a.status === 'UNHEALTHY').length,
      degraded: 0,
    },
    timestamp: new Date().toISOString(),
  };
}
