/**
 * JobsChain - CodeUChain for managing job state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/jobs.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { listJobs } from '../api/jobs';
import type { Job, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch jobs from API
 * Uses listJobs() for dashboard view (CRUD)
 */
export class FetchJobsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch from dashboard (CRUD)
      const response = await listJobs();
      const dashboardJobs = response.jobs || [];
      
      return ctx
        .insert('jobs', dashboardJobs)
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
 * Link 4: Extract final result (just the sorted jobs array)
 * Extracts jobs_sorted from context and returns it as the final output
 * This allows useChain to receive just the array instead of the whole context
 */
export class ExtractResultLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const jobsSorted = ctx.get('jobs_sorted') || [];
    // Return context with final_result set to the jobs array
    return ctx.insert('final_result', jobsSorted);
  }
}

/**
 * JobsChain - Orchestrates job fetching, filtering, and sorting
 * 
 * Usage:
 *   const chain = new JobsChain();
 *   const result = await chain.run();
 *   // result is now an array of Job[], not an object
 */
export class JobsChain {
  private chain: Chain;

  constructor(options?: { includeQueue?: boolean }) {
    this.chain = new Chain();

    // Add links in order
    const fetchLink = new FetchJobsLink();
    const filterLink = new FilterJobsLink();
    const sortLink = new SortJobsLink();
    const extractLink = new ExtractResultLink();

    // Use camelCase (addLink) per CodeUChain v1.1.2 runtime API
    this.chain.addLink(fetchLink, 'fetch');
    this.chain.addLink(filterLink, 'filter');
    this.chain.addLink(sortLink, 'sort');
    this.chain.addLink(extractLink, 'extract');

    // Connect links (all → next)
    this.chain.connect('fetch', 'filter', () => true);
    this.chain.connect('filter', 'sort', () => true);
    this.chain.connect('sort', 'extract', () => true);
  }

  /**
   * Run the chain with initial context
   * Returns just the jobs array (final_result), not the entire context
   */
  async run(initialData?: Record<string, any>): Promise<Job[]> {
    const ctx = new Context(initialData || {});
    const result = await this.chain.run(ctx);
    // Extract just the final_result (jobs array) from context
    const contextObj = result.toObject();
    const jobsArray = contextObj.final_result || [];
    return jobsArray as Job[];
  }
}

export default JobsChain;
