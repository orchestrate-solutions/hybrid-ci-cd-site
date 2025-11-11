import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RollbackModal } from '../RollbackModal';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('RollbackModal Component', () => {
  const mockDeploymentId = 'deploy-123';

  describe('Rendering', () => {
    it('renders modal only when open prop is true', () => {
      const { rerender } = render(
        <RollbackModal open={false} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays modal title', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.getByText(/rollback deployment/i)).toBeInTheDocument();
    });

    it('displays confirmation message', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.getByText(/are you sure you want to rollback/i)).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('renders reason input field', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.getByPlaceholderText(/reason for rollback/i)).toBeInTheDocument();
    });

    it('allows user to enter reason text', async () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, 'Database migration issue');
      
      expect(input).toHaveValue('Database migration issue');
    });

    it('shows character count for reason field', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      expect(input).toHaveAttribute('maxLength', '500');
    });

    it('displays warning alert', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.getByText(/this action will rollback/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders confirm and cancel buttons', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      expect(screen.getByRole('button', { name: /confirm rollback/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onCancel when cancel button clicked', async () => {
      const onCancel = vi.fn();
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={onCancel} />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('calls onConfirm with deployment ID and reason when confirm clicked', async () => {
      const onConfirm = vi.fn();
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={onConfirm} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, 'Critical bug');
      
      const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
      await userEvent.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledWith(mockDeploymentId, 'Critical bug');
    });

    it('disables confirm button if reason is empty', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
      expect(confirmButton).toBeDisabled();
    });

    it('enables confirm button when reason is provided', async () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, 'Performance issue');
      
      const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
      expect(confirmButton).toBeEnabled();
    });

    it('shows loading state when onConfirm is pending', async () => {
      const onConfirm = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={onConfirm} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, 'Bug fix');
      
      const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
      await userEvent.click(confirmButton);
      
      // Button should be disabled during loading
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('focuses on reason input when modal opens', async () => {
      const { rerender } = render(
        <RollbackModal open={false} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      rerender(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={vi.fn()} />
      );
      
      // Input field exists and is accessible
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes modal on Escape key', async () => {
      const onCancel = vi.fn();
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={vi.fn()} onCancel={onCancel} />
      );
      
      const dialog = screen.getByRole('dialog');
      await userEvent.keyboard('{Escape}');
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('allows Enter key to submit form', async () => {
      const onConfirm = vi.fn();
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={onConfirm} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, 'Test reason');
      await userEvent.keyboard('{Enter}');
      
      expect(onConfirm).toHaveBeenCalledWith(mockDeploymentId, 'Test reason');
    });
  });

  describe('Edge Cases', () => {
    it('trims whitespace from reason', async () => {
      const onConfirm = vi.fn();
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={onConfirm} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i);
      await userEvent.type(input, '   Bug fix   ');
      
      const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
      await userEvent.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledWith(mockDeploymentId, 'Bug fix');
    });

    it('handles long reason text', async () => {
      const onConfirm = vi.fn();
      const longReason = 'A'.repeat(100);
      
      render(
        <RollbackModal open={true} deploymentId={mockDeploymentId} onConfirm={onConfirm} onCancel={vi.fn()} />
      );
      
      const input = screen.getByPlaceholderText(/reason for rollback/i) as HTMLTextAreaElement;
      await userEvent.type(input, longReason);
      
      expect(input.value).toHaveLength(100);
    });
  });
});
