import { useState, useEffect, useCallback, useMemo } from 'react';
import { webhookApi, WebhookRule, WebhookRuleStats } from '../api/webhook';

interface WebhookStats {
  total: number;
  enabled: number;
  disabled: number;
  successRate: number;
}

export function useWebhooks(pollInterval: number = 5000) {
  const [rules, setRules] = useState<WebhookRule[]>([]);
  const [stats, setStats] = useState<WebhookRuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Compute derived stats from rules
  const computedStats = useMemo(() => {
    if (!rules.length) return { total: 0, enabled: 0, disabled: 0, successRate: 100 };
    
    const enabled = rules.filter(r => r.enabled).length;
    const disabled = rules.filter(r => !r.enabled).length;
    const totalSuccess = rules.reduce((sum, r) => sum + (r.success_count || 0), 0);
    const totalEvents = rules.reduce((sum, r) => sum + ((r.success_count || 0) + (r.failure_count || 0)), 0);
    const successRate = totalEvents > 0 ? Math.round((totalSuccess / totalEvents) * 100) : 100;

    return {
      total: rules.length,
      enabled,
      disabled,
      successRate,
    };
  }, [rules]);

  // Fetch all webhook rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await webhookApi.listRules();
      setRules(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch webhook rules');
      setError(error);
      console.error('Failed to fetch webhook rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch webhook stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await webhookApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch webhook stats:', err);
    }
  }, []);

  // Delete webhook rule
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      await webhookApi.deleteRule(ruleId);
      // Refetch rules after deletion
      await fetchRules();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete webhook rule');
      throw error;
    }
  }, [fetchRules]);

  // Toggle webhook rule enabled state
  const toggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      await webhookApi.toggleRule(ruleId, !enabled);
      // Refetch rules after toggle
      await fetchRules();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle webhook rule');
      throw error;
    }
  }, [fetchRules]);

  // Test webhook delivery
  const testRule = useCallback(async (ruleId: string) => {
    try {
      const result = await webhookApi.testWebhook(ruleId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to test webhook');
      throw error;
    }
  }, []);

  // Create new webhook rule
  const createRule = useCallback(async (data: any) => {
    try {
      const newRule = await webhookApi.createRule(data);
      setRules([...rules, newRule]);
      return newRule;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create webhook rule');
      throw error;
    }
  }, [rules]);

  // Update webhook rule
  const updateRule = useCallback(async (ruleId: string, data: any) => {
    try {
      const updated = await webhookApi.updateRule(ruleId, data);
      setRules(rules.map(r => r.id === ruleId ? updated : r));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update webhook rule');
      throw error;
    }
  }, [rules]);

  // Setup polling
  useEffect(() => {
    // Initial fetch
    fetchRules();
    fetchStats();

    if (pollInterval <= 0) return; // No polling if interval is 0 or negative

    // Setup interval
    const intervalId = setInterval(() => {
      fetchRules();
      fetchStats();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [pollInterval, fetchRules, fetchStats]);

  return {
    rules,
    stats,
    computedStats,
    loading,
    error,
    fetchRules,
    fetchStats,
    deleteRule,
    toggleRule,
    testRule,
    createRule,
    updateRule,
  };
}
