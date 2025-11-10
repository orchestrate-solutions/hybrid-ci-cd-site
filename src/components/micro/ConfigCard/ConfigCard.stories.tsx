/**
 * ConfigCard Component Stories
 * 
 * RED Phase: Define component states before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ConfigCard } from './ConfigCard';

const meta = {
  component: ConfigCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    status: { control: { type: 'select', options: ['active', 'inactive', 'warning', 'error'] } },
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
  },
} satisfies Meta<typeof ConfigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default active configuration card
 */
export const Default: Story = {
  args: {
    title: 'GitHub Actions',
    description: 'CI/CD tool integration for GitHub repositories',
    status: 'active',
  },
};

/**
 * Inactive configuration
 */
export const Inactive: Story = {
  args: {
    title: 'GitLab CI',
    description: 'CI/CD tool integration for GitLab repositories',
    status: 'inactive',
  },
};

/**
 * Configuration with warning status
 */
export const Warning: Story = {
  args: {
    title: 'Jenkins',
    description: 'CI/CD tool integration - authentication expiring soon',
    status: 'warning',
  },
};

/**
 * Configuration with error status
 */
export const Error: Story = {
  args: {
    title: 'CircleCI',
    description: 'CI/CD tool integration - connection failed',
    status: 'error',
  },
};

/**
 * Long title and description
 */
export const LongContent: Story = {
  args: {
    title: 'Kubernetes Cluster Integration with Multiple Namespaces and Custom Configurations',
    description:
      'Advanced Kubernetes cluster integration with support for multiple namespaces, custom configurations, RBAC policies, and real-time synchronization across distributed environments.',
    status: 'active',
  },
};

/**
 * With all interaction handlers
 */
export const Interactive: Story = {
  args: {
    title: 'GitHub Actions',
    description: 'CI/CD tool integration for GitHub repositories',
    status: 'active',
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

/**
 * Compact variant
 */
export const Compact: Story = {
  args: {
    title: 'GitHub Actions',
    description: 'CI/CD integration',
    status: 'active',
    compact: true,
  },
};
