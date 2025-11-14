import type { Meta, StoryObj } from '@storybook/react';
import { VaultStatusCard } from './VaultStatusCard';

const meta = {
  component: VaultStatusCard,
  tags: ['autodocs'],
} satisfies Meta<typeof VaultStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    vault: {
      id: 'vault-1',
      name: 'AWS Secrets Manager',
      provider: 'aws_secrets_manager',
      region: 'us-east-1',
      is_connected: true,
      is_active: true,
      last_sync: '2025-11-13T10:30:00Z',
      created_at: '2025-11-01T00:00:00Z',
      updated_at: '2025-11-13T00:00:00Z',
    },
    onTest: () => console.log('Testing connection'),
    onEdit: () => console.log('Editing vault'),
    onDelete: () => console.log('Deleting vault'),
  },
};

export const Disconnected: Story = {
  args: {
    ...Connected.args,
    vault: { ...Connected.args.vault, is_connected: false, last_sync: undefined },
  },
};

export const AzureKeyvault: Story = {
  args: {
    ...Connected.args,
    vault: {
      ...Connected.args.vault,
      name: 'Azure Key Vault',
      provider: 'azure_keyvault',
      region: 'eastus',
    },
  },
};

export const GCPSecret: Story = {
  args: {
    ...Connected.args,
    vault: {
      ...Connected.args.vault,
      name: 'GCP Secret Manager',
      provider: 'gcp_secret_manager',
      region: 'us-central1',
    },
  },
};

export const Inactive: Story = {
  args: {
    ...Connected.args,
    vault: { ...Connected.args.vault, is_active: false },
  },
};
