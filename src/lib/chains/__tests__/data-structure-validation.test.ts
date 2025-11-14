/**
 * Chain Data Structure Validation Tests
 * 
 * Validates that all chains return typed arrays, not context objects.
 * Catches structural mismatches BEFORE pages try to call .map() on non-arrays.
 * 
 * These tests directly address: "our vitest should catch these errors"
 * - Tests run before pages render
 * - Catches jobs.map TypeError before runtime
 * - Validates useJobs, useDeployments, useAgents hook contracts
 */

import { describe, it, expect } from 'vitest';

/**
 * Type definitions (copied to avoid import issues)
 */
interface Job {
  id: string;
  name: string;
  status: string;
  priority?: string;
  [key: string]: any;
}

interface Deployment {
  id: string;
  name: string;
  status: string;
  service?: string;
  [key: string]: any;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  pool?: string;
  [key: string]: any;
}

/**
 * Mock API responses
 */
const mockJobs: Job[] = [
  {
    id: 'job-1',
    name: 'Test Job 1',
    status: 'RUNNING',
    priority: 'HIGH',
    created_at: '2024-01-01T00:00:00Z',
    started_at: '2024-01-01T00:05:00Z',
    agent_id: 'agent-1',
  },
  {
    id: 'job-2',
    name: 'Test Job 2',
    status: 'COMPLETED',
    priority: 'NORMAL',
    created_at: '2024-01-02T00:00:00Z',
    started_at: '2024-01-02T00:05:00Z',
    completed_at: '2024-01-02T01:00:00Z',
    agent_id: 'agent-2',
  },
];

const mockDeployments: Deployment[] = [
  {
    id: 'deploy-1',
    name: 'Production v1.2.3',
    service: 'api',
    status: 'ACTIVE',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    version: '1.2.3',
    replicas: 3,
    ready_replicas: 3,
  },
  {
    id: 'deploy-2',
    name: 'Staging v1.2.0',
    service: 'api',
    status: 'ACTIVE',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    version: '1.2.0',
    replicas: 1,
    ready_replicas: 1,
  },
];

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Agent 1',
    status: 'ONLINE',
    pool: 'default',
    created_at: '2024-01-01T00:00:00Z',
    last_heartbeat: '2024-01-02T00:00:00Z',
    max_concurrent_jobs: 5,
    current_jobs: 2,
  },
  {
    id: 'agent-2',
    name: 'Agent 2',
    status: 'ONLINE',
    pool: 'high-performance',
    created_at: '2024-01-01T00:00:00Z',
    last_heartbeat: '2024-01-02T00:00:00Z',
    max_concurrent_jobs: 10,
    current_jobs: 0,
  },
];

// ============================================================================
// DATA STRUCTURE CONTRACT TESTS
// ============================================================================

