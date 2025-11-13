/**
 * JobsChain - CodeUChain for managing job state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/jobs.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { jobsApi } from '../api/jobs';
import { queueApi } from '../api/queue';
import type { Job, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch jobs from API
 * Uses jobsApi.listJobs() for dashboard view (CRUD)
 * and queueApi.listPendingJobs() for queue operations
 */
export class FetchJobsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includeQueue: boolean = false) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch from dashboard (CRUD)
      const dashboardJobs = await jobsApi.listJobs();
      
      let allJobs = dashboardJobs || [];
      
      // Optionally include queue status from queue API
      if (this.includeQueue) {
        const queueStats = await queueApi.getQueueStats();
        const pendingJobs = await queueApi.listPendingJobs(100);
        
        // Augment jobs with queue status
        allJobs = allJobs.map(job => {
          const queueJob = pendingJobs?.find(qj => qj.id === job.id);
          return {
            ...job,
            queue_position: queueJob?.position,
            queue_status: queueJob?.status,
          };
        });
        
        return ctx
          .insert('jobs', allJobs)
          .insert('queue_stats', queueStats)
          .insert('fetch_timestamp', new Date().toISOString());
      }
      
      return ctx
        .insert('jobs', allJobs)
        .insert('fetch_timestamp', new Date().toISOString());
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
 * 
 * ARCHITECTURE:
 * - FetchJobsLink: Calls jobsApi.listJobs() for dashboard CRUD
 * - Optional: Augments with queueApi.listPendingJobs() for queue position
 * - FilterJobsLink: Filters by status, priority, search term
 * - SortJobsLink: Sorts by field + direction (default: created_at desc)
 * 
 * USAGE:
 * ```typescript
 * const chain = new JobsChain(includeQueue: true);
 * const jobs = await chain.execute(
 *   { status: 'RUNNING', priority: 'CRITICAL' },
 *   { field: 'created_at', direction: 'desc' }
 * );
 * ```
 */
export class JobsChain {
  private chain: Chain;

  constructor(private includeQueue: boolean = false) {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.add_link(new FetchJobsLink(includeQueue), 'fetch');
    this.chain.add_link(new FilterJobsLink(), 'filter');
    this.chain.add_link(new SortJobsLink(), 'sort');

    // Connect links with predicates
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

  /**
   * Get queue stats if included in chain
   */
  async getQueueStats(filters?: FilterOptions, sort?: SortOptions): Promise<Record<string, any>> {
    if (!this.includeQueue) {
      throw new Error('Queue stats not available; initialize chain with includeQueue: true');
    }

    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'created_at', direction: 'desc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('queue_stats') || {};
  }
}
