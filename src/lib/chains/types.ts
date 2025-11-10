/**
 * Frontend Chain Types
 * Shared types for CodeUChain-based state management
 */

export interface Job {
  id: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Deployment {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  version: string;
  created_at: string;
  updated_at: string;
  region?: string;
}

export interface Agent {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'IDLE' | 'BUSY';
  pool_id: string;
  last_heartbeat: string;
  capacity?: number;
}

export interface Webhook {
  id: string;
  event_type: string;
  payload: Record<string, any>;
  timestamp: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface FilterOptions {
  status?: string;
  priority?: string;
  region?: string;
  search?: string;
}

export interface SortOptions {
  field: 'name' | 'status' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ChainError extends Error {
  code: string;
  details?: Record<string, any>;
}
