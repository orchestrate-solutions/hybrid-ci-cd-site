/**
 * Audit Trail API Client
 * Handles all audit log queries, filtering, and export operations
 */

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email?: string;
  action: 'create' | 'read' | 'update' | 'delete';
  resource_type: string;
  resource_id: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface AuditStats {
  total_changes: number;
  create_count: number;
  update_count: number;
  delete_count: number;
  high_sensitivity_count: number;
}

export interface AuditFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  search_query?: string;
  sensitivity?: 'low' | 'medium' | 'high';
  limit?: number;
  offset?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const auditApi = {
  /**
   * Fetch audit logs with optional filters
   */
  async getLogs(filters: AuditFilters = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams();

    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search_query) params.append('search_query', filters.search_query);
    if (filters.sensitivity) params.append('sensitivity', filters.sensitivity);
    params.append('limit', String(filters.limit || 100));
    params.append('offset', String(filters.offset || 0));

    const res = await fetch(`${BASE_URL}/api/audit/logs?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.status}`);
    return res.json();
  },

  /**
   * Get detailed information about a specific audit log entry
   */
  async getLogDetails(logId: string): Promise<AuditLog> {
    const res = await fetch(`${BASE_URL}/api/audit/logs/${logId}`);
    if (!res.ok) throw new Error(`Failed to fetch log details: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch audit logs filtered by resource
   */
  async getLogsByResource(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    const res = await fetch(
      `${BASE_URL}/api/audit/resources/${resourceType}/${resourceId}/logs`
    );
    if (!res.ok) throw new Error(`Failed to fetch resource logs: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch audit logs filtered by user
   */
  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    const res = await fetch(`${BASE_URL}/api/audit/users/${userId}/logs`);
    if (!res.ok) throw new Error(`Failed to fetch user logs: ${res.status}`);
    return res.json();
  },

  /**
   * Search audit logs by query
   */
  async searchLogs(query: string, limit = 100): Promise<AuditLog[]> {
    const params = new URLSearchParams({
      search_query: query,
      limit: String(limit),
    });
    const res = await fetch(`${BASE_URL}/api/audit/search?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to search logs: ${res.status}`);
    return res.json();
  },

  /**
   * Get high-sensitivity audit logs
   */
  async getSensitiveChanges(limit = 100): Promise<AuditLog[]> {
    const res = await fetch(
      `${BASE_URL}/api/audit/logs?sensitivity=high&limit=${limit}`
    );
    if (!res.ok) throw new Error(`Failed to fetch sensitive changes: ${res.status}`);
    return res.json();
  },

  /**
   * Get audit statistics
   */
  async getStats(): Promise<AuditStats> {
    const res = await fetch(`${BASE_URL}/api/audit/stats`);
    if (!res.ok) throw new Error(`Failed to fetch audit stats: ${res.status}`);
    return res.json();
  },
};
