import type { Meta, StoryObj } from '@storybook/react';
import EventDetailsModal from './EventDetailsModal';

const meta = {
  component: EventDetailsModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    event: { control: 'object' },
    onClose: { action: 'closed' },
    onRetry: { action: 'retry' },
    isRetrying: { control: 'boolean' },
  },
} satisfies Meta<typeof EventDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEventSuccess = {
  id: 'evt_1',
  timestamp: '2025-11-14T10:00:00Z',
  provider: 'github',
  event_type: 'push',
  status: 'success',
  delivery_status: 'delivered' as const,
  retry_count: 0,
  payload_hash: 'sha256_abc123def456ghi789',
  signature_verified: true,
  retry_history: [
    { retry_id: 'retry_1', timestamp: '2025-11-14T10:00:10Z', status: 'success' },
  ],
};

const mockEventFailed = {
  id: 'evt_2',
  timestamp: '2025-11-14T09:00:00Z',
  provider: 'gitlab',
  event_type: 'merge_request',
  status: 'failed',
  delivery_status: 'failed' as const,
  retry_count: 2,
  payload_hash: 'sha256_xyz789abc123def456',
  signature_verified: false,
  retry_history: [
    { retry_id: 'retry_1', timestamp: '2025-11-14T09:01:00Z', status: 'failed' },
    { retry_id: 'retry_2', timestamp: '2025-11-14T09:05:00Z', status: 'failed' },
    { retry_id: 'retry_3', timestamp: '2025-11-14T09:10:00Z', status: 'failed' },
  ],
};

const mockEventRetrying = {
  id: 'evt_3',
  timestamp: '2025-11-14T08:00:00Z',
  provider: 'jenkins',
  event_type: 'build_complete',
  status: 'pending',
  delivery_status: 'retrying' as const,
  retry_count: 1,
  payload_hash: 'sha256_qqq111www222eee333',
  signature_verified: true,
  retry_history: [
    { retry_id: 'retry_1', timestamp: '2025-11-14T08:01:00Z', status: 'failed' },
    { retry_id: 'retry_2', timestamp: '2025-11-14T08:05:00Z', status: 'retrying' },
  ],
};

export const SuccessfulDelivery: Story = {
  args: {
    open: true,
    event: mockEventSuccess,
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: false,
  },
};

export const FailedDelivery: Story = {
  args: {
    open: true,
    event: mockEventFailed,
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: false,
  },
};

export const RetryingDelivery: Story = {
  args: {
    open: true,
    event: mockEventRetrying,
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: false,
  },
};

export const IsRetrying: Story = {
  args: {
    open: true,
    event: mockEventFailed,
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: true,
  },
};

export const NoRetryHistory: Story = {
  args: {
    open: true,
    event: { ...mockEventSuccess, retry_history: [] },
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: false,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    event: mockEventSuccess,
    onClose: () => {},
    onRetry: (id) => console.log('Retry:', id),
    isRetrying: false,
  },
};
