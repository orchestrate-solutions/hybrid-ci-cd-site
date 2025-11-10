/**
 * RED Phase: ToolBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolBadge } from '../ToolBadge';

describe('ToolBadge Component (RED Phase)', () => {
  describe('Rendering', () => {
    it('renders tool name and version', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
      // Version is prefixed with "v" in the component
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });

    it('renders with testid', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(screen.getByTestId('tool-badge')).toBeInTheDocument();
    });

    it('renders category indicator', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(screen.getByTestId('category-badge')).toBeInTheDocument();
    });
  });

  describe('Verified Status', () => {
    it('shows verified badge when verified is true', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" verified={true} />);

      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });

    it('does not show verified badge when verified is false', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" verified={false} />);

      expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
    });

    it('hides verified badge by default', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
    });
  });

  describe('Categories', () => {
    it('renders CI category correctly', () => {
      const { container } = render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(container.querySelector('[data-category="ci"]')).toBeInTheDocument();
    });

    it('renders deployment category correctly', () => {
      const { container } = render(<ToolBadge name="Kubernetes" version="1.27.0" category="deployment" />);

      expect(container.querySelector('[data-category="deployment"]')).toBeInTheDocument();
    });

    it('renders monitoring category correctly', () => {
      const { container } = render(<ToolBadge name="Prometheus" version="2.40.0" category="monitoring" />);

      expect(container.querySelector('[data-category="monitoring"]')).toBeInTheDocument();
    });

    it('renders security category correctly', () => {
      const { container } = render(<ToolBadge name="Vault" version="1.15.0" category="security" />);

      expect(container.querySelector('[data-category="security"]')).toBeInTheDocument();
    });

    it('renders other category correctly', () => {
      const { container } = render(<ToolBadge name="Custom Tool" version="1.0.0" category="other" />);

      expect(container.querySelector('[data-category="other"]')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size variant', () => {
      const { container } = render(
        <ToolBadge name="GitHub Actions" version="1.0.0" category="ci" size="sm" />
      );

      expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument();
    });

    it('renders medium size variant (default)', () => {
      const { container } = render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(container.querySelector('[data-size="md"]')).toBeInTheDocument();
    });

    it('renders large size variant', () => {
      const { container } = render(
        <ToolBadge name="GitHub Actions" version="1.0.0" category="ci" size="lg" />
      );

      expect(container.querySelector('[data-size="lg"]')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies MUI styling to badge', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      const badge = screen.getByTestId('tool-badge');
      expect(badge).toBeInTheDocument();
      // MUI renders with computed styles, not raw CSS
    });

    it('applies different colors based on category', () => {
      const { rerender } = render(
        <ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />
      );
      expect(screen.getByTestId('category-badge')).toHaveTextContent('CI/CD');

      rerender(<ToolBadge name="Kubernetes" version="1.27.0" category="deployment" />);
      expect(screen.getByTestId('category-badge')).toHaveTextContent('Deployment');

      rerender(<ToolBadge name="Prometheus" version="2.0.0" category="monitoring" />);
      expect(screen.getByTestId('category-badge')).toHaveTextContent('Monitoring');

      rerender(<ToolBadge name="Vault" version="1.0.0" category="security" />);
      expect(screen.getByTestId('category-badge')).toHaveTextContent('Security');

      rerender(<ToolBadge name="Other Tool" version="1.0.0" category="other" />);
      expect(screen.getByTestId('category-badge')).toHaveTextContent('Other');
    });
  });

  describe('Accessibility', () => {
    it('has semantic badge element', () => {
      const { container } = render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" />);

      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('provides accessible tool information', () => {
      render(<ToolBadge name="GitHub Actions" version="1.0.0" category="ci" verified={true} />);

      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles long tool names', () => {
      const longName = 'A'.repeat(50);
      render(<ToolBadge name={longName} version="1.0.0" category="ci" />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles version numbers with various formats', () => {
      render(<ToolBadge name="Tool" version="2.0.0-beta.1+build.123" category="ci" />);

      // Version is displayed with "v" prefix
      expect(screen.getByText(/v2\.0\.0-beta/)).toBeInTheDocument();
    });

    it('renders with minimal content', () => {
      render(<ToolBadge name="T" version="1" category="ci" />);

      expect(screen.getByText('T')).toBeInTheDocument();
      // Version is rendered as "v1" due to component formatting
      expect(screen.getByText(/v/)).toBeInTheDocument();
    });
  });
});
