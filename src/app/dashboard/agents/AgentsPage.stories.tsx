/**
 * AgentsPage Storybook Stories
 * 
 * Visual contracts for different agent page states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import AgentsPage from './page';

// Helper component that intercepts fetch for mock data
function StoryWrapper({ mockData }: { mockData: any }) {
  useEffect(() => {
    // Override fetch globally for this story
    const originalFetch = global.fetch;
    global.fetch = async (url: string | Request, options?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.url;
      if (urlStr.includes('/api/dashboard/agents')) {
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, options);
    };

    return () => {
      global.fetch = originalFetch;
    };
  }, [mockData]);

  return <AgentsPage />;
}

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
  render: () => (
    <StoryWrapper
      mockData={{
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
            version: '1.5.1',
            cpu_cores: 2,
            memory_gb: 4,
            disk_gb: 100,
            current_job_id: null,
            last_heartbeat: '2025-11-10T10:01:00Z',
            created_at: '2025-09-15T08:00:00Z',
            updated_at: '2025-11-10T10:01:00Z',
          },
        ],
        total: 3,
        limit: 50,
        offset: 0,
      }}
    />
  ),
};

export const Loading: Story = {
  render: () => {
    // Mock a slow response to show loading
    const slowMockData = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            agents: [],
            total: 0,
            limit: 50,
            offset: 0,
          }),
        3000
      )
    );

    useEffect(() => {
      const originalFetch = global.fetch;
      global.fetch = async (url: string | Request) => {
        const urlStr = typeof url === 'string' ? url : url.url;
        if (urlStr.includes('/api/dashboard/agents')) {
          await slowMockData;
          return new Response(JSON.stringify({ agents: [], total: 0, limit: 50, offset: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(url);
      };
      return () => {
        global.fetch = originalFetch;
      };
    }, []);

    return <AgentsPage />;
  },
};

export const Error: Story = {
  render: () => {
    useEffect(() => {
      const originalFetch = global.fetch;
      global.fetch = async (url: string | Request) => {
        const urlStr = typeof url === 'string' ? url : url.url;
        if (urlStr.includes('/api/dashboard/agents')) {
          return new Response(JSON.stringify({ error: 'Failed to fetch agents' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(url);
      };
      return () => {
        global.fetch = originalFetch;
      };
    }, []);

    return <AgentsPage />;
  },
};

export const Empty: Story = {
  render: () => (
    <StoryWrapper
      mockData={{
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      }}
    />
  ),
};

export const WithOfflineAgent: Story = {
  render: () => (
    <StoryWrapper
      mockData={{
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
      }}
    />
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <StoryWrapper
      mockData={{
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
          {
            id: 'agent-2',
            name: 'Deploy Agent',
            pool_id: 'pool-1',
            status: 'RUNNING',
            version: '1.5.2',
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 250,
            current_job_id: 'job-456',
            last_heartbeat: '2025-11-10T09:59:00Z',
            created_at: '2025-10-15T08:00:00Z',
            updated_at: '2025-11-10T09:59:00Z',
          },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      }}
    />
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <StoryWrapper
      mockData={{
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
          {
            id: 'agent-2',
            name: 'Deploy Agent',
            pool_id: 'pool-1',
            status: 'RUNNING',
            version: '1.5.2',
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 250,
            current_job_id: 'job-456',
            last_heartbeat: '2025-11-10T09:59:00Z',
            created_at: '2025-10-15T08:00:00Z',
            updated_at: '2025-11-10T09:59:00Z',
          },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      }}
    />
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <StoryWrapper
      mockData={{
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
            status: 'PAUSED',
            version: '1.5.0',
            cpu_cores: 2,
            memory_gb: 4,
            disk_gb: 100,
            current_job_id: null,
            last_heartbeat: '2025-11-10T10:01:00Z',
            created_at: '2025-09-15T08:00:00Z',
            updated_at: '2025-11-10T10:01:00Z',
          },
        ],
        total: 3,
        limit: 50,
        offset: 0,
      }}
    />
  ),
};
