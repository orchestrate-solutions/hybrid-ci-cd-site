import type { Meta, StoryObj } from '@storybook/react';
import WebhookEventTable from './WebhookEventTable';

const meta = {
  component: WebhookEventTable,
  tags: ['autodocs'],
  argTypes: {
    events: { control: 'object' },
    onSelectEvent: { action: 'selected' },
    loading: { control: 'boolean' },
    itemsPerPage: { control: 'number' },
  },
} satisfies Meta<typeof WebhookEventTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEvents = [
  {
    id: 'evt_1',
    timestamp: '2025-11-14T10:00:00Z',
    provider: 'github',
    event_type: 'push',
    status: 'success',
    delivery_status: 'delivered' as const,
    retry_count: 0,
    payload_hash: 'sha256_abc123',
  },
  {
    id: 'evt_2',
    timestamp: '2025-11-14T09:30:00Z',
    provider: 'gitlab',
    event_type: 'merge_request',
    status: 'success',
    delivery_status: 'delivered' as const,
    retry_count: 1,
    payload_hash: 'sha256_def456',
  },
  {
    id: 'evt_3',
    timestamp: '2025-11-14T09:00:00Z',
    provider: 'github',
    event_type: 'pull_request',
    status: 'failed',
    delivery_status: 'failed' as const,
    retry_count: 3,
    payload_hash: 'sha256_ghi789',
  },
];

export const Default: Story = {
  args: {
    events: mockEvents,
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: false,
  },
};

export const SuccessfulDeliveries: Story = {
  args: {
    events: mockEvents.filter((e) => e.delivery_status === 'delivered'),
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: false,
  },
};

export const FailedDeliveries: Story = {
  args: {
    events: mockEvents.filter((e) => e.delivery_status === 'failed'),
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    events: [],
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    events: [],
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: false,
  },
};

export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 100 }, (_, i) => ({
      id: `evt_${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      provider: i % 2 === 0 ? 'github' : 'gitlab',
      event_type: i % 3 === 0 ? 'push' : 'merge_request',
      status: i % 5 === 0 ? 'failed' : 'success',
      delivery_status: i % 5 === 0 ? 'failed' : 'delivered' as const,
      retry_count: Math.floor(i / 10),
      payload_hash: `sha256_${i}`,
    })),
    onSelectEvent: (event) => console.log('Selected:', event),
    loading: false,
    itemsPerPage: 10,
  },
};
