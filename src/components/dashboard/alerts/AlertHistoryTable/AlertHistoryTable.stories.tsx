import type { Meta, StoryObj } from '@storybook/react';
import AlertHistoryTable from '../AlertHistoryTable';

const meta = {
  component: AlertHistoryTable,
  tags: ['autodocs'],
  argTypes: {
    onAcknowledge: { action: 'alert acknowledged' },
  },
} satisfies Meta<typeof AlertHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAlerts = [
  {
    id: 'alert_1',
    rule_id: 'rule_1',
    timestamp: '2025-11-14T10:05:00Z',
    severity: 'critical' as const,
    message: 'Queue depth exceeded 1000 messages',
    acknowledged: false,
    value: 1250,
  },
  {
    id: 'alert_2',
    rule_id: 'rule_2',
    timestamp: '2025-11-14T09:30:00Z',
    severity: 'high' as const,
    message: 'Relay offline - recovery in progress',
    acknowledged: true,
    value: 0,
  },
  {
    id: 'alert_3',
    rule_id: 'rule_3',
    timestamp: '2025-11-14T09:00:00Z',
    severity: 'medium' as const,
    message: 'Error rate elevated to 15%',
    acknowledged: false,
    value: 15,
  },
  {
    id: 'alert_4',
    rule_id: 'rule_4',
    timestamp: '2025-11-14T08:30:00Z',
    severity: 'low' as const,
    message: 'Response time slightly elevated',
    acknowledged: true,
    value: 250,
  },
];

export const Default: Story = {
  args: {
    alerts: mockAlerts,
    onAcknowledge: async () => {},
  },
};

export const WithUnacknowledgedOnly: Story = {
  args: {
    alerts: mockAlerts.filter((a) => !a.acknowledged),
    onAcknowledge: async () => {},
  },
};

export const CriticalOnly: Story = {
  args: {
    alerts: mockAlerts.filter((a) => a.severity === 'critical'),
    onAcknowledge: async () => {},
  },
};

export const Loading: Story = {
  args: {
    alerts: [],
    loading: true,
    onAcknowledge: async () => {},
  },
};

export const Empty: Story = {
  args: {
    alerts: [],
    onAcknowledge: async () => {},
  },
};

export const LargeDataset: Story = {
  args: {
    alerts: Array.from({ length: 100 }, (_, i) => ({
      id: `alert_${i}`,
      rule_id: `rule_${i % 5}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      severity: ['critical', 'high', 'medium', 'low'][i % 4] as any,
      message: `Alert message ${i}`,
      acknowledged: i % 3 === 0,
      value: Math.floor(Math.random() * 1000),
    })),
    onAcknowledge: async () => {},
  },
};

export const WithoutAcknowledgeButton: Story = {
  args: {
    alerts: mockAlerts,
    onAcknowledge: undefined,
  },
};
