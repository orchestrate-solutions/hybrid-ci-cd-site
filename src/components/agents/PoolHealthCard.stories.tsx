/**
 * PoolHealthCard Storybook Stories
 * Visual documentation for PoolHealthCard component in different states
 */

import { Meta, StoryObj } from '@storybook/react';
import { PoolHealthCard } from './PoolHealthCard';

export default {
  component: PoolHealthCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PoolHealthCard>;

type Story = StoryObj<typeof PoolHealthCard>;

/**
 * Default healthy pool state
 */
export const Healthy: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 35,
      memory_usage_percent: 45,
      disk_usage_percent: 42,
      healthy_agent_count: 10,
      unhealthy_agent_count: 0,
      total_agent_count: 10,
    },
  },
};

/**
 * Degraded pool state with medium resource usage
 */
export const Degraded: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 65,
      memory_usage_percent: 72,
      disk_usage_percent: 68,
      healthy_agent_count: 8,
      unhealthy_agent_count: 2,
      total_agent_count: 10,
    },
  },
};

/**
 * Critical pool state with high resource usage
 */
export const Critical: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 88,
      memory_usage_percent: 92,
      disk_usage_percent: 85,
      healthy_agent_count: 5,
      unhealthy_agent_count: 5,
      total_agent_count: 10,
    },
  },
};

/**
 * High CPU usage, normal memory and disk
 */
export const HighCPU: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 82,
      memory_usage_percent: 45,
      disk_usage_percent: 38,
      healthy_agent_count: 9,
      unhealthy_agent_count: 1,
      total_agent_count: 10,
    },
  },
};

/**
 * High memory usage, normal CPU and disk
 */
export const HighMemory: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 42,
      memory_usage_percent: 81,
      disk_usage_percent: 35,
      healthy_agent_count: 8,
      unhealthy_agent_count: 2,
      total_agent_count: 10,
    },
  },
};

/**
 * Near-full disk usage
 */
export const HighDisk: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 38,
      memory_usage_percent: 52,
      disk_usage_percent: 87,
      healthy_agent_count: 7,
      unhealthy_agent_count: 3,
      total_agent_count: 10,
    },
  },
};

/**
 * All metrics at maximum
 */
export const AllMaximum: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 100,
      memory_usage_percent: 100,
      disk_usage_percent: 100,
      healthy_agent_count: 1,
      unhealthy_agent_count: 9,
      total_agent_count: 10,
    },
  },
};

/**
 * All metrics at minimum
 */
export const AllMinimum: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 0,
      memory_usage_percent: 0,
      disk_usage_percent: 0,
      healthy_agent_count: 10,
      unhealthy_agent_count: 0,
      total_agent_count: 10,
    },
  },
};

/**
 * Single unhealthy agent
 */
export const OneUnhealthyAgent: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 48,
      memory_usage_percent: 55,
      disk_usage_percent: 52,
      healthy_agent_count: 9,
      unhealthy_agent_count: 1,
      total_agent_count: 10,
    },
  },
};

/**
 * Large pool with many unhealthy agents
 */
export const LargePoolDegraded: Story = {
  args: {
    metrics: {
      cpu_usage_percent: 72,
      memory_usage_percent: 78,
      disk_usage_percent: 75,
      healthy_agent_count: 20,
      unhealthy_agent_count: 15,
      total_agent_count: 35,
    },
  },
};
