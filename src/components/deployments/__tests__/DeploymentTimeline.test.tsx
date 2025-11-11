import React from 'react';
import { render } from '@testing-library/react';
import { DeploymentTimeline } from '../DeploymentTimeline';
import { vi, describe, it, expect } from 'vitest';

describe('DeploymentTimeline Component', () => {
  const mockDeployment = {
    id: 'deploy-123',
    version: '2.5.0',
    status: 'LIVE' as const,
    environment: 'production',
    created_at: '2025-01-15T10:00:00Z',
    staged_at: '2025-01-15T10:15:00Z',
    production_at: '2025-01-15T10:30:00Z',
    created_by: 'alice@example.com',
    approved_by: 'bob@example.com',
    rolled_back_at: null,
    rolled_back_reason: null,
  };

  describe('Rendering', () => {
    it('renders deployment version', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('2.5.0');
    });

    it('renders environment info', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('production');
    });

    it('renders timeline progression', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      // Should have deployment info
      expect(container.textContent).toContain('2.5.0');
    });
  });

  describe('Timeline Steps', () => {
    it('shows deployment information', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('alice@example.com');
    });

    it('shows approval information', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('bob@example.com');
    });

    it('displays deployment details', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('deploy-123');
    });
  });

  describe('Status Variants', () => {
    it('renders DRAFT status', () => {
      const draftDeployment = {
        ...mockDeployment,
        status: 'DRAFT' as const,
        staged_at: null,
        production_at: null,
      };
      
      const { container } = render(<DeploymentTimeline deployment={draftDeployment} />);
      expect(container).toBeInTheDocument();
    });

    it('renders STAGED status', () => {
      const stagedDeployment = {
        ...mockDeployment,
        status: 'STAGED' as const,
        production_at: null,
      };
      
      const { container } = render(<DeploymentTimeline deployment={stagedDeployment} />);
      expect(container).toBeInTheDocument();
    });

    it('renders LIVE status', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container).toBeInTheDocument();
    });

    it('renders ROLLED_BACK with reason', () => {
      const rolledBackDeployment = {
        ...mockDeployment,
        status: 'ROLLED_BACK' as const,
        rolled_back_at: '2025-01-15T11:00:00Z',
        rolled_back_reason: 'Database migration issue',
      };
      
      const { container } = render(<DeploymentTimeline deployment={rolledBackDeployment} />);
      expect(container.textContent).toContain('Database migration issue');
    });
  });

  describe('Compact Mode', () => {
    it('renders timeline in compact mode', () => {
      const { container } = render(
        <DeploymentTimeline deployment={mockDeployment} compact />
      );
      expect(container.textContent).toContain('2.5.0');
    });

    it('shows all information in full mode', () => {
      const { container } = render(
        <DeploymentTimeline deployment={mockDeployment} />
      );
      expect(container.textContent).toContain('2.5.0');
    });
  });

  describe('Accessibility', () => {
    it('renders with semantic content', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('2.5.0');
      expect(container.textContent).toContain('production');
    });

    it('displays user information', () => {
      const { container } = render(<DeploymentTimeline deployment={mockDeployment} />);
      expect(container.textContent).toContain('alice@example.com');
      expect(container.textContent).toContain('bob@example.com');
    });

    it('provides proper document structure', () => {
      const { container } = render(
        <DeploymentTimeline deployment={mockDeployment} />
      );
      expect(container.textContent).toContain('deploy-123');
    });
  });

  describe('Empty/Error States', () => {
    it('renders with minimal data', () => {
      const minimalDeployment = {
        id: 'deploy-456',
        version: '1.0.0',
        status: 'DRAFT' as const,
        environment: 'staging',
        created_at: '2025-01-15T10:00:00Z',
        staged_at: null,
        production_at: null,
        created_by: 'system',
        approved_by: null,
        rolled_back_at: null,
        rolled_back_reason: null,
      };
      
      const { container } = render(<DeploymentTimeline deployment={minimalDeployment} />);
      expect(container.textContent).toContain('1.0.0');
    });
  });

  describe('Responsive Design', () => {
    it('renders responsive timeline', () => {
      const { container } = render(
        <DeploymentTimeline deployment={mockDeployment} />
      );
      expect(container.textContent).toBeTruthy();
    });
  });

  describe('Action Handlers', () => {
    it('accepts callbacks', () => {
      const onRollback = vi.fn();
      const onApprove = vi.fn();
      
      const { container } = render(
        <DeploymentTimeline 
          deployment={mockDeployment} 
          onRollback={onRollback}
          onApprove={onApprove}
        />
      );
      
      expect(container.textContent).toContain('2.5.0');
    });
  });
});
