/**
 * JobsChain - CodeUChain for managing job state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/jobs.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { listJobs } from '../api/jobs';
import { listPendingJobs } from '../api/queue';
import type { Job, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch jobs from API
 * Uses listJobs() for dashboard view (CRUD)
 * and listPendingJobs() for queue operations
 */
export class FetchJobsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includeQueue: boolean = false) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch from dashboard (CRUD)
      const response = await listJobs();
      const dashboardJobs = response.jobs || [];
      
      let allJobs = dashboardJobs;
      
      // Optionally include queue status from queue API
      if (this.includeQueue) {
        try {
          const queueResponse = await listPendingJobs();
          const queueJobs = queueResponse.jobs || [];
          
          // Merge with queue status
          const queueMap = new Map(queueJobs.map((j: Job) => [j.id, j]));
          allJobs = dashboardJobs.map((job: Job) => ({
            ...job,
            ...(queueMap.has(job.id) ? queueMap.get(job.id) : {}),
          }));
        } catch (e) {
          console.warn('Failed to fetch queue jobs:', e);
          // Continue with dashboard jobs only
        }
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
  constructor(private options?: FilterOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const jobs = ctx.get('jobs') || [];
    const options = this.options || {};

    let filtered = jobs;

    // Filter by status
    if (options.status) {
      filtered = filtered.filter((j: Job) => j.status === options.status);
    }

    // Filter by priority
    if (options.priority) {
      filtered = filtered.filter((j: Job) => j.priority === options.priority);
    }

    // Filter by created_by
    if (options.created_by) {
      filtered = filtered.filter((j: Job) => j.created_by === options.created_by);
    }

    // Text search in name
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter((j: Job) =>
        j.name.toLowerCase().includes(searchLower)
      );
    }

    return ctx.insert('jobs_filtered', filtered);
  }
}

/**
 * Link 3: Sort jobs
 */
export class SortJobsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private options?: SortOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const jobs = ctx.get('jobs_filtered') || ctx.get('jobs') || [];
    const options = this.options || { field: 'created_at', direction: 'desc' };

    const sorted = [...jobs].sort((a: Job, b: Job) => {
      const aVal = (a as any)[options.field];
      const bVal = (b as any)[options.field];

      if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return options.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return ctx.insert('jobs_sorted', sorted);
  }
}

/**
 * JobsChain - Orchestrates job fetching, filtering, and sorting
 * 
 * Usage:
 *   const chain = new JobsChain({ includeQueue: true });
 *   const result = await chain.run();
 *   const jobs = result.get('jobs_sorted');
 */
export class JobsChain {
  private chain: Chain;

  constructor(options?: { includeQueue?: boolean }) {
    this.chain = new Chain();

    // Add links in order
    const fetchLink = new FetchJobsLink(options?.includeQueue ?? false);
    const filterLink = new FilterJobsLink();
    const sortLink = new SortJobsLink();

    this.chain.add_link(fetchLink, 'fetch');
    this.chain.add_link(filterLink, 'filter');
    this.chain.add_link(sortLink, 'sort');

    // Connect links (all → next)
    this.chain.connect('fetch', 'filter', () => true);
    this.chain.connect('filter', 'sort', () => true);
  }

  /**
   * Run the chain with initial context
   */
  async run(initialData?: Record<string, any>): Promise<any> {
    const ctx = new Context(initialData || {});
    const result = await this.chain.run(ctx);
    return result.to_dict();
  }
}

export default JobsChain;
