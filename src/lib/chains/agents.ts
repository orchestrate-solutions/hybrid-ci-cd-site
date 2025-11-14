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
 * Uses listAgents() and optional getPoolHealth() for specific pool
 */
export class FetchAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  constructor(private poolId?: string) {
    super();
  }

  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      // Fetch agents from /api/agents
      const response = await listAgents();
      const agents = response.agents || [];
      
      let result = ctx.insert('agents', agents)
        .insert('fetch_timestamp', new Date().toISOString());
      
      // Optionally include pool health for specific pool
      if (this.poolId) {
        try {
          const health = await getPoolHealth(this.poolId);
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

    // Filter by search term (in name or pool)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter((a: Agent) =>
        (a.name?.toLowerCase().includes(searchLower)) ||
        ((a as any).pool?.toLowerCase().includes(searchLower))
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
 * Link 4: Extract final result (just the sorted agents array)
 * Extracts agents_sorted from context and returns it as the final output
 */
export class ExtractResultLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    const agentsSorted = ctx.get('agents_sorted') || [];
    return ctx.insert('final_result', agentsSorted);
  }
}

/**
 * AgentsChain - Orchestrates agent fetching, filtering, and sorting
 * 
 * Usage:
 *   const chain = new AgentsChain();
 *   const result = await chain.run();
 *   // result is now an array of Agent[], not an object
 */
export class AgentsChain {
  private chain: Chain;

  constructor(options?: { poolId?: string }) {
    this.chain = new Chain();

    // Add links in order
    const fetchLink = new FetchAgentsLink(options?.poolId);
    const filterLink = new FilterAgentsLink();
    const sortLink = new SortAgentsLink();
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
   * Returns just the agents array (final_result), not the entire context
   */
  async run(initialData?: Record<string, any>): Promise<Agent[]> {
    const ctx = new Context(initialData || {});
    const result = await this.chain.run(ctx);
    // Extract just the final_result (agents array) from context
    const contextObj = result.toObject();
    const agentsArray = contextObj.final_result || [];
    return agentsArray as Agent[];
  }
}

export default AgentsChain;
