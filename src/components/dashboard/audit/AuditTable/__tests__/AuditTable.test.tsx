import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditTable from '../AuditTable';

describe('AuditTable', () => {
  const mockLogs = [
    {
      id: 'audit_1',
      timestamp: '2025-11-14T10:00:00Z',
      user_id: 'user_1',
      action: 'create',
      resource_type: 'relay',
      resource_id: 'relay_1',
      before: null,
      after: { name: 'my-relay' },
      sensitivity: 'low',
    },
    {
      id: 'audit_2',
      timestamp: '2025-11-14T09:00:00Z',
      user_id: 'admin_user',
      action: 'delete',
      resource_type: 'webhook',
      resource_id: 'webhook_1',
      before: { url: 'https://example.com/webhook' },
      after: null,
      sensitivity: 'high',
    },
  ];

  it('should render audit table with headers', () => {
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Resource')).toBeInTheDocument();
  });

  it('should display all audit logs', () => {
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    expect(screen.getByText('user_1')).toBeInTheDocument();
    expect(screen.getByText('admin_user')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.getByText('delete')).toBeInTheDocument();
  });

  it('should call onSelectLog when row clicked', async () => {
    const onSelectLog = vi.fn();
    render(<AuditTable logs={mockLogs} onSelectLog={onSelectLog} />);

    const firstRow = screen.getByText('create').closest('tr');
    await userEvent.click(firstRow!);

    expect(onSelectLog).toHaveBeenCalledWith(mockLogs[0]);
  });

  it('should show loading state', () => {
    render(<AuditTable logs={[]} loading={true} onSelectLog={vi.fn()} />);

    expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
  });

  it('should show empty state when no logs', () => {
    render(<AuditTable logs={[]} onSelectLog={vi.fn()} />);

    expect(screen.getByText('No audit logs found')).toBeInTheDocument();
  });

  it('should filter logs by action', async () => {
    const user = userEvent.setup();
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const actionFilter = screen.getByDisplayValue('All Actions');
    await user.click(actionFilter);
    await user.click(screen.getByText('Create'));

    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.queryByText('delete')).not.toBeInTheDocument();
  });

  it('should filter logs by resource type', async () => {
    const user = userEvent.setup();
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const typeFilter = screen.getByDisplayValue('All Resources');
    await user.click(typeFilter);
    await user.click(screen.getByText('Relay'));

    expect(screen.getByText('relay')).toBeInTheDocument();
    expect(screen.queryByText('webhook')).not.toBeInTheDocument();
  });

  it('should filter logs by sensitivity level', async () => {
    const user = userEvent.setup();
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const sensitivityFilter = screen.getByDisplayValue('All Levels');
    await user.click(sensitivityFilter);
    await user.click(screen.getByText('High'));

    // Only high sensitivity log should show
    expect(screen.getByText('admin_user')).toBeInTheDocument();
    expect(screen.queryByText('user_1')).not.toBeInTheDocument();
  });

  it('should search logs', async () => {
    const user = userEvent.setup();
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search logs...');
    await user.type(searchInput, 'webhook');

    expect(screen.getByText('webhook')).toBeInTheDocument();
    expect(screen.queryByText('relay')).not.toBeInTheDocument();
  });

  it('should sort logs by column', async () => {
    const user = userEvent.setup();
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const timestampHeader = screen.getByText('Timestamp');
    await user.click(timestampHeader);

    // After sort, order should reverse
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('2025-11-14T09:00:00Z')).toBeInTheDocument();
  });

  it('should highlight sensitive changes', () => {
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const sensitiveRow = screen.getByText('admin_user').closest('tr');
    expect(sensitiveRow).toHaveClass('sensitive-row');
  });

  it('should show color-coded action badges', () => {
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    const createBadge = screen.getByText('create');
    expect(createBadge).toHaveClass('action-create');

    const deleteBadge = screen.getByText('delete');
    expect(deleteBadge).toHaveClass('action-delete');
  });

  it('should handle pagination', () => {
    const manyLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `audit_${i}`,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      user_id: 'user',
      action: i % 2 === 0 ? 'create' : 'update',
      resource_type: 'relay',
      resource_id: `relay_${i}`,
      before: null,
      after: {},
      sensitivity: 'low',
    }));

    render(
      <AuditTable logs={manyLogs} itemsPerPage={10} onSelectLog={vi.fn()} />
    );

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should show resource ID in details', () => {
    render(<AuditTable logs={mockLogs} onSelectLog={vi.fn()} />);

    expect(screen.getByText('relay_1')).toBeInTheDocument();
    expect(screen.getByText('webhook_1')).toBeInTheDocument();
  });
});
