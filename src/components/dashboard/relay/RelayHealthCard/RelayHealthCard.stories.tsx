import type { Meta, StoryObj } from '@storybook/react';
import RelayHealthCard from './RelayHealthCard';
import type { RelayHealthMetrics } from '@/lib/api/relays';

const mockRelay: RelayHealthMetrics = {
  id: 'relay-1',
  name: 'us-east-1-relay',
  region: 'us-east-1',
  environment: 'production',
  status: 'online',
  uptime_24h: 99.99,
  uptime_7d: 99.98,
  uptime_30d: 99.95,
  response_time_ms: 42,
  response_time_p95_ms: 120,
  response_time_p99_ms: 250,
  error_rate_percent: 0.01,
  throughput_rps: 1250,
  last_heartbeat_at: new Date().toISOString(),
};

const meta = {
  component: RelayHealthCard,
  tags: ['autodocs'],
  argTypes: {
    relay: { control: 'object' },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof RelayHealthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: { relay: mockRelay, onClick: () => {} },
};

export const Offline: Story = {
  args: {
    relay: { ...mockRelay, status: 'offline', uptime_24h: 60, error_rate_percent: 100 },
    onClick: () => {},
  },
};

export const Degraded: Story = {
  args: {
    relay: { ...mockRelay, status: 'degraded', uptime_24h: 95, response_time_ms: 500, error_rate_percent: 5 },
    onClick: () => {},
  },
};

export const HighLatency: Story = {
  args: {
    relay: { ...mockRelay, response_time_ms: 800, response_time_p95_ms: 1200, response_time_p99_ms: 2000 },
    onClick: () => {},
  },
};

export const LowThroughput: Story = {
  args: {
    relay: { ...mockRelay, throughput_rps: 50 },
    onClick: () => {},
  },
};
