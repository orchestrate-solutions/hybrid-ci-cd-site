import type { Meta, StoryObj } from '@storybook/react';
import AuditTable from '../AuditTable';

const meta = {
  component: AuditTable,
  tags: ['autodocs'],
  argTypes: {
    onSelectLog: { action: 'log selected' },
  },
} satisfies Meta<typeof AuditTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLogs = [
  {
    id: 'audit_1',
    timestamp: '2025-11-14T10:00:00Z',
    user_id: 'user_1',
    user_email: 'user@example.com',
    action: 'create' as const,
    resource_type: 'relay',
    resource_id: 'relay_prod_1',
    before: null,
    after: { name: 'prod-relay', status: 'active' },
    sensitivity: 'low' as const,
  },
  {
    id: 'audit_2',
    timestamp: '2025-11-14T09:30:00Z',
    user_id: 'admin_user',
    user_email: 'admin@example.com',
    action: 'update' as const,
    resource_type: 'webhook',
    resource_id: 'webhook_github',
    before: { url: 'https://old.example.com' },
    after: { url: 'https://new.example.com' },
    sensitivity: 'medium' as const,
  },
  {
    id: 'audit_3',
    timestamp: '2025-11-14T09:00:00Z',
    user_id: 'admin_user',
    user_email: 'admin@example.com',
    action: 'delete' as const,
    resource_type: 'agent',
    resource_id: 'agent_temp_1',
    before: { name: 'temp-agent' },
    after: null,
    sensitivity: 'high' as const,
  },
];

export const Default: Story = {
  args: {
    logs: mockLogs,
    onSelectLog: () => {},
  },
};

export const Loading: Story = {
  args: {
    logs: [],
    loading: true,
    onSelectLog: () => {},
  },
};

export const Empty: Story = {
  args: {
    logs: [],
    loading: false,
    onSelectLog: () => {},
  },
};

export const WithFilteredCreate: Story = {
  args: {
    logs: mockLogs.filter((l) => l.action === 'create'),
    onSelectLog: () => {},
  },
};

export const WithHighSensitivity: Story = {
  args: {
    logs: mockLogs.filter((l) => l.sensitivity === 'high'),
    onSelectLog: () => {},
  },
};

export const LargeDataset: Story = {
  args: {
    logs: Array.from({ length: 100 }, (_, i) => ({
      id: `audit_${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      user_id: ['user_1', 'user_2', 'admin'][i % 3],
      user_email: ['user1@example.com', 'user2@example.com', 'admin@example.com'][i % 3],
      action: ['create', 'update', 'delete'][i % 3] as any,
      resource_type: ['relay', 'webhook', 'agent'][i % 3],
      resource_id: `resource_${i}`,
      before: i % 2 === 0 ? { status: 'inactive' } : null,
      after: { status: 'active' },
      sensitivity: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
    })),
    onSelectLog: () => {},
  },
};
