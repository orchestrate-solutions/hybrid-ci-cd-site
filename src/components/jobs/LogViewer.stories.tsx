import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { logsApi } from '../../lib/api/logs';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../lib/api/logs', () => ({
  logsApi: {
    getJobLogs: vi.fn(),
  },
}));

const meta: Meta<typeof LogViewer> = {
  component: LogViewer,
  title: 'Components/LogViewer',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    jobId: {
      control: 'text',
      description: 'Job ID to fetch logs for',
    },
    maxHeight: {
      control: 'text',
      description: 'Maximum height of log panel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

export const Collapsed: Story = {
  args: {
    jobId: 'job-12345',
  },
  render: (args) => <LogViewer {...args} />,
};

export const Expanded: Story = {
  args: {
    jobId: 'job-12345',
  },
  render: (args) => {
    // Simulate expanded state with mock data
    vi.mocked(logsApi.getJobLogs).mockResolvedValue({
      job_id: 'job-12345',
      log_lines: [
        '[2025-01-15T10:00:00Z] [INFO] Job started',
        '[2025-01-15T10:00:05Z] [INFO] Running build step',
        '[2025-01-15T10:00:15Z] [INFO] Building application...',
        '[2025-01-15T10:00:45Z] [SUCCESS] Build complete',
        '[2025-01-15T10:00:46Z] [INFO] Running tests',
        '[2025-01-15T10:01:20Z] [INFO] 42 tests passed',
        '[2025-01-15T10:01:21Z] [SUCCESS] All tests passed',
        '[2025-01-15T10:01:22Z] [INFO] Deploying to staging',
        '[2025-01-15T10:01:45Z] [SUCCESS] Deployment complete',
        '[2025-01-15T10:01:46Z] [INFO] Job finished successfully',
      ],
      total_lines: 10,
    });

    return <LogViewer {...args} />;
  },
};

export const WithError: Story = {
  args: {
    jobId: 'job-failed',
  },
  render: (args) => {
    vi.mocked(logsApi.getJobLogs).mockRejectedValue(new Error('Failed to fetch logs'));
    return <LogViewer {...args} />;
  },
};

export const Empty: Story = {
  args: {
    jobId: 'job-empty',
  },
  render: (args) => {
    vi.mocked(logsApi.getJobLogs).mockResolvedValue({
      job_id: 'job-empty',
      log_lines: [],
      total_lines: 0,
    });
    return <LogViewer {...args} />;
  },
};

export const CustomHeight: Story = {
  args: {
    jobId: 'job-tall',
    maxHeight: '600px',
  },
  render: (args) => {
    vi.mocked(logsApi.getJobLogs).mockResolvedValue({
      job_id: 'job-tall',
      log_lines: Array.from({ length: 50 }, (_, i) => `[INFO] Log line ${i + 1}`),
      total_lines: 50,
    });
    return <LogViewer {...args} />;
  },
};
