/**
 * useAuditLogs Hook
 * Manages audit log state, filtering, pagination, and export
 */

import { useState, useCallback, useMemo } from 'react';
import { auditApi, type AuditLog, type AuditFilters } from '../api/audit';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  /**
   * Fetch audit logs
   */
  const fetchLogs = useCallback(async (newFilters: AuditFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditApi.getLogs({
        ...filters,
        ...newFilters,
        limit: 500,
      });
      setLogs(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Refetch logs
   */
  const refetch = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Filter logs by action
   */
  const filterByAction = useCallback((action: string | undefined) => {
    setFilters((prev) => ({ ...prev, action }));
    setCurrentPage(1);
  }, []);

  /**
   * Filter logs by user
   */
  const filterByUser = useCallback((user_id: string | undefined) => {
    setFilters((prev) => ({ ...prev, user_id }));
    setCurrentPage(1);
  }, []);

  /**
   * Filter logs by resource type
   */
  const filterByResourceType = useCallback(
    (resource_type: string | undefined) => {
      setFilters((prev) => ({ ...prev, resource_type }));
      setCurrentPage(1);
    },
    []
  );

  /**
   * Filter by sensitivity level
   */
  const filterBySensitivity = useCallback((sensitivity: string | undefined) => {
    setFilters((prev) => ({ ...prev, sensitivity: sensitivity as any }));
    setCurrentPage(1);
  }, []);

  /**
   * Filter by date range
   */
  const filterByDateRange = useCallback((start_date: string, end_date: string) => {
    setFilters((prev) => ({ ...prev, start_date, end_date }));
    setCurrentPage(1);
  }, []);

  /**
   * Search logs
   */
  const search = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search_query: query }));
    setCurrentPage(1);
  }, []);

  /**
   * Get count by action type
   */
  const getCountByAction = useCallback(
    (action: string) => {
      return logs.filter((log) => log.action === action).length;
    },
    [logs]
  );

  /**
   * Get high-sensitivity changes
   */
  const getSensitiveChanges = useCallback(() => {
    return logs.filter((log) => log.sensitivity === 'high');
  }, [logs]);

  /**
   * Get paginated logs
   */
  const getPaginated = useCallback(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, currentPage]);

  /**
   * Sensitive fields to redact
   */
  const SENSITIVE_FIELDS = [
    'password',
    'api_key',
    'token',
    'secret',
    'private_key',
    'webhook_secret',
  ];

  /**
   * Check if field is sensitive
   */
  const isSensitiveField = (key: string): boolean => {
    return SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field));
  };

  /**
   * Redact sensitive values
   */
  const redactValue = (value: any): any => {
    if (typeof value === 'string' && value.length > 0) {
      return '***' + value.slice(-4);
    }
    return '***';
  };

  /**
   * Format change entry with redaction
   */
  const getFormattedChange = useCallback(
    (log: AuditLog) => {
      const formatObj = (obj: Record<string, any> | null) => {
        if (!obj) return null;
        const formatted: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          formatted[key] = isSensitiveField(key) ? redactValue(value) : value;
        }
        return formatted;
      };

      return {
        ...log,
        before: formatObj(log.before),
        after: formatObj(log.after),
        sensitive_fields: log.before
          ? Object.keys(log.before).filter(isSensitiveField)
          : [],
      };
    },
    []
  );

  /**
   * Export as CSV
   */
  const exportAsCSV = useCallback(async () => {
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Resource Type',
      'Resource ID',
      'Sensitivity',
    ];
    const rows = logs.map((log) => [
      log.timestamp,
      log.user_email || log.user_id,
      log.action,
      log.resource_type,
      log.resource_id,
      log.sensitivity,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  /**
   * Export as JSON
   */
  const exportAsJSON = useCallback(async () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  return {
    logs,
    loading,
    error,
    filters,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    fetchLogs,
    refetch,
    filterByAction,
    filterByUser,
    filterByResourceType,
    filterBySensitivity,
    filterByDateRange,
    search,
    getCountByAction,
    getSensitiveChanges,
    getPaginated,
    getFormattedChange,
    exportAsCSV,
    exportAsJSON,
  };
}
