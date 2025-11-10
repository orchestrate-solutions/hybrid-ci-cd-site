/**
 * AgentsPage Storybook Stories
 * 
 * Visual contracts for different agent page states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import AgentsPage from './page';

const meta = {
  component: AgentsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AgentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    mockData: {
      agents: [
        {
          id: 'agent-1',
          name: 'Primary Build Agent',
          pool_id: 'pool-1',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 8,
          memory_gb: 16,
          disk_gb: 500,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Deploy Agent',
          pool_id: 'pool-1',
          status: 'RUNNING',
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: 'job-123',
          last_heartbeat: '2025-11-10T09:59:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T09:59:00Z',
        },
      ],
      total: 2,
      limit: 50,
      offset: 0,
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: null,
    delay: 5000, // Delay to show loading state
  },
};

export const Error: Story = {
  parameters: {
    mockError: 'Failed to fetch agents',
  },
};

export const Empty: Story = {
  parameters: {
    mockData: {
      agents: [],
      total: 0,
      limit: 50,
      offset: 0,
    },
  },
};

export const WithOfflineAgent: Story = {
  parameters: {
    mockData: {
      agents: [
        {
          id: 'agent-1',
          name: 'Online Agent',
          pool_id: 'pool-1',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 8,
          memory_gb: 16,
          disk_gb: 500,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Offline Agent',
          pool_id: 'pool-2',
          status: 'OFFLINE',
          version: '1.5.1',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: null,
          last_heartbeat: '2025-11-10T08:00:00Z',
          created_at: '2025-09-15T08:00:00Z',
          updated_at: '2025-11-10T08:00:00Z',
        },
      ],
      total: 2,
      limit: 50,
      offset: 0,
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    mockData: {
      agents: [
        {
          id: 'agent-1',
          name: 'Build Agent',
          pool_id: 'pool-1',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    mockData: {
      agents: [
        {
          id: 'agent-1',
          name: 'Build Agent',
          pool_id: 'pool-1',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    mockData: {
      agents: [
        {
          id: 'agent-1',
          name: 'Primary Build Agent',
          pool_id: 'pool-1',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 8,
          memory_gb: 16,
          disk_gb: 500,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
        {
          id: 'agent-2',
          name: 'Deploy Agent',
          pool_id: 'pool-1',
          status: 'RUNNING',
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: 'job-123',
          last_heartbeat: '2025-11-10T09:59:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T09:59:00Z',
        },
        {
          id: 'agent-3',
          name: 'Test Agent',
          pool_id: 'pool-2',
          status: 'IDLE',
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
      ],
      total: 3,
      limit: 50,
      offset: 0,
    },
  },
};
