/**
 * Webhook Configuration API Client
 * Handles webhook rule creation, event filtering, and routing
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface WebhookRule {
  id: string;
  name: string;
  event_types: string[]; // e.g., "push", "pull_request", "release"
  enabled: boolean;
  conditions?: WebhookCondition[];
  routing_target: string; // URL or relay ID
  created_at: string;
  updated_at: string;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
}

export interface WebhookCondition {
  field: string; // e.g., "branch", "repository", "action"
  operator: "equals" | "contains" | "starts_with" | "matches_regex";
  value: string;
}

export interface WebhookEvent {
  id: string;
  rule_id: string;
  event_type: string;
  source: string;
  payload_hash: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  delivered_at?: string;
  error_message?: string;
  latency_ms?: number;
}

export interface CreateWebhookRuleRequest {
  name: string;
  event_types: string[];
  conditions?: WebhookCondition[];
  routing_target: string;
  enabled?: boolean;
}

export interface WebhookRuleStats {
  total_rules: number;
  enabled_rules: number;
  disabled_rules: number;
  events_delivered_today: number;
  success_rate: number;
  avg_latency_ms: number;
}

export const webhookApi = {
  /**
   * List all webhook rules
   */
  async listRules(): Promise<WebhookRule[]> {
    const res = await fetch(`${BASE_URL}/api/webhooks/rules`);
    if (!res.ok) throw new Error(`Failed to list webhook rules: ${res.status}`);
    const data = await res.json();
    return (data.rules || []) as WebhookRule[];
  },

  /**
   * Get webhook rule by ID
   */
  async getRule(ruleId: string): Promise<WebhookRule> {
    const res = await fetch(`${BASE_URL}/api/webhooks/rules/${ruleId}`);
    if (!res.ok) throw new Error(`Failed to get webhook rule: ${res.status}`);
    return res.json();
  },

  /**
   * Create webhook rule
   */
  async createRule(request: CreateWebhookRuleRequest): Promise<WebhookRule> {
    const res = await fetch(`${BASE_URL}/api/webhooks/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to create webhook rule: ${res.status}`);
    return res.json();
  },

  /**
   * Update webhook rule
   */
  async updateRule(
    ruleId: string,
    request: Partial<CreateWebhookRuleRequest>
  ): Promise<WebhookRule> {
    const res = await fetch(`${BASE_URL}/api/webhooks/rules/${ruleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to update webhook rule: ${res.status}`);
    return res.json();
  },

  /**
   * Delete webhook rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/webhooks/rules/${ruleId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete webhook rule: ${res.status}`);
  },

  /**
   * Enable/disable webhook rule
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<WebhookRule> {
    const res = await fetch(
      `${BASE_URL}/api/webhooks/rules/${ruleId}/toggle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      }
    );
    if (!res.ok) throw new Error(`Failed to toggle webhook rule: ${res.status}`);
    return res.json();
  },

  /**
   * Get webhook events for a rule
   */
  async getRuleEvents(
    ruleId: string,
    limit = 50
  ): Promise<WebhookEvent[]> {
    const res = await fetch(
      `${BASE_URL}/api/webhooks/rules/${ruleId}/events?limit=${limit}`
    );
    if (!res.ok) throw new Error(`Failed to get webhook events: ${res.status}`);
    const data = await res.json();
    return (data.events || []) as WebhookEvent[];
  },

  /**
   * Get webhook statistics
   */
  async getStats(): Promise<WebhookRuleStats> {
    const res = await fetch(`${BASE_URL}/api/webhooks/stats`);
    if (!res.ok) throw new Error(`Failed to fetch webhook stats: ${res.status}`);
    return res.json();
  },

  /**
   * Test webhook delivery
   */
  async testWebhook(ruleId: string): Promise<{
    success: boolean;
    message: string;
    latency_ms: number;
  }> {
    const res = await fetch(
      `${BASE_URL}/api/webhooks/rules/${ruleId}/test`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(`Failed to test webhook: ${res.status}`);
    return res.json();
  },

  /**
   * Get available event types
   */
  async getEventTypes(): Promise<{
    sources: string[];
    event_types: Record<string, string[]>;
  }> {
    const res = await fetch(`${BASE_URL}/api/webhooks/event-types`);
    if (!res.ok) throw new Error(`Failed to get event types: ${res.status}`);
    return res.json();
  },

  /**
   * Get webhook rule event history
   */
  async getEventHistory(
    ruleId: string,
    status?: "SUCCESS" | "FAILED" | "PENDING",
    limit = 100
  ): Promise<WebhookEvent[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", limit.toString());
    
    const res = await fetch(
      `${BASE_URL}/api/webhooks/rules/${ruleId}/history?${params}`
    );
    if (!res.ok) throw new Error(`Failed to get event history: ${res.status}`);
    const data = await res.json();
    return (data.events || []) as WebhookEvent[];
  },
};
