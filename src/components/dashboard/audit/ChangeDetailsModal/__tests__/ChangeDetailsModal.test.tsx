import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeDetailsModal from '../ChangeDetailsModal';

describe('ChangeDetailsModal', () => {
  const mockLog = {
    id: 'audit_1',
    timestamp: '2025-11-14T10:00:00Z',
    user_id: 'user_1',
    user_email: 'user@example.com',
    action: 'create',
    resource_type: 'relay',
    resource_id: 'relay_1',
    before: null,
    after: {
      name: 'prod-relay',
      description: 'Production relay',
      url: 'https://internal.example.com/relay',
    },
    sensitivity: 'low',
  };

  const sensitiveLog = {
    id: 'audit_2',
    timestamp: '2025-11-14T09:00:00Z',
    user_id: 'admin_user',
    user_email: 'admin@example.com',
    action: 'update',
    resource_type: 'webhook',
    resource_id: 'webhook_1',
    before: {
      api_key: 'sk_test_abc123def456',
      secret: 'webhook_secret_xyz789',
      password: 'old_password_here',
    },
    after: {
      api_key: 'sk_test_new_abc123',
      secret: 'webhook_new_secret_xyz',
      password: 'new_password_here',
    },
    sensitivity: 'high',
  };

  it('should render modal with audit log details', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Change Details')).toBeInTheDocument();
    expect(screen.getByText('prod-relay')).toBeInTheDocument();
  });

  it('should display user and timestamp info', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('2025-11-14T10:00:00Z')).toBeInTheDocument();
  });

  it('should show action badge', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    const badge = screen.getByText('create');
    expect(badge).toHaveClass('action-create');
  });

  it('should show sensitivity indicator', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should display before and after values', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getByText('prod-relay')).toBeInTheDocument();
  });

  it('should redact sensitive fields', () => {
    render(
      <ChangeDetailsModal
        log={sensitiveLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    // Sensitive fields should be redacted (masked)
    expect(screen.queryByText('sk_test_abc123def456')).not.toBeInTheDocument();
    expect(screen.queryByText('webhook_secret_xyz789')).not.toBeInTheDocument();
    expect(screen.queryByText('old_password_here')).not.toBeInTheDocument();

    // Should show redaction placeholders
    expect(screen.getAllByText(/\*\*\*/)).toHaveLength(6); // 3 sensitive fields × 2 (before + after)
  });

  it('should mark redacted fields with warning icon', () => {
    render(
      <ChangeDetailsModal
        log={sensitiveLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    const redactedWarnings = screen.getAllByTestId('redacted-icon');
    expect(redactedWarnings.length).toBeGreaterThan(0);
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <ChangeDetailsModal
        log={mockLog}
        open={false}
        onClose={vi.fn()}
      />
    );

    expect(container.querySelector('.modal')).not.toBeInTheDocument();
  });

  it('should show JSON export button', async () => {
    const user = userEvent.setup();
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    const exportButton = screen.getByText('Export as JSON');
    expect(exportButton).toBeInTheDocument();

    // Mock clipboard API
    const writeText = vi.fn();
    global.navigator.clipboard = { writeText } as any;

    await user.click(exportButton);
    expect(writeText).toHaveBeenCalled();
  });

  it('should show resource type and ID', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('relay')).toBeInTheDocument();
    expect(screen.getByText('relay_1')).toBeInTheDocument();
  });

  it('should handle null before value for create actions', () => {
    render(
      <ChangeDetailsModal
        log={mockLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle null after value for delete actions', () => {
    const deleteLog = {
      ...mockLog,
      action: 'delete',
      before: mockLog.after,
      after: null,
    };

    render(
      <ChangeDetailsModal
        log={deleteLog}
        open={true}
        onClose={vi.fn()}
      />
    );

    const afters = screen.getAllByText('N/A');
    expect(afters.length).toBeGreaterThan(0);
  });
});
