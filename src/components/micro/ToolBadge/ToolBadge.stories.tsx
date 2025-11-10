/**
 * ToolBadge Component Stories
 * 
 * RED Phase: Component state definitions
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ToolBadge } from './ToolBadge';

const meta = {
  component: ToolBadge,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    version: { control: 'text' },
    category: {
      control: { type: 'select', options: ['ci', 'deployment', 'monitoring', 'security', 'other'] },
    },
    verified: { control: 'boolean' },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
  },
} satisfies Meta<typeof ToolBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'GitHub Actions',
    version: '1.0.0',
    category: 'ci',
  },
};

export const Verified: Story = {
  args: {
    name: 'GitHub Actions',
    version: '1.0.0',
    category: 'ci',
    verified: true,
  },
};

export const Deployment: Story = {
  args: {
    name: 'Kubernetes',
    version: '1.27.0',
    category: 'deployment',
  },
};

export const Monitoring: Story = {
  args: {
    name: 'Prometheus',
    version: '2.40.0',
    category: 'monitoring',
    verified: true,
  },
};

export const Security: Story = {
  args: {
    name: 'Vault',
    version: '1.15.0',
    category: 'security',
    verified: true,
  },
};

export const Small: Story = {
  args: {
    name: 'GitHub Actions',
    version: '1.0.0',
    category: 'ci',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    name: 'GitHub Actions',
    version: '1.0.0',
    category: 'ci',
    size: 'lg',
  },
};

export const AllCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ToolBadge name="GitHub Actions" version="1.0.0" category="ci" verified={true} />
      <ToolBadge name="Kubernetes" version="1.27.0" category="deployment" verified={true} />
      <ToolBadge name="Prometheus" version="2.40.0" category="monitoring" />
      <ToolBadge name="Vault" version="1.15.0" category="security" verified={true} />
      <ToolBadge name="Custom Tool" version="1.0.0" category="other" />
    </div>
  ),
};
