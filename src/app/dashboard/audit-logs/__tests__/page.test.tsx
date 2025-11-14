import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogsPage from '../page';

// Mock API and hooks
vi.mock('../../../lib/api/audit', () => ({
  auditApi: {
    getLogs: vi.fn(),
    getLogDetails: vi.fn(),
    getSensitiveChanges: vi.fn(),
  },
}));

vi.mock('../../../lib/hooks/useAuditLogs', () => ({
  useAuditLogs: vi.fn(),
}));

import { auditApi } from '../../../lib/api/audit';
import { useAuditLogs } from '../../../lib/hooks/useAuditLogs';

describe('Audit Logs Page', () => {
  const mockLogs = [
    {
      id: 'audit_1',
      timestamp: '2025-11-14T10:00:00Z',
      user_id: 'user_1',
      action: 'create',
      resource_type: 'relay',
      resource_id: 'relay_1',
      before: null,
      after: { name: 'relay' },
      sensitivity: 'low',
    },
    {
      id: 'audit_2',
      timestamp: '2025-11-14T09:00:00Z',
      user_id: 'admin_user',
      action: 'delete',
      resource_type: 'webhook',
      resource_id: 'webhook_1',
      before: { token: 'secret' },
      after: null,
      sensitivity: 'high',
    },
    {
      id: 'audit_3',
      timestamp: '2025-11-14T08:00:00Z',
      user_id: 'user_2',
      action: 'update',
      resource_type: 'job',
      resource_id: 'job_1',
      before: { status: 'pending' },
      after: { status: 'running' },
      sensitivity: 'medium',
    },
  ];

  const mockStats = {
    total_changes: 3,
    create_count: 1,
    update_count: 1,
    delete_count: 1,
    high_sensitivity_count: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuditLogs as any).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      filterByAction: vi.fn(),
      filterByUser: vi.fn(),
      filterByResourceType: vi.fn(),
      getCountByAction: vi.fn(),
      getSensitiveChanges: vi.fn(),
      getPaginated: vi.fn().mockReturnValue(mockLogs),
      getFormattedChange: vi.fn(),
      exportAsCSV: vi.fn(),
      exportAsJSON: vi.fn(),
      refetch: vi.fn(),
    });

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);
    (auditApi.getSensitiveChanges as any).mockResolvedValue(
      mockLogs.filter((l) => l.sensitivity === 'high')
    );
  });

  it('should render page title and description', () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText(/comprehensive audit log/i)).toBeInTheDocument();
  });

  it('should display statistics grid with counts', () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('Total Changes')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('should show date range filter controls', () => {
    render(<AuditLogsPage />);

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('should render refresh button', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);

    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();

    await user.click(refreshButton);
    expect(auditApi.getLogs).toHaveBeenCalled();
  });

  it('should render export buttons', () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    expect(screen.getByText('Export as JSON')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useAuditLogs as any).mockReturnValue({
      logs: [],
      loading: true,
      error: null,
    });

    render(<AuditLogsPage />);

    expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
  });

  it('should show error state with retry', async () => {
    const mockError = new Error('Failed to fetch logs');
    (useAuditLogs as any).mockReturnValue({
      logs: [],
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    render(<AuditLogsPage />);

    expect(screen.getByText(/failed to load audit logs/i)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display audit table with logs', () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('user_1')).toBeInTheDocument();
    expect(screen.getByText('admin_user')).toBeInTheDocument();
    expect(screen.getByText('relay')).toBeInTheDocument();
  });

  it('should show warning banner for high sensitivity changes', () => {
    render(<AuditLogsPage />);

    const warningBanner = screen.getByRole('alert');
    expect(warningBanner).toBeInTheDocument();
    expect(warningBanner).toHaveClass('high-sensitivity-warning');
  });

  it('should open details modal on log selection', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);

    const firstLog = screen.getByText('relay').closest('tr');
    await user.click(firstLog!);

    expect(
      screen.getByText('Change Details')
    ).toBeInTheDocument();
  });

  it('should apply date range filter', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);

    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, '2025-11-14');

    await waitFor(() => {
      expect(auditApi.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(String),
        })
      );
    });
  });

  it('should handle CSV export', async () => {
    const user = userEvent.setup();
    const exportCSVMock = vi.fn();
    (useAuditLogs as any).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      exportAsCSV: exportCSVMock,
    });

    render(<AuditLogsPage />);

    const exportButton = screen.getByText('Export as CSV');
    await user.click(exportButton);

    expect(exportCSVMock).toHaveBeenCalled();
  });

  it('should handle JSON export', async () => {
    const user = userEvent.setup();
    const exportJSONMock = vi.fn();
    (useAuditLogs as any).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      exportAsJSON: exportJSONMock,
    });

    render(<AuditLogsPage />);

    const exportButton = screen.getByText('Export as JSON');
    await user.click(exportButton);

    expect(exportJSONMock).toHaveBeenCalled();
  });

  it('should be responsive on mobile', () => {
    const { container } = render(<AuditLogsPage />);

    const statsGrid = container.querySelector('.stats-grid');
    expect(statsGrid).toHaveClass('xs-col-1', 'md-col-2', 'lg-col-5');
  });

  it('should display high sensitivity warning', () => {
    render(<AuditLogsPage />);

    const warningCount = screen.getByText(/1 high.sensitivity change/i);
    expect(warningCount).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<AuditLogsPage />);

    const refreshButton = screen.getByText('Refresh');
    refreshButton.focus();

    expect(document.activeElement).toBe(refreshButton);

    await user.keyboard('{Enter}');
    expect(auditApi.getLogs).toHaveBeenCalled();
  });

  it('should show auto-refresh interval control', () => {
    render(<AuditLogsPage />);

    expect(screen.getByDisplayValue('Off')).toBeInTheDocument(); // Auto-refresh dropdown
  });

  it('should display statistics breakdown by action type', () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });
});
