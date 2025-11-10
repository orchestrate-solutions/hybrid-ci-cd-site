/**
 * Agent Types
 * 
 * Type definitions for CI/CD agents in the platform.
 */

export type AgentStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'OFFLINE' | 'ERROR';
export type AgentPoolStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';

export interface Agent {
  id: string;
  name: string;
  pool_id: string;
  status: AgentStatus;
  version: string;
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  current_job_id: string | null;
  last_heartbeat: string; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
}

export interface AgentPool {
  id: string;
  name: string;
  status: AgentPoolStatus;
  agent_count: number;
  idle_count: number;
  running_count: number;
  created_at: string;
  updated_at: string;
}

export interface AgentHeartbeat {
  agent_id: string;
  timestamp: string;
  cpu_usage: number; // percentage
  memory_usage: number; // percentage
  disk_usage: number; // percentage
  job_count: number;
}

export interface AgentMetrics {
  total_agents: number;
  idle_agents: number;
  running_agents: number;
  offline_agents: number;
  error_agents: number;
  total_pools: number;
  active_pools: number;
  avg_cpu_usage: number;
  avg_memory_usage: number;
  avg_disk_usage: number;
}

// API Response Types
export interface ListAgentsResponse {
  agents: Agent[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListAgentPoolsResponse {
  pools: AgentPool[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetAgentResponse {
  agent: Agent;
  pool: AgentPool;
  current_job: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export interface UpdateAgentRequest {
  name?: string;
  status?: AgentStatus;
}

export interface CreateAgentPoolRequest {
  name: string;
}

export interface UpdateAgentPoolRequest {
  name?: string;
  status?: AgentPoolStatus;
}

// Query Parameters
export interface ListAgentsParams {
  limit?: number;
  offset?: number;
  pool_id?: string;
  status?: AgentStatus;
  sort_by?: 'name' | 'status' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ListAgentPoolsParams {
  limit?: number;
  offset?: number;
  status?: AgentPoolStatus;
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}
