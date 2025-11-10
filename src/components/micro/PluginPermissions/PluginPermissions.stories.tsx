import { Meta, StoryObj } from '@storybook/react';
import { PluginPermissions } from './PluginPermissions';

export default {
  component: PluginPermissions,
  tags: ['autodocs'],
} satisfies Meta<typeof PluginPermissions>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    permissions: [
      {
        id: 'fs-read',
        name: 'File System Read',
        description: 'Read files from your project directory',
        riskLevel: 'low',
      },
      {
        id: 'env-access',
        name: 'Environment Variables',
        description: 'Access environment variables (may contain secrets)',
        riskLevel: 'high',
      },
      {
        id: 'network',
        name: 'Network Access',
        description: 'Make outbound HTTP/HTTPS requests',
        riskLevel: 'medium',
      },
    ],
    onApprove: () => console.log('Permissions approved'),
    onReject: () => console.log('Permissions rejected'),
  },
};

export const HighRiskOnly: Story = {
  args: {
    permissions: [
      {
        id: 'admin',
        name: 'Full System Access',
        description: 'Unrestricted access to all system resources',
        riskLevel: 'critical',
      },
      {
        id: 'secrets',
        name: 'Secrets Management',
        description: 'Full access to all stored secrets and credentials',
        riskLevel: 'critical',
      },
    ],
    onApprove: () => console.log('Permissions approved'),
    onReject: () => console.log('Permissions rejected'),
  },
};

export const LowRiskOnly: Story = {
  args: {
    permissions: [
      {
        id: 'read-config',
        name: 'Read Configuration',
        description: 'Read plugin configuration files',
        riskLevel: 'low',
      },
      {
        id: 'read-logs',
        name: 'Read Logs',
        description: 'Read application logs',
        riskLevel: 'low',
      },
    ],
    onApprove: () => console.log('Permissions approved'),
    onReject: () => console.log('Permissions rejected'),
  },
};

export const SinglePermission: Story = {
  args: {
    permissions: [
      {
        id: 'webhook',
        name: 'Webhook Registration',
        description: 'Register webhooks for CI/CD events',
        riskLevel: 'medium',
      },
    ],
    onApprove: () => console.log('Permissions approved'),
    onReject: () => console.log('Permissions rejected'),
  },
};

export const ManyPermissions: Story = {
  args: {
    permissions: [
      {
        id: 'read-1',
        name: 'Read Files',
        description: 'Read source code and configuration files',
        riskLevel: 'low',
      },
      {
        id: 'write-1',
        name: 'Write Files',
        description: 'Write files to build output directory',
        riskLevel: 'medium',
      },
      {
        id: 'exec-1',
        name: 'Execute Commands',
        description: 'Execute shell commands in CI environment',
        riskLevel: 'high',
      },
      {
        id: 'env-1',
        name: 'Access Environment',
        description: 'Read environment variables',
        riskLevel: 'high',
      },
      {
        id: 'network-1',
        name: 'Network Access',
        description: 'Make HTTP requests to external services',
        riskLevel: 'medium',
      },
      {
        id: 'db-1',
        name: 'Database Access',
        description: 'Connect to database services',
        riskLevel: 'critical',
      },
    ],
    onApprove: () => console.log('Permissions approved'),
    onReject: () => console.log('Permissions rejected'),
  },
};
