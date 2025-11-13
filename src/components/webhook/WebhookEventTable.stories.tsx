import type { Meta, StoryObj } from '@storybook/react';
import { WebhookEventTable } from './WebhookEventTable';

const meta = {
  component: WebhookEventTable,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof WebhookEventTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEvents = [
  {
    id: '1',
    rule_id: 'rule-1',
    event_type: 'job.completed',
    source: 'job-service',
    payload_hash: 'sha256:abcd1234',
    status: 'SUCCESS' as const,
    delivered_at: new Date(Date.now() - 5 * 60000).toISOString(),
    error_message: null,
    latency_ms: 245,
  },
  {
    id: '2',
    rule_id: 'rule-1',
    event_type: 'job.failed',
    source: 'job-service',
    payload_hash: 'sha256:efgh5678',
    status: 'FAILED' as const,
    delivered_at: new Date(Date.now() - 10 * 60000).toISOString(),
    error_message: 'Connection timeout',
    latency_ms: 5000,
  },
  {
    id: '3',
    rule_id: 'rule-1',
    event_type: 'deployment.started',
    source: 'deployment-service',
    payload_hash: 'sha256:ijkl9012',
    status: 'PENDING' as const,
    delivered_at: null,
    error_message: null,
    latency_ms: null,
  },
];

export const WithEvents: Story = {
  args: {
    events: mockEvents,
    loading: false,
  },
};

export const Empty: Story = {
  args: {
    events: [],
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    events: mockEvents,
    loading: true,
  },
};

export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 50 }, (_, i) => ({
      id: `event-${i}`,
      rule_id: 'rule-1',
      event_type: i % 3 === 0 ? 'job.completed' : i % 3 === 1 ? 'job.failed' : 'deployment.started',
      source: 'service-' + (i % 3),
      payload_hash: `sha256:${i.toString().padStart(8, '0')}`,
      status: (i % 3 === 0 ? 'SUCCESS' : i % 3 === 1 ? 'FAILED' : 'PENDING') as any,
      delivered_at: new Date(Date.now() - i * 60000).toISOString(),
      error_message: i % 5 === 0 ? 'Connection error' : null,
      latency_ms: i % 5 === 0 ? null : Math.random() * 5000,
    })),
    loading: false,
  },
};

export const ErrorFilter: Story = {
  args: {
    events: mockEvents.filter(e => e.status === 'FAILED'),
    loading: false,
  },
};
