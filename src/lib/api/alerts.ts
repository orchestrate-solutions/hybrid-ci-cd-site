/**
 * Alerts API Client
 * Handles alert rule CRUD, notification channels, and history
 */

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  condition: Record<string, any>;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  channels: string[];
  quiet_hours?: { start: string; end: string };
  created_at: string;
  updated_at?: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  condition: Record<string, any>;
  severity: 'critical' | 'high' | 'medium' | 'low';
  channels: string[];
}

export interface AlertHistory {
  id: string;
  rule_id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  acknowledged: boolean;
  value?: number;
  triggered_at?: string;
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  name: string;
  config: Record<string, any>;
  verified: boolean;
  last_tested?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const alertsApi = {
  /**
   * Get all alert rules
   */
  async getRules(): Promise<AlertRule[]> {
    const res = await fetch(`${BASE_URL}/api/alerts/rules`);
    if (!res.ok) throw new Error(`Failed to fetch alert rules: ${res.status}`);
    return res.json();
  },

  /**
   * Create new alert rule
   */
  async createRule(rule: Omit<AlertRule, 'id' | 'created_at'>): Promise<AlertRule> {
    const res = await fetch(`${BASE_URL}/api/alerts/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error(`Failed to create alert rule: ${res.status}`);
    return res.json();
  },

  /**
   * Update alert rule
   */
  async updateRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    const res = await fetch(`${BASE_URL}/api/alerts/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error(`Failed to update alert rule: ${res.status}`);
    return res.json();
  },

  /**
   * Delete alert rule
   */
  async deleteRule(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/alerts/rules/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete alert rule: ${res.status}`);
  },

  /**
   * Get alert templates
   */
  async getTemplates(): Promise<AlertTemplate[]> {
    const res = await fetch(`${BASE_URL}/api/alerts/templates`);
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
    return res.json();
  },

  /**
   * Get alert history with filters
   */
  async getHistory(
    filters: { severity?: string; acknowledged?: boolean; limit?: number } = {}
  ): Promise<AlertHistory[]> {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.acknowledged !== undefined)
      params.append('acknowledged', String(filters.acknowledged));
    params.append('limit', String(filters.limit || 100));

    const res = await fetch(`${BASE_URL}/api/alerts/history?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch alert history: ${res.status}`);
    return res.json();
  },

  /**
   * Test alert notification delivery
   */
  async testAlert(ruleId: string, channelType: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/api/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: ruleId, channel: channelType }),
    });
    if (!res.ok) throw new Error(`Failed to test alert: ${res.status}`);
    return res.json();
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<AlertHistory> {
    const res = await fetch(`${BASE_URL}/api/alerts/history/${alertId}/acknowledge`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.status}`);
    return res.json();
  },

  /**
   * Get notification channels
   */
  async getChannels(): Promise<NotificationChannel[]> {
    const res = await fetch(`${BASE_URL}/api/alerts/channels`);
    if (!res.ok) throw new Error(`Failed to fetch channels: ${res.status}`);
    return res.json();
  },

  /**
   * Configure notification channel
   */
  async configureChannel(
    channel: Omit<NotificationChannel, 'id' | 'verified'>
  ): Promise<NotificationChannel> {
    const res = await fetch(`${BASE_URL}/api/alerts/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel),
    });
    if (!res.ok) throw new Error(`Failed to configure channel: ${res.status}`);
    return res.json();
  },

  /**
   * Verify notification channel
   */
  async verifyChannel(channelId: string): Promise<{ verified: boolean }> {
    const res = await fetch(`${BASE_URL}/api/alerts/channels/${channelId}/verify`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to verify channel: ${res.status}`);
    return res.json();
  },

  /**
   * Set quiet hours (snooze alerts)
   */
  async setQuietHours(startTime: string, endTime: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/alerts/quiet-hours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_time: startTime, end_time: endTime }),
    });
    if (!res.ok) throw new Error(`Failed to set quiet hours: ${res.status}`);
  },
};
