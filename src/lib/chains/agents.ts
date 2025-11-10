/**
 * AgentsChain - CodeUChain for managing agent state
 * Pattern: Fetch → Filter → Sort → Return
 */

import { Context, Chain, Link } from 'codeuchain';
import type { Agent, FilterOptions, SortOptions, ChainError } from './types';

/**
 * Mock API service - replace with actual API later
 */
const mockAgentsApi = {
  fetchAgents: async (): Promise<Agent[]> => {
    // Simulated API call
    return [
      {
        id: 'agent-1',
        name: 'Agent-USEast-001',
        status: 'ONLINE',
        pool_id: 'us-east-pool',
        last_heartbeat: new Date().toISOString(),
        capacity: 8,
      },
      {
        id: 'agent-2',
        name: 'Agent-USEast-002',
        status: 'BUSY',
        pool_id: 'us-east-pool',
        last_heartbeat: new Date().toISOString(),
        capacity: 4,
      },
      {
        id: 'agent-3',
        name: 'Agent-EUWest-001',
        status: 'ONLINE',
        pool_id: 'eu-west-pool',
        last_heartbeat: new Date(Date.now() - 30000).toISOString(),
        capacity: 16,
      },
      {
        id: 'agent-4',
        name: 'Agent-APSEast-001',
        status: 'OFFLINE',
        pool_id: 'ap-southeast-pool',
        last_heartbeat: new Date(Date.now() - 600000).toISOString(),
        capacity: 8,
      },
    ];
  },
};

/**
 * Link 1: Fetch agents from API
 */
export class FetchAgentsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(ctx: Context<Record<string, any>>): Promise<Context<Record<string, any>>> {
    try {
      const agents = await mockAgentsApi.fetchAgents();
      return ctx
        .insert('agents', agents)
        .insert('fetch_timestamp', new Date().toISOString());
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
 */
export class AgentsChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();

    // Add links in sequence
    this.chain.add_link(new FetchAgentsLink(), 'fetch');
    this.chain.add_link(new FilterAgentsLink(), 'filter');
    this.chain.add_link(new SortAgentsLink(), 'sort');

    // Connect links
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
}
