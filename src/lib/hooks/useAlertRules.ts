/**
 * useAlertRules Hook
 * Manages alert rules state, CRUD operations, and history
 */

import { useState, useCallback } from 'react';
import { alertsApi, type AlertRule, type AlertTemplate, type AlertHistory } from '../api/alerts';

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all alert rules
   */
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertsApi.getRules();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch alert templates
   */
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await alertsApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
    }
  }, []);

  /**
   * Fetch alert history
   */
  const fetchHistory = useCallback(async (filters = {}) => {
    try {
      const data = await alertsApi.getHistory(filters);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch history'));
    }
  }, []);

  /**
   * Create new alert rule
   */
  const createRule = useCallback(
    async (rule: Omit<AlertRule, 'id' | 'created_at'>) => {
      try {
        setError(null);
        const newRule = await alertsApi.createRule(rule);
        setRules((prev) => [...prev, newRule]);
        return newRule;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create rule');
        setError(error);
        throw error;
      }
    },
    []
  );

  /**
   * Update alert rule
   */
  const updateRule = useCallback(async (id: string, updates: Partial<AlertRule>) => {
    try {
      setError(null);
      const updated = await alertsApi.updateRule(id, updates);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update rule');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Delete alert rule
   */
  const deleteRule = useCallback(async (id: string) => {
    try {
      setError(null);
      await alertsApi.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete rule');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Toggle rule enabled/disabled
   */
  const toggleRule = useCallback(
    async (id: string) => {
      const rule = rules.find((r) => r.id === id);
      if (!rule) return;
      await updateRule(id, { enabled: !rule.enabled });
    },
    [rules, updateRule]
  );

  /**
   * Filter rules by severity
   */
  const filterBySeverity = useCallback(
    (severity: string) => {
      return rules.filter((r) => r.severity === severity);
    },
    [rules]
  );

  /**
   * Get active rules count
   */
  const getActiveCount = useCallback(() => {
    return rules.filter((r) => r.enabled).length;
  }, [rules]);

  /**
   * Get critical rules count
   */
  const getCriticalCount = useCallback(() => {
    return rules.filter((r) => r.severity === 'critical' && r.enabled).length;
  }, [rules]);

  /**
   * Test alert delivery
   */
  const testAlert = useCallback(
    async (ruleId: string, channelType: string) => {
      try {
        setError(null);
        const result = await alertsApi.testAlert(ruleId, channelType);
        return result.success;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to test alert');
        setError(error);
        throw error;
      }
    },
    []
  );

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      setError(null);
      const updated = await alertsApi.acknowledgeAlert(alertId);
      setHistory((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to acknowledge alert');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Set quiet hours
   */
  const setQuietHours = useCallback(async (startTime: string, endTime: string) => {
    try {
      setError(null);
      await alertsApi.setQuietHours(startTime, endTime);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set quiet hours');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Get alert statistics
   */
  const getStats = useCallback(() => {
    const critical = getCriticalCount();
    const high = rules.filter((r) => r.severity === 'high' && r.enabled).length;
    const active = getActiveCount();

    return {
      total_rules: rules.length,
      active_rules: active,
      critical_rules: critical,
      high_rules: high,
      total_alerts: history.length,
      unacknowledged: history.filter((a) => !a.acknowledged).length,
    };
  }, [rules, history, getActiveCount, getCriticalCount]);

  return {
    rules,
    history,
    templates,
    loading,
    error,
    fetchRules,
    fetchTemplates,
    fetchHistory,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    filterBySeverity,
    getActiveCount,
    getCriticalCount,
    testAlert,
    acknowledgeAlert,
    setQuietHours,
    getStats,
  };
}
