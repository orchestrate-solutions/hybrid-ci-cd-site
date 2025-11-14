import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ChangeDetailsModal from '../ChangeDetailsModal';

const meta = {
  component: ChangeDetailsModal,
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
  },
} satisfies Meta<typeof ChangeDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCreateLog = {
  id: 'audit_1',
  timestamp: '2025-11-14T10:00:00Z',
  user_id: 'user_1',
  user_email: 'user@example.com',
  action: 'create' as const,
  resource_type: 'relay',
  resource_id: 'relay_prod_1',
  before: null,
  after: { name: 'prod-relay', description: 'Production relay', status: 'active' },
  sensitivity: 'low' as const,
};

const mockSensitiveLog = {
  id: 'audit_2',
  timestamp: '2025-11-14T09:00:00Z',
  user_id: 'admin_user',
  user_email: 'admin@example.com',
  action: 'update' as const,
  resource_type: 'webhook',
  resource_id: 'webhook_github',
  before: {
    api_key: 'sk_test_abc123def456gh',
    webhook_secret: 'whsec_xyz789',
    password: 'old_password_123',
  },
  after: {
    api_key: 'sk_test_new_xyz789',
    webhook_secret: 'whsec_new_abc123',
    password: 'new_password_456',
  },
  sensitivity: 'high' as const,
};

const mockDeleteLog = {
  id: 'audit_3',
  timestamp: '2025-11-14T08:00:00Z',
  user_id: 'admin_user',
  user_email: 'admin@example.com',
  action: 'delete' as const,
  resource_type: 'agent',
  resource_id: 'agent_temp_1',
  before: { name: 'temp-agent', token: 'temp_token_xyz' },
  after: null,
  sensitivity: 'high' as const,
};

export const Default: Story = {
  args: {
    log: mockCreateLog,
    open: true,
    onClose: () => {},
  },
};

export const SensitiveChange: Story = {
  args: {
    log: mockSensitiveLog,
    open: true,
    onClose: () => {},
  },
};

export const DeleteAction: Story = {
  args: {
    log: mockDeleteLog,
    open: true,
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    log: mockCreateLog,
    open: false,
    onClose: () => {},
  },
};

export const MediumSensitivity: Story = {
  args: {
    log: {
      ...mockCreateLog,
      sensitivity: 'medium' as const,
      after: {
        ...mockCreateLog.after,
        rate_limit: '1000 req/min',
      },
    },
    open: true,
    onClose: () => {},
  },
};

export const ComplexChange: Story = {
  args: {
    log: {
      id: 'audit_4',
      timestamp: '2025-11-14T07:00:00Z',
      user_id: 'user_advanced',
      user_email: 'advanced@example.com',
      action: 'update' as const,
      resource_type: 'relay',
      resource_id: 'relay_complex',
      before: {
        name: 'old-relay',
        regions: ['us-east-1', 'eu-west-1'],
        config: { timeout: 30, retry: 3 },
        api_key: 'sk_old_abc',
      },
      after: {
        name: 'new-relay',
        regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
        config: { timeout: 60, retry: 5 },
        api_key: 'sk_new_xyz',
      },
      sensitivity: 'high' as const,
    },
    open: true,
    onClose: () => {},
  },
};