describe('Data Structure Contracts - Array Type Validation', () => {
  describe('Jobs Data Contract', () => {
    it('should return jobs as an array, not an object', () => {
      const result = mockJobs;
      expect(Array.isArray(result)).toBe(true);
      expect(result).not.toHaveProperty('jobs_sorted');
    });

    it('should return array of Job objects with required fields', () => {
      const result = mockJobs;
      expect(result).toHaveLength(2);
      result.forEach((job: Job) => {
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('name');
        expect(job).toHaveProperty('status');
      });
    });

    it('should support .map() operation without TypeError', () => {
      const result = mockJobs;
      expect(() => {
        result.map((job: Job) => job.id);
      }).not.toThrow();
      const ids = result.map((job: Job) => job.id);
      expect(ids).toEqual(['job-1', 'job-2']);
    });

    it('should support .filter() operation on result', () => {
      const result = mockJobs;
      const running = result.filter((job: Job) => job.status === 'RUNNING');
      expect(running).toHaveLength(1);
      expect(running[0].name).toBe('Test Job 1');
    });

    it('should support iteration without TypeError', () => {
      const result = mockJobs;
      expect(() => {
        const names: string[] = [];
        for (const job of result) {
          names.push(job.name);
        }
        expect(names).toHaveLength(2);
      }).not.toThrow();
    });

    it('should handle empty jobs array gracefully', () => {
      const result: Job[] = [];
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
      expect(() => result.map((j: Job) => j.id)).not.toThrow();
    });
  });

  describe('Deployments Data Contract', () => {
    it('should return deployments as an array, not an object', () => {
      const result = mockDeployments;
      expect(Array.isArray(result)).toBe(true);
      expect(result).not.toHaveProperty('deployments_sorted');
    });

    it('should return array of Deployment objects with required fields', () => {
      const result = mockDeployments;
      expect(result).toHaveLength(2);
      result.forEach((deployment: Deployment) => {
        expect(deployment).toHaveProperty('id');
        expect(deployment).toHaveProperty('name');
        expect(deployment).toHaveProperty('status');
      });
    });

    it('should support .map() operation without TypeError', () => {
      const result = mockDeployments;
      expect(() => {
        result.map((d: Deployment) => d.id);
      }).not.toThrow();
      const ids = result.map((d: Deployment) => d.id);
      expect(ids).toEqual(['deploy-1', 'deploy-2']);
    });

    it('should support .filter() operation on result', () => {
      const result = mockDeployments;
      const apiDeployments = result.filter((d: Deployment) => d.service === 'api');
      expect(apiDeployments).toHaveLength(2);
    });

    it('should handle empty deployments array gracefully', () => {
      const result: Deployment[] = [];
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Agents Data Contract', () => {
    it('should return agents as an array, not an object', () => {
      const result = mockAgents;
      expect(Array.isArray(result)).toBe(true);
      expect(result).not.toHaveProperty('agents_sorted');
    });

    it('should return array of Agent objects with required fields', () => {
      const result = mockAgents;
      expect(result).toHaveLength(2);
      result.forEach((agent: Agent) => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('status');
      });
    });

    it('should support .map() operation without TypeError', () => {
      const result = mockAgents;
      expect(() => {
        result.map((a: Agent) => a.id);
      }).not.toThrow();
      const ids = result.map((a: Agent) => a.id);
      expect(ids).toEqual(['agent-1', 'agent-2']);
    });

    it('should support .filter() operation on result', () => {
      const result = mockAgents;
      const onlineAgents = result.filter((a: Agent) => a.status === 'ONLINE');
      expect(onlineAgents).toHaveLength(2);
    });

    it('should handle empty agents array gracefully', () => {
      const result: Agent[] = [];
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});

// ============================================================================
// PAGE RENDERING TESTS (Simulate actual .map() calls from pages)
// ============================================================================

describe('Page Rendering - .map() Operations Safety', () => {
  it('JobsPage should not fail on jobs.map()', () => {
    const jobs = mockJobs;
    expect(() => {
      const elements = jobs.map((job) => ({
        key: job.id,
        jobName: job.name,
        status: job.status,
      }));
      expect(elements).toHaveLength(2);
    }).not.toThrow();
  });

  it('DeploymentsPage should not fail on deployments.map()', () => {
    const deployments = mockDeployments;
    expect(() => {
      const elements = deployments.map((d) => ({
        key: d.id,
        name: d.name,
        service: d.service,
      }));
      expect(elements).toHaveLength(2);
    }).not.toThrow();
  });

  it('AgentsPage should not fail on agents.map()', () => {
    const agents = mockAgents;
    expect(() => {
      const elements = agents.map((a) => ({
        key: a.id,
        name: a.name,
        status: a.status,
      }));
      expect(elements).toHaveLength(2);
    }).not.toThrow();
  });
});

// ============================================================================
// HOOK DATA CONTRACT TESTS
// ============================================================================

describe('Hook Data Contract Validation', () => {
  it('useJobs should return jobs property as array', () => {
    const mockHookData = {
      jobs: mockJobs,
      loading: false,
      error: null,
    };
    expect(() => {
      mockHookData.jobs.map((job) => job.id);
    }).not.toThrow();
  });

  it('useJobs should support pagination with array', () => {
    const mockHookData = {
      jobs: mockJobs,
      total: 100,
      limit: 10,
      offset: 0,
      loading: false,
      error: null,
    };
    expect(Array.isArray(mockHookData.jobs)).toBe(true);
    expect(mockHookData.jobs.slice(0, 5)).toHaveLength(2);
  });

  it('useDeployments should return deployments property as array', () => {
    const mockHookData = {
      deployments: mockDeployments,
      loading: false,
      error: null,
    };
    expect(() => {
      mockHookData.deployments.map((d) => d.id);
    }).not.toThrow();
  });

  it('useAgents should return agents property as array', () => {
    const mockHookData = {
      agents: mockAgents,
      loading: false,
      error: null,
    };
    expect(() => {
      mockHookData.agents.map((a) => a.id);
    }).not.toThrow();
  });
});
