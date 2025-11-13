/**
 * AgentsChain - CodeUChain for managing agent state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/agents.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { agentsApi } from '../api/agents';
import type { Agent, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch agents from API
 * Uses agentsApi.listAgents() and agentsApi.getPoolHealth()
 */
export class FetchAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includePoolHealth: boolean = true) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch agents from /api/agents
      const agents = await agentsApi.listAgents();
      
      let result = ctx.insert('agents', agents || [])
        .insert('fetch_timestamp', new Date().toISOString());
      
      // Optionally include pool health
      if (this.includePoolHealth) {
        try {
          const poolHealth = await agentsApi.getPoolHealth();
          result = result.insert('pool_health', poolHealth);
        } catch (e) {
          console.warn('Failed to fetch pool health:', e);
          result = result.insert('pool_health', null);
        }
      }
      
      return result;
    } catch (error) {
      const err = error as ChainError;
      throw new Error(`Failed to fetch agents: ${err.message}`);
    }
  }
}

/**
 * Link 2: Filter agents based on criteria
 */
export class FilterAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const agents = ctx.get('agents') || [];
    const filters = ctx.get('filters') as FilterOptions | undefined;

    if (!filters) {
      return ctx.insert('filtered_agents', agents);
    }

    let filtered = [...agents];

    // Filter by status
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((a: Agent) => a.status === filters.status);
    }

    // Search by name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((a: Agent) =>
        a.name.toLowerCase().includes(searchLower)
      );
    }

    return ctx.insert('filtered_agents', filtered).insert('filter_applied', true);
  }
}

/**
 * Link 3: Sort agents
 */
export class SortAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const agents = ctx.get('filtered_agents') || [];
    const sort = ctx.get('sort') as SortOptions | undefined;

    if (!sort) {
      // Default: sort by name ascending
      const sorted = [...agents].sort((a: Agent, b: Agent) => {
        return a.name.localeCompare(b.name);
      });
      return ctx.insert('sorted_agents', sorted);
    }

    const sorted = [...agents].sort((a: Agent, b: Agent) => {
      let aVal: any = a[sort.field as keyof Agent];
      let bVal: any = b[sort.field as keyof Agent];

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

    return ctx.insert('sorted_agents', sorted);
  }
}

/**
 * AgentsChain - Orchestrates all agent-related operations
 * 
 * ARCHITECTURE:
 * - FetchAgentsLink: Calls agentsApi.listAgents() for /api/agents
 * - Optional: Fetches agentsApi.getPoolHealth() for pool metrics
 * - FilterAgentsLink: Filters by status, search term
 * - SortAgentsLink: Sorts by field + direction (default: name asc)
 * 
 * USAGE:
 * ```typescript
 * const chain = new AgentsChain(includePoolHealth: true);
 * const agents = await chain.execute(
 *   { status: 'ONLINE' },
 *   { field: 'name', direction: 'asc' }
 * );
 * const poolHealth = await chain.getPoolHealth();
 * ```
 */
export class AgentsChain {
  private chain: Chain;

  constructor(private includePoolHealth: boolean = true) {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.add_link(new FetchAgentsLink(includePoolHealth), 'fetch');
    this.chain.add_link(new FilterAgentsLink(), 'filter');
    this.chain.add_link(new SortAgentsLink(), 'sort');

    // Connect links with predicates
    this.chain.connect('fetch', 'filter', () => true);
    this.chain.connect('filter', 'sort', () => true);
  }

  /**
   * Execute chain with optional filters and sort
   */
  async execute(filters?: FilterOptions, sort?: SortOptions): Promise<Agent[]> {
    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'name', direction: 'asc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('sorted_agents') || [];
  }

  /**
   * Get pool health if included in chain
   */
  async getPoolHealth(filters?: FilterOptions, sort?: SortOptions): Promise<Record<string, any>> {
    if (!this.includePoolHealth) {
      throw new Error('Pool health not available; initialize chain with includePoolHealth: true');
    }

    const ctx = new Context({
      filters: filters || {},
      sort: sort || { field: 'name', direction: 'asc' },
    });

    const result = await this.chain.run(ctx);
    return result.get('pool_health') || {};
  }
}
