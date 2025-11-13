/**
 * DeploymentsChain - CodeUChain for managing deployment state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/deployments.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { listDeployments, getServiceHistory } from '../api/deployments';
import type { Deployment, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch deployments from API
 * Uses listDeployments() and optional service history
 */
export class FetchDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includeHistory: boolean = false, private serviceId?: string) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch deployments from /api/deployments
      const response = await listDeployments();
      const deployments = response.deployments || [];
      
      let result = ctx
        .insert('deployments', deployments)
        .insert('fetch_timestamp', new Date().toISOString());
      
      // Optionally include service history
      if (this.includeHistory && this.serviceId) {
        try {
          const history = await getServiceHistory(this.serviceId);
          result = result.insert('service_history', history);
        } catch (e) {
          console.warn('Failed to fetch service history:', e);
          result = result.insert('service_history', []);
        }
      }
      
      return result;
    } catch (error) {
      const err = error as ChainError;
      throw new Error(`Failed to fetch deployments: ${err.message}`);
    }
  }
}

/**
 * Link 2: Filter deployments based on criteria
 */
export class FilterDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private options?: FilterOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const deployments = ctx.get('deployments') || [];
    const options = this.options || {};

    let filtered = deployments;

    // Filter by status
    if (options.status) {
      filtered = filtered.filter((d: Deployment) => d.status === options.status);
    }

    // Filter by environment
    if (options.environment) {
      filtered = filtered.filter((d: Deployment) => d.environment === options.environment);
    }

    // Filter by service
    if (options.service_id) {
      filtered = filtered.filter((d: Deployment) => d.service_id === options.service_id);
    }

    return ctx.insert('deployments_filtered', filtered);
  }
}

/**
 * Link 3: Sort deployments
 */
export class SortDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private options?: SortOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const deployments = ctx.get('deployments_filtered') || ctx.get('deployments') || [];
    const options = this.options || { field: 'deployed_at', direction: 'desc' };

    const sorted = [...deployments].sort((a: Deployment, b: Deployment) => {
      const aVal = (a as any)[options.field];
      const bVal = (b as any)[options.field];

      if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return options.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return ctx.insert('deployments_sorted', sorted);
  }
}

/**
 * DeploymentsChain - Orchestrates deployment fetching, filtering, and sorting
 * 
 * Usage:
 *   const chain = new DeploymentsChain({ includeHistory: true });
 *   const result = await chain.run();
 *   const deployments = result.get('deployments_sorted');
 */
export class DeploymentsChain {
  private chain: Chain;

  constructor(options?: { includeHistory?: boolean; serviceId?: string }) {
    this.chain = new Chain();

    // Add links in order
    const fetchLink = new FetchDeploymentsLink(options?.includeHistory, options?.serviceId);
    const filterLink = new FilterDeploymentsLink();
    const sortLink = new SortDeploymentsLink();

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

export default DeploymentsChain;
