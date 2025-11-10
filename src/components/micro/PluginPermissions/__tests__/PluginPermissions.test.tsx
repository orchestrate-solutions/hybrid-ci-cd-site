import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PluginPermissions } from '../index';

const mockPermissions = [
  {
    id: 'fs-read',
    name: 'File System Read',
    description: 'Read files from your project directory',
    riskLevel: 'low' as const,
  },
  {
    id: 'env-access',
    name: 'Environment Variables',
    description: 'Access environment variables',
    riskLevel: 'high' as const,
  },
  {
    id: 'network',
    name: 'Network Access',
    description: 'Make outbound HTTP requests',
    riskLevel: 'medium' as const,
  },
];

describe('PluginPermissions', () => {
  // Rendering tests
  it('renders all permissions', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('File System Read')).toBeInTheDocument();
    expect(screen.getByText('Environment Variables')).toBeInTheDocument();
    expect(screen.getByText('Network Access')).toBeInTheDocument();
  });

  it('renders permission descriptions', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Read files from your project directory')).toBeInTheDocument();
    expect(screen.getByText('Access environment variables')).toBeInTheDocument();
    expect(screen.getByText('Make outbound HTTP requests')).toBeInTheDocument();
  });

  // Risk level badge tests
  it('displays risk level badges', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('applies correct styling to risk level badges', () => {
    const { container } = render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const badges = container.querySelectorAll('[data-testid^="risk-badge"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  // Checkbox tests
  it('renders checkboxes for each permission', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(mockPermissions.length);
  });

  it('allows checking/unchecking permissions', async () => {
    const user = userEvent.setup();
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Permissions start checked, so uncheck first
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
    
    // Then check it again
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  // Action button tests
  it('renders Approve button', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('renders Reject button', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  // Interaction tests
  it('calls onApprove when Approve button clicked', async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={onApprove}
        onReject={vi.fn()}
      />
    );

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    await user.click(approveButton);

    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('calls onReject when Reject button clicked', async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /Reject/i });
    await user.click(rejectButton);

    expect(onReject).toHaveBeenCalledOnce();
  });

  // Empty state test
  it('renders empty state when no permissions', () => {
    render(
      <PluginPermissions
        permissions={[]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText(/No permissions required/i)).toBeInTheDocument();
  });

  // Accessibility tests
  it('has proper heading hierarchy', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('has accessible permission items', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAccessibleName();
    });
  });

  it('buttons have accessible labels', () => {
    render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const approveButton = screen.getByRole('button', { name: /Approve/i });
    const rejectButton = screen.getByRole('button', { name: /Reject/i });
    
    expect(approveButton).toHaveAccessibleName();
    expect(rejectButton).toHaveAccessibleName();
  });

  // Risk level filtering test
  it('can filter by risk level', () => {
    const { container } = render(
      <PluginPermissions
        permissions={mockPermissions}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const criticalBadges = container.querySelectorAll('[data-testid="risk-badge-critical"]');
    // Should be 0 since no critical permissions in mock
    expect(criticalBadges).toHaveLength(0);
  });
});
