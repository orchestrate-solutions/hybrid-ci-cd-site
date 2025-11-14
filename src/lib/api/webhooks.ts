const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface WebhookEvent {
  id: string;
  timestamp: string;
  provider: string;
  event_type: string;
  status: 'success' | 'failed' | 'pending';
  delivery_status: 'delivered' | 'failed' | 'retrying';
  retry_count: number;
  payload_hash: string;
  signature_verified?: boolean;
}

export interface EventDetails extends WebhookEvent {
  retry_history: Array<{
    retry_id: string;
    timestamp: string;
    status: string;
  }>;
}

export interface PayloadPreview {
  [key: string]: any;
}

export interface RetryResult {
  success: boolean;
  retry_id: string;
}

export interface SignatureVerification {
  valid: boolean;
  verified_at: string;
}

export interface EventFilters {
  status?: 'success' | 'failed' | 'pending';
  provider?: string;
  event_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export const webhooksApi = {
  async getEvents(filters: EventFilters = {}): Promise<WebhookEvent[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.start_date) params.append('start_date', filters.start_date.toISOString());
    if (filters.end_date) params.append('end_date', filters.end_date.toISOString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const url = `${BASE_URL}/api/webhooks/events${params.size > 0 ? '?' + params : ''}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Failed to fetch webhook events: ${res.status}`);
    const data = await res.json();
    return data.events || [];
  },

  async getEventDetails(eventId: string): Promise<EventDetails> {
    const res = await fetch(`${BASE_URL}/api/webhooks/events/${eventId}`);
    if (!res.ok) throw new Error(`Failed to fetch event details: ${res.status}`);
    return res.json();
  },

  async getPayloadPreview(eventId: string): Promise<PayloadPreview> {
    const res = await fetch(`${BASE_URL}/api/webhooks/events/${eventId}/payload`);
    if (!res.ok) throw new Error(`Failed to fetch payload: ${res.status}`);
    return res.json();
  },

  async retryEvent(eventId: string): Promise<RetryResult> {
    const res = await fetch(`${BASE_URL}/api/webhooks/events/${eventId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Failed to retry event: ${res.status}`);
    return res.json();
  },

  async searchEvents(filters: {
    provider?: string;
    event_type?: string;
    query?: string;
    [key: string]: any;
  } = {}): Promise<WebhookEvent[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    const url = `${BASE_URL}/api/webhooks/events/search${params.size > 0 ? '?' + params : ''}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Failed to search events: ${res.status}`);
    const data = await res.json();
    return data.events || [];
  },

  async getRetryHistory(eventId: string): Promise<Array<{
    retry_id: string;
    timestamp: string;
    status: string;
  }>> {
    const res = await fetch(`${BASE_URL}/api/webhooks/events/${eventId}/retries`);
    if (!res.ok) throw new Error(`Failed to fetch retry history: ${res.status}`);
    const data = await res.json();
    return data.retries || [];
  },

  async verifySignature(eventId: string): Promise<SignatureVerification> {
    const res = await fetch(`${BASE_URL}/api/webhooks/events/${eventId}/verify`);
    if (!res.ok) throw new Error(`Failed to verify signature: ${res.status}`);
    return res.json();
  },
};
