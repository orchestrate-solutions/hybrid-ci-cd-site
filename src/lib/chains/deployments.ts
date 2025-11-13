/**
 * DeploymentsChain - CodeUChain for managing deployment state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/deployments.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { deploymentsApi } from '../api/deployments';
import type { Deployment, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch deployments from API
 * Uses deploymentsApi.listDeployments() and optional service history
 */
export class FetchDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includeHistory: boolean = false, private serviceId?: string) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch deployments from /api/deployments
      const deployments = await deploymentsApi.listDeployments();
      
      let result = ctx
        .insert('deployments', deployments || [])
        .insert('fetch_timestamp', new Date().toISOString());
      
      // Optionally include service history
      if (this.includeHistory && this.serviceId) {
        try {
          const history = await deploymentsApi.getServiceHistory(this.serviceId);
          result = result.insert('service_history', history);
        } catch (e) {
          console.warn(`Failed to fetch history for service ${this.serviceId}:`, e);
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
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const deployments = ctx.get('deployments') || [];
    const filters = ctx.get('filters') as FilterOptions | undefined;

    if (!filters) {
      return ctx.insert('filtered_deployments', deployments);
    }

    let filtered = [...deployments];

    // Filter by status
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((d: Deployment) => d.status === filters.status);
    }

    // Filter by region/environment
    if (filters.region && filters.region !== 'ALL') {
      filtered = filtered.filter((d: Deployment) => d.region === filters.region);
    }

    // Search by name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((d: Deployment) =>
        d.name.toLowerCase().includes(searchLower)
      );
    }

    return ctx.insert('filtered_deployments', filtered).insert('filter_applied', true);
  }
}

/**
 * Link 3: Sort deployments
 */
export class SortDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const deployments = ctx.get('filtered_deployments') || [];
    const sort = ctx.get('sort') as SortOptions | undefined;

    if (!sort) {
      // Default: sort by created_at descending
      const sorted = [...deployments].sort((a: Deployment, b: Deployment) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return ctx.insert('sorted_deployments', sorted);
    }

    const sorted = [...deployments].sort((a: Deployment, b: Deployment) => {
      let aVal: any = a[sort.field as keyof Deployment];
      let bVal: any = b[sort.field as keyof Deployment];

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

    return ctx.insert('sorted_deployments', sorted);
  }
}

/**
 * DeploymentsChain - Orchestrates all deployment-related operations
 * 
 * ARCHITECTURE:
 * - FetchDeploymentsLink: Calls deploymentsApi.listDeployments() for /api/deployments
 * - Optional: Fetches deploymentsApi.getServiceHistory(serviceId) for timeline view
 * - FilterDeploymentsLink: Filters by status, region/environment, search term
 * - SortDeploymentsLink: Sorts by field + direction (default: created_at desc)
 * 
 * USAGE:
 * ```typescript
 * const chain = new DeploymentsChain(includeHistory: true, serviceId: 'my-service');
 * const deployments = await chain.execute(
 *   { status: 'COMPLETED', region: 'us-east-1' },
 *   { field: 'created_at', direction: 'desc' }
 * );
 * const history = await chain.getServiceHistory();
 * ```
 */
export class DeploymentsChain {
  private chain: Chain;

  constructor(private includeHistory: boolean = false, private serviceId?: string) {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.add_link(new FetchDeploymentsLink(includeHistory, serviceId), 'fetch');
    this.chain.add_link(new FilterDeploymentsLink(), 'filter');
    this.chain.add_link(new SortDeploymentsLink(), 'sort');

    // Connect links with predicates
    this.chain.connect('fetch', 'filter', () => true);
    this.chain.connect('filter', 'sort', () => true);
  }

  /**
   * Execute chain with optional filters and sort
   */
  async execute(filters?: FilterOptions, sort?: SortOptions): Promise<Deployment[]> {
    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'created_at', direction: 'desc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('sorted_deployments') || [];
  }

  /**
   * Get service history if included in chain
   */
  async getServiceHistory(filters?: FilterOptions, sort?: SortOptions): Promise<Record<string, any>[]> {
    if (!this.includeHistory) {
      throw new Error('Service history not available; initialize chain with includeHistory: true');
    }

    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'created_at', direction: 'desc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('service_history') || [];
  }
}
