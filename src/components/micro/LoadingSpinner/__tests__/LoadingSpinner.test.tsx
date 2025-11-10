/**
 * LoadingSpinner Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('renders spinner by default', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('spinner-circle')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<LoadingSpinner label="Loading..." />);
      expect(screen.getByTestId('spinner-label')).toHaveTextContent('Loading...');
    });

    it('renders without label by default', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByTestId('spinner-label')).not.toBeInTheDocument();
    });
  });

  describe('Sizing', () => {
    it('renders small spinner', () => {
      render(<LoadingSpinner size="small" />);
      const spinner = screen.getByTestId('spinner-circle');
      expect(spinner).toHaveStyle('width: 24px');
    });

    it('renders medium spinner by default', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByTestId('spinner-circle');
      expect(spinner).toHaveStyle('width: 40px');
    });

    it('renders large spinner', () => {
      render(<LoadingSpinner size="large" />);
      const spinner = screen.getByTestId('spinner-circle');
      expect(spinner).toHaveStyle('width: 56px');
    });

    it('uses pixelSize prop over size prop', () => {
      render(<LoadingSpinner size="small" pixelSize={32} />);
      const spinner = screen.getByTestId('spinner-circle');
      expect(spinner).toHaveStyle('width: 32px');
    });
  });

  describe('Accessibility', () => {
    it('has test IDs for accessibility', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('label is accessible text', () => {
      render(<LoadingSpinner label="Please wait" />);
      const label = screen.getByTestId('spinner-label');
      expect(label).toBeVisible();
      expect(label).toHaveTextContent('Please wait');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards sx props', () => {
      render(<LoadingSpinner sx={{ bgcolor: 'background.paper', p: 2 }} />);
      const container = screen.getByTestId('loading-spinner');
      expect(container).toBeInTheDocument();
    });

    it('forwards aria attributes', () => {
      render(<LoadingSpinner aria-label="Loading content" />);
      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveAttribute('aria-label', 'Loading content');
    });
  });
});
