/**
 * Agents API Client
 * 
 * Typed fetch wrappers for agent endpoints.
 */

import type {
  Agent,
  AgentPool,
  AgentMetrics,
  ListAgentsResponse,
  ListAgentPoolsResponse,
  GetAgentResponse,
  UpdateAgentRequest,
  CreateAgentPoolRequest,
  UpdateAgentPoolRequest,
  ListAgentsParams,
  ListAgentPoolsParams,
} from '@/lib/types/agents';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function listAgents(params?: ListAgentsParams): Promise<ListAgentsResponse> {
  const url = new URL(`${BASE_URL}/api/dashboard/agents`);
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());
  if (params?.offset) url.searchParams.set('offset', params.offset.toString());
  if (params?.pool_id) url.searchParams.set('pool_id', params.pool_id);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.sort_by) url.searchParams.set('sort_by', params.sort_by);
  if (params?.sort_order) url.searchParams.set('sort_order', params.sort_order);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  return res.json();
}

export async function getAgent(agentId: string): Promise<GetAgentResponse> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agents/${agentId}`);
  if (!res.ok) throw new Error(`Agent not found: ${agentId}`);
  return res.json();
}

export async function updateAgent(agentId: string, data: UpdateAgentRequest): Promise<Agent> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agents/${agentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update agent: ${res.status}`);
  return res.json();
}

export async function listAgentPools(params?: ListAgentPoolsParams): Promise<ListAgentPoolsResponse> {
  const url = new URL(`${BASE_URL}/api/dashboard/agent-pools`);
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());
  if (params?.offset) url.searchParams.set('offset', params.offset.toString());
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.sort_by) url.searchParams.set('sort_by', params.sort_by);
  if (params?.sort_order) url.searchParams.set('sort_order', params.sort_order);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to list agent pools: ${res.status}`);
  return res.json();
}

export async function createAgentPool(data: CreateAgentPoolRequest): Promise<AgentPool> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agent-pools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create agent pool: ${res.status}`);
  return res.json();
}

export async function updateAgentPool(poolId: string, data: UpdateAgentPoolRequest): Promise<AgentPool> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agent-pools/${poolId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update agent pool: ${res.status}`);
  return res.json();
}

export async function getAgentMetrics(): Promise<AgentMetrics> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agents/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch agent metrics: ${res.status}`);
  return res.json();
}

export async function pauseAgent(agentId: string): Promise<Agent> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agents/${agentId}/pause`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to pause agent: ${res.status}`);
  return res.json();
}

export async function resumeAgent(agentId: string): Promise<Agent> {
  const res = await fetch(`${BASE_URL}/api/dashboard/agents/${agentId}/resume`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to resume agent: ${res.status}`);
  return res.json();
}
