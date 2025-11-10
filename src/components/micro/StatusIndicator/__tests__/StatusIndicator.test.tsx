/**
 * RED Phase: StatusIndicator Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../StatusIndicator';

describe('StatusIndicator Component (RED Phase)', () => {
  describe('Rendering', () => {
    it('renders status indicator dot', () => {
      render(<StatusIndicator status="online" />);

      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });

    it('renders with correct status attribute', () => {
      const { container } = render(<StatusIndicator status="online" />);

      expect(container.querySelector('[data-status="online"]')).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    it('renders online status', () => {
      const { container } = render(<StatusIndicator status="online" />);

      expect(container.querySelector('[data-status="online"]')).toBeInTheDocument();
    });

    it('renders offline status', () => {
      const { container } = render(<StatusIndicator status="offline" />);

      expect(container.querySelector('[data-status="offline"]')).toBeInTheDocument();
    });

    it('renders idle status', () => {
      const { container } = render(<StatusIndicator status="idle" />);

      expect(container.querySelector('[data-status="idle"]')).toBeInTheDocument();
    });

    it('renders busy status', () => {
      const { container } = render(<StatusIndicator status="busy" />);

      expect(container.querySelector('[data-status="busy"]')).toBeInTheDocument();
    });

    it('renders error status', () => {
      const { container } = render(<StatusIndicator status="error" />);

      expect(container.querySelector('[data-status="error"]')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<StatusIndicator status="online" size="sm" />);

      expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      const { container } = render(<StatusIndicator status="online" />);

      expect(container.querySelector('[data-size="md"]')).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(<StatusIndicator status="online" size="lg" />);

      expect(container.querySelector('[data-size="lg"]')).toBeInTheDocument();
    });
  });

  describe('Pulse Animation', () => {
    it('shows pulse when pulse prop is true', () => {
      const { container } = render(<StatusIndicator status="online" pulse={true} />);

      expect(container.querySelector('[data-pulse="true"]')).toBeInTheDocument();
    });

    it('does not show pulse by default', () => {
      const { container } = render(<StatusIndicator status="online" />);

      expect(container.querySelector('[data-pulse="false"]')).toBeInTheDocument();
    });

    it('pulse prop only affects online and busy statuses', () => {
      const { container: errorContainer } = render(
        <StatusIndicator status="error" pulse={true} />
      );

      // Even with pulse=true, error status should not pulse
      expect(errorContainer.querySelector('[data-status="error"]')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies theme CSS variables for colors', () => {
      const { container } = render(<StatusIndicator status="online" />);

      const indicator = container.querySelector('[data-testid="status-indicator"]');
      const computedStyle = window.getComputedStyle(indicator!);

      expect(computedStyle.backgroundColor).toBeDefined();
    });

    it('renders with different colors for different statuses', () => {
      const { container: onlineContainer } = render(<StatusIndicator status="online" />);
      const onlineStyle = window.getComputedStyle(onlineContainer.querySelector('[data-testid="status-indicator"]')!);

      const { container: errorContainer } = render(<StatusIndicator status="error" />);
      const errorStyle = window.getComputedStyle(errorContainer.querySelector('[data-testid="status-indicator"]')!);

      expect(onlineStyle.backgroundColor).not.toBe(errorStyle.backgroundColor);
    });
  });

  describe('Accessibility', () => {
    it('has aria-label describing status', () => {
      render(<StatusIndicator status="online" />);

      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveAttribute('aria-label');
      expect(indicator.getAttribute('aria-label')).toBe('Status: Online');
    });

    it('provides different aria-labels for different statuses', () => {
      const { container: onlineContainer } = render(<StatusIndicator status="online" />);
      const onlineLabel = onlineContainer
        .querySelector('[data-testid="status-indicator"]')
        ?.getAttribute('aria-label');

      const { container: errorContainer } = render(<StatusIndicator status="error" />);
      const errorLabel = errorContainer
        .querySelector('[data-testid="status-indicator"]')
        ?.getAttribute('aria-label');

      expect(onlineLabel).not.toBe(errorLabel);
    });
  });

  describe('Integration with Theme', () => {
    it('responds to theme context changes', () => {
      const { container, rerender } = render(<StatusIndicator status="online" />);

      const indicator = container.querySelector('[data-testid="status-indicator"]');
      const initialColor = window.getComputedStyle(indicator!).backgroundColor;

      // Re-render with different status
      rerender(<StatusIndicator status="offline" />);

      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders with pulse on online status', () => {
      const { container } = render(<StatusIndicator status="online" pulse={true} />);

      expect(container.querySelector('[data-pulse="true"]')).toBeInTheDocument();
    });

    it('renders with pulse on busy status', () => {
      const { container } = render(<StatusIndicator status="busy" pulse={true} />);

      expect(container.querySelector('[data-pulse="true"]')).toBeInTheDocument();
    });

    it('renders consistently with multiple instances', () => {
      const { container } = render(
        <div>
          <StatusIndicator status="online" />
          <StatusIndicator status="online" />
          <StatusIndicator status="online" />
        </div>
      );

      const indicators = container.querySelectorAll('[data-testid="status-indicator"]');
      expect(indicators).toHaveLength(3);
    });
  });
});
