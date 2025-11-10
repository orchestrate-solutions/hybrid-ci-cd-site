/**
 * JobsChain Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'codeuchain';
import { FetchJobsLink, FilterJobsLink, SortJobsLink, JobsChain } from '../jobs';
import type { Job, FilterOptions, SortOptions } from '../types';

describe('FetchJobsLink', () => {
  it('fetches jobs from API', async () => {
    const link = new FetchJobsLink();
    const ctx = new Context({});
    const result = await link.call(ctx);

    const jobs = result.get('jobs') as Job[];
    expect(jobs).toBeDefined();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('adds fetch timestamp to context', async () => {
    const link = new FetchJobsLink();
    const ctx = new Context({});
    const result = await link.call(ctx);

    const timestamp = result.get('fetch_timestamp');
    expect(timestamp).toBeDefined();
    expect(typeof timestamp).toBe('string');
  });

  it('preserves original context data', async () => {
    const link = new FetchJobsLink();
    const ctx = new Context({ custom: 'data' });
    const result = await link.call(ctx);

    expect(result.get('custom')).toBe('data');
  });
});

describe('FilterJobsLink', () => {
  let mockJobs: Job[];

  beforeEach(() => {
    mockJobs = [
      {
        id: '1',
        name: 'Job A',
        status: 'RUNNING',
        priority: 'CRITICAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Job B',
        status: 'COMPLETED',
        priority: 'HIGH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Test Job C',
        status: 'RUNNING',
        priority: 'NORMAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  it('returns all jobs when no filters provided', async () => {
    const link = new FilterJobsLink();
    const ctx = new Context({ jobs: mockJobs });
    const result = await link.call(ctx);

    const filtered = result.get('filtered_jobs') as Job[];
    expect(filtered).toHaveLength(3);
  });

  it('filters jobs by status', async () => {
    const link = new FilterJobsLink();
    const filters: FilterOptions = { status: 'RUNNING' };
    const ctx = new Context({ jobs: mockJobs, filters });
    const result = await link.call(ctx);

    const filtered = result.get('filtered_jobs') as Job[];
    expect(filtered).toHaveLength(2);
    expect(filtered.every((j) => j.status === 'RUNNING')).toBe(true);
  });

  it('filters jobs by priority', async () => {
    const link = new FilterJobsLink();
    const filters: FilterOptions = { priority: 'HIGH' };
    const ctx = new Context({ jobs: mockJobs, filters });
    const result = await link.call(ctx);

    const filtered = result.get('filtered_jobs') as Job[];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].priority).toBe('HIGH');
  });

  it('searches jobs by name (case-insensitive)', async () => {
    const link = new FilterJobsLink();
    const filters: FilterOptions = { search: 'test' };
    const ctx = new Context({ jobs: mockJobs, filters });
    const result = await link.call(ctx);

    const filtered = result.get('filtered_jobs') as Job[];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toContain('Test');
  });

  it('combines multiple filters', async () => {
    const link = new FilterJobsLink();
    const filters: FilterOptions = { status: 'RUNNING', priority: 'CRITICAL' };
    const ctx = new Context({ jobs: mockJobs, filters });
    const result = await link.call(ctx);

    const filtered = result.get('filtered_jobs') as Job[];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('marks when filters are applied', async () => {
    const link = new FilterJobsLink();
    const filters: FilterOptions = { status: 'RUNNING' };
    const ctx = new Context({ jobs: mockJobs, filters });
    const result = await link.call(ctx);

    expect(result.get('filter_applied')).toBe(true);
  });
});

describe('SortJobsLink', () => {
  let mockJobs: Job[];

  beforeEach(() => {
    mockJobs = [
      {
        id: '1',
        name: 'Job A',
        status: 'RUNNING',
        priority: 'CRITICAL',
        created_at: new Date(Date.now() - 5000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Job B',
        status: 'COMPLETED',
        priority: 'HIGH',
        created_at: new Date(Date.now() - 10000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Job C',
        status: 'RUNNING',
        priority: 'NORMAL',
        created_at: new Date(Date.now() - 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  it('defaults to sorting by created_at descending', async () => {
    const link = new SortJobsLink();
    const ctx = new Context({ filtered_jobs: mockJobs });
    const result = await link.call(ctx);

    const sorted = result.get('sorted_jobs') as Job[];
    expect(sorted[0].id).toBe('3'); // Most recent
    expect(sorted[2].id).toBe('2'); // Oldest
  });

  it('sorts by field ascending', async () => {
    const link = new SortJobsLink();
    const sort: SortOptions = { field: 'name', direction: 'asc' };
    const ctx = new Context({ filtered_jobs: mockJobs, sort });
    const result = await link.call(ctx);

    const sorted = result.get('sorted_jobs') as Job[];
    expect(sorted[0].name).toBe('Job A');
    expect(sorted[2].name).toBe('Job C');
  });

  it('sorts by field descending', async () => {
    const link = new SortJobsLink();
    const sort: SortOptions = { field: 'name', direction: 'desc' };
    const ctx = new Context({ filtered_jobs: mockJobs, sort });
    const result = await link.call(ctx);

    const sorted = result.get('sorted_jobs') as Job[];
    expect(sorted[0].name).toBe('Job C');
    expect(sorted[2].name).toBe('Job A');
  });

  it('sorts by status', async () => {
    const link = new SortJobsLink();
    const sort: SortOptions = { field: 'status', direction: 'asc' };
    const ctx = new Context({ filtered_jobs: mockJobs, sort });
    const result = await link.call(ctx);

    const sorted = result.get('sorted_jobs') as Job[];
    expect(sorted[0].status).toBe('COMPLETED');
  });
});

describe('JobsChain', () => {
  let chain: JobsChain;

  beforeEach(() => {
    chain = new JobsChain();
  });

  it('executes without filters or sort', async () => {
    const jobs = await chain.execute();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('executes with filter options', async () => {
    const filters: FilterOptions = { status: 'RUNNING' };
    const jobs = await chain.execute(filters);

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.every((j) => j.status === 'RUNNING')).toBe(true);
  });

  it('executes with sort options', async () => {
    const sort: SortOptions = { field: 'name', direction: 'asc' };
    const jobs = await chain.execute(undefined, sort);

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    // Verify sorted by name
    expect(jobs[0].name <= jobs[1].name).toBe(true);
  });

  it('executes with both filters and sort', async () => {
    const filters: FilterOptions = { status: 'RUNNING' };
    const sort: SortOptions = { field: 'name', direction: 'asc' };
    const jobs = await chain.execute(filters, sort);

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.every((j) => j.status === 'RUNNING')).toBe(true);
  });

  it('returns jobs in correct format', async () => {
    const jobs = await chain.execute();

    jobs.forEach((job) => {
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('name');
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('priority');
      expect(job).toHaveProperty('created_at');
      expect(job).toHaveProperty('updated_at');
    });
  });
});
