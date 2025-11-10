/**
 * DeploymentsChain - CodeUChain for managing deployment state
 * Pattern: Fetch → Filter → Sort → Return
 */

import { Context, Chain, Link } from 'codeuchain';
import type { Deployment, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Mock API service - replace with actual API later
 */
const mockDeploymentsApi = {
  fetchDeployments: async (): Promise<Deployment[]> => {
    // Simulated API call
    return [
      {
        id: 'deploy-1',
        name: 'Frontend v2.0 - US-East',
        status: 'COMPLETED',
        version: '2.0.0',
        region: 'us-east-1',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'deploy-2',
        name: 'Backend v1.9.5 - EU-West',
        status: 'IN_PROGRESS',
        version: '1.9.5',
        region: 'eu-west-1',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'deploy-3',
        name: 'Database Migration - APAC',
        status: 'PENDING',
        version: '1.0',
        region: 'ap-southeast-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'deploy-4',
        name: 'API Gateway v3.1 - US-West',
        status: 'FAILED',
        version: '3.1.0',
        region: 'us-west-2',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  },
};

/**
 * Link 1: Fetch deployments from API
 */
export class FetchDeploymentsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      const deployments = await mockDeploymentsApi.fetchDeployments();
      return ctx
        .insert('deployments', deployments)
        .insert('fetch_timestamp', new Date().toISOString());
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

    // Filter by region
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
 */
export class DeploymentsChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.add_link(new FetchDeploymentsLink(), 'fetch');
    this.chain.add_link(new FilterDeploymentsLink(), 'filter');
    this.chain.add_link(new SortDeploymentsLink(), 'sort');

    // Connect links
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
}
