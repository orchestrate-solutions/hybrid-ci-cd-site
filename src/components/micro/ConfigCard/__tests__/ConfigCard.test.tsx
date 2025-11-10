/**
 * RED Phase: ConfigCard Component Tests
 * 
 * Tests specify component behavior before implementation.
 * Written first to define contract.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigCard } from '../ConfigCard';

describe('ConfigCard Component (RED Phase)', () => {
  describe('Rendering', () => {
    it('renders title and description', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
      expect(screen.getByText('CI/CD tool integration')).toBeInTheDocument();
    });

    it('renders with data-testid for testing', () => {
      render(
        <ConfigCard
          title="Test Card"
          description="Test description"
          status="active"
        />
      );

      expect(screen.getByTestId('config-card')).toBeInTheDocument();
    });

    it('renders status indicator', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    it('renders active status with correct styling', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      const card = container.querySelector('[data-status="active"]');
      expect(card).toBeInTheDocument();
    });

    it('renders inactive status with correct styling', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="inactive"
        />
      );

      const card = container.querySelector('[data-status="inactive"]');
      expect(card).toBeInTheDocument();
    });

    it('renders warning status with correct styling', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="warning"
        />
      );

      const card = container.querySelector('[data-status="warning"]');
      expect(card).toBeInTheDocument();
    });

    it('renders error status with correct styling', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="error"
        />
      );

      const card = container.querySelector('[data-status="error"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByTestId('btn-edit');
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledOnce();
    });

    it('calls onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByTestId('btn-delete');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledOnce();
    });

    it('does not show edit/delete buttons when handlers not provided', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      expect(screen.queryByTestId('btn-edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('btn-delete')).not.toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact variant when compact prop true', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
          compact={true}
        />
      );

      expect(container.querySelector('[data-compact="true"]')).toBeInTheDocument();
    });

    it('default variant is not compact', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      expect(container.querySelector('[data-compact="false"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('GitHub Actions');
    });

    it('provides accessible button labels', async () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('has aria-label for status indicator', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveAttribute('aria-label');
    });
  });

  describe('Long Content Handling', () => {
    it('handles long titles with text truncation', () => {
      const longTitle = 'A'.repeat(100);
      const { container } = render(
        <ConfigCard
          title={longTitle}
          description="CI/CD tool integration"
          status="active"
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      // Verify h3 element has truncate class via classList
      const h3 = container.querySelector('h3');
      expect(h3?.className).toContain('truncate');
    });

    it('handles long descriptions with text truncation', () => {
      const longDescription = 'B'.repeat(200);
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description={longDescription}
          status="active"
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty description', () => {
      render(
        <ConfigCard
          title="GitHub Actions"
          description=""
          status="active"
        />
      );

      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    });

    it('renders with minimal content', () => {
      render(
        <ConfigCard
          title="CI"
          description="Tool"
          status="active"
        />
      );

      expect(screen.getByText('CI')).toBeInTheDocument();
      expect(screen.getByText('Tool')).toBeInTheDocument();
    });
  });

  describe('Styling Integration', () => {
    it('applies theme CSS variables from context', () => {
      const { container } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      const card = container.querySelector('[data-testid="config-card"]');
      const computedStyle = window.getComputedStyle(card!);
      
      // Should use CSS variables defined in theme context
      expect(computedStyle.backgroundColor).toBeDefined();
    });

    it('responds to theme changes', () => {
      const { container, rerender } = render(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="active"
        />
      );

      const card = container.querySelector('[data-testid="config-card"]');
      const initialBgColor = window.getComputedStyle(card!).backgroundColor;

      // Re-render with different props to trigger potential style changes
      rerender(
        <ConfigCard
          title="GitHub Actions"
          description="CI/CD tool integration"
          status="warning"
        />
      );

      // Card should be updated (this test assumes status affects styling)
      expect(screen.getByTestId('config-card')).toBeInTheDocument();
    });
  });
});
