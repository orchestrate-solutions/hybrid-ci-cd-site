/**
 * JobsChain - CodeUChain for managing job state
 * Pattern: Fetch → Filter → Sort → Return
 */

import { Context, Chain, Link } from 'codeuchain';
import type { Job, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Mock API service - replace with actual API later
 */
const mockJobsApi = {
  fetchJobs: async (): Promise<Job[]> => {
    // Simulated API call
    return [
      {
        id: '1',
        name: 'Deploy Backend v2.0',
        status: 'RUNNING',
        priority: 'CRITICAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'alice@example.com',
      },
      {
        id: '2',
        name: 'Run Tests',
        status: 'QUEUED',
        priority: 'HIGH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'bob@example.com',
      },
      {
        id: '3',
        name: 'Database Migration',
        status: 'COMPLETED',
        priority: 'NORMAL',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        created_by: 'alice@example.com',
      },
    ];
  },
};

/**
 * Link 1: Fetch jobs from API
 */
export class FetchJobsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      const jobs = await mockJobsApi.fetchJobs();
      return ctx.insert('jobs', jobs).insert('fetch_timestamp', new Date().toISOString());
    } catch (error) {
      const err = error as ChainError;
      throw new Error(`Failed to fetch jobs: ${err.message}`);
    }
  }
}

/**
 * Link 2: Filter jobs based on criteria
 */
export class FilterJobsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const jobs = ctx.get('jobs') || [];
    const filters = ctx.get('filters') as FilterOptions | undefined;

    if (!filters) {
      // No filters, return all jobs
      return ctx.insert('filtered_jobs', jobs);
    }

    let filtered = [...jobs];

    // Filter by status
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((job: Job) => job.status === filters.status);
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'ALL') {
      filtered = filtered.filter((job: Job) => job.priority === filters.priority);
    }

    // Search by name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((job: Job) =>
        job.name.toLowerCase().includes(searchLower)
      );
    }

    return ctx.insert('filtered_jobs', filtered).insert('filter_applied', true);
  }
}

/**
 * Link 3: Sort jobs
 */
export class SortJobsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const jobs = ctx.get('filtered_jobs') || [];
    const sort = ctx.get('sort') as SortOptions | undefined;

    if (!sort) {
      // Default: sort by created_at descending
      const sorted = [...jobs].sort((a: Job, b: Job) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return ctx.insert('sorted_jobs', sorted);
    }

    const sorted = [...jobs].sort((a: Job, b: Job) => {
      let aVal: any = a[sort.field as keyof Job];
      let bVal: any = b[sort.field as keyof Job];

      // Handle dates
      if (sort.field.includes('_at')) {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sort.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return ctx.insert('sorted_jobs', sorted);
  }
}

/**
 * JobsChain - Orchestrates all job-related operations
 */
export class JobsChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.addLink(new FetchJobsLink(), 'fetch');
    this.chain.addLink(new FilterJobsLink(), 'filter');
    this.chain.addLink(new SortJobsLink(), 'sort');

    // Connect links
    this.chain.connect('fetch', 'filter', () => true);
    this.chain.connect('filter', 'sort', () => true);
  }

  /**
   * Execute chain with optional filters and sort
   */
  async execute(filters?: FilterOptions, sort?: SortOptions): Promise<Job[]> {
    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'created_at', direction: 'desc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('sorted_jobs') || [];
  }
}
