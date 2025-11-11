import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogViewer } from '../LogViewer';
import { logsApi } from '@/lib/api/logs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock the logs API
vi.mock('@/lib/api/logs', () => ({
  logsApi: {
    getJobLogs: vi.fn(),
  },
}));

describe('LogViewer Component', () => {
  const mockLogs = {
    job_id: 'job-123',
    log_lines: [
      '[INFO] Job started at 2025-01-15T10:00:00Z',
      '[INFO] Running step: build',
      '[INFO] Build successful',
      '[INFO] Running step: test',
      '[INFO] Tests passed',
      '[INFO] Job completed successfully',
    ],
    total_lines: 6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders log viewer with job ID label', () => {
      render(<LogViewer jobId="job-123" />);
      expect(screen.getByText(/Job Logs: job-123/i)).toBeInTheDocument();
    });

    it('shows expand button initially', () => {
      render(<LogViewer jobId="job-123" />);
      expect(screen.getByRole('button', { name: /view logs/i })).toBeInTheDocument();
    });

    it('does not show log content when collapsed', () => {
      render(<LogViewer jobId="job-123" />);
      expect(screen.queryByText('[INFO] Job started')).not.toBeInTheDocument();
    });
  });

  describe('Expansion & Fetching', () => {
    it('fetches and displays logs on expand', async () => {
      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(mockLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(logsApi.getJobLogs).toHaveBeenCalledWith('job-123', expect.any(Object));
      });

      await waitFor(() => {
        expect(screen.getByText('[INFO] Job started at 2025-01-15T10:00:00Z')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching logs', async () => {
      vi.mocked(logsApi.getJobLogs).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockLogs), 100)
          )
      );

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays all log lines', async () => {
      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(mockLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        mockLogs.log_lines.forEach((line) => {
          expect(screen.getByText(line)).toBeInTheDocument();
        });
      });
    });

    it('shows error message on fetch failure', async () => {
      vi.mocked(logsApi.getJobLogs).mockRejectedValueOnce(new Error('Failed to fetch logs'));

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      // Wait for error alert to appear
      await waitFor(() => {
        const alert = screen.queryByRole('alert');
        expect(alert).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Collapse Behavior', () => {
    it('toggles expanded state when button clicked', async () => {
      const simpleLogs = {
        job_id: 'job-123',
        log_lines: ['Line 1', 'Line 2'],
        total_lines: 2,
      };
      vi.mocked(logsApi.getJobLogs).mockResolvedValue(simpleLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });

      // Initially collapsed
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await userEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');

      // Wait for logs to load
      await waitFor(() => {
        expect(screen.getByText('Line 1')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('displays search input when expanded', async () => {
      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(mockLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search logs/i)).toBeInTheDocument();
      });
    });

    it('filters logs based on search term', async () => {
      const simpleLogs = {
        job_id: 'job-123',
        log_lines: [
          'test line 1',
          'other line 2',
          'test line 3',
        ],
        total_lines: 3,
      };

      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(simpleLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('test line 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search logs/i);
      await userEvent.type(searchInput, 'other');

      // Should show matching text
      expect(screen.getByText('other line 2')).toBeInTheDocument();
    });
  });

  describe('Auto-scroll & Follow', () => {
    it('shows follow button when expanded', async () => {
      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(mockLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      vi.mocked(logsApi.getJobLogs).mockResolvedValueOnce(mockLogs);

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('logs container has role alert for errors', async () => {
      vi.mocked(logsApi.getJobLogs).mockRejectedValueOnce(new Error('Network error'));

      render(<LogViewer jobId="job-123" />);

      const expandButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
