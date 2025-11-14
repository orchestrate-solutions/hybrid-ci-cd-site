/**
 * AgentsChain - CodeUChain for managing agent state
 * Pattern: Fetch → Filter → Sort → Return
 * 
 * Uses real API clients (src/lib/api/agents.ts) instead of mocks
 */

import { Context, Chain, Link } from 'codeuchain';
import { listAgents, getPoolHealth } from '../api/agents';
import type { Agent, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Link 1: Fetch agents from API
 * Uses listAgents() and getPoolHealth()
 */
export class FetchAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private includePoolHealth: boolean = true) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch agents from /api/agents
      const response = await listAgents();
      const agents = response.agents || [];
      
      let result = ctx.insert('agents', agents)
        .insert('fetch_timestamp', new Date().toISOString());
      
      // Optionally include pool health
      if (this.includePoolHealth) {
        try {
          const health = await getPoolHealth();
          result = result.insert('pool_health', health);
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
  constructor(private options?: FilterOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const agents = ctx.get('agents') || [];
    const options = this.options || {};

    let filtered = agents;

    // Filter by status
    if (options.status) {
      filtered = filtered.filter((a: Agent) => a.status === options.status);
    }

    // Filter by pool_id
    if (options.pool_id) {
      filtered = filtered.filter((a: Agent) => a.pool_id === options.pool_id);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((a: Agent) =>
        options.tags!.some((tag: string) => a.tags?.includes(tag))
      );
    }

    return ctx.insert('agents_filtered', filtered);
  }
}

/**
 * Link 3: Sort agents
 */
export class SortAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private options?: SortOptions) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const agents = ctx.get('agents_filtered') || ctx.get('agents') || [];
    const options = this.options || { field: 'created_at', direction: 'desc' };

    const sorted = [...agents].sort((a: Agent, b: Agent) => {
      const aVal = (a as any)[options.field];
      const bVal = (b as any)[options.field];

      if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return options.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return ctx.insert('agents_sorted', sorted);
  }
}

/**
 * AgentsChain - Orchestrates agent fetching, filtering, and sorting
 * 
 * Usage:
 *   const chain = new AgentsChain({ includePoolHealth: true });
 *   const result = await chain.run();
 *   const agents = result.get('agents_sorted');
 */
export class AgentsChain {
  private chain: Chain;

  constructor(options?: { includePoolHealth?: boolean }) {
    this.chain = new Chain();

    // Add links in order
    const fetchLink = new FetchAgentsLink(options?.includePoolHealth ?? true);
    const filterLink = new FilterAgentsLink();
    const sortLink = new SortAgentsLink();

    // Use camelCase (addLink) per CodeUChain v1.1.2 runtime API
    this.chain.addLink(fetchLink, 'fetch');
    this.chain.addLink(filterLink, 'filter');
    this.chain.addLink(sortLink, 'sort');

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
    // Use toObject() per CodeUChain v1.1.2 context API
    return result.toObject();
  }
}

export default AgentsChain;
