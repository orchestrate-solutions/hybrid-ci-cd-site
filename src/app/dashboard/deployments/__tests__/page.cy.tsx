import React from 'react';
import { mount } from 'cypress/react';
import { DeploymentsPage } from '../page';
import * as deploymentsApi from '@/lib/api/deployments';

// Mock the deployments API
vi.mock('@/lib/api/deployments');

describe('DeploymentsPage Component', () => {
  const mockDeployments = [
    {
      id: 'deploy-1',
      name: 'Production v2.0',
      status: 'ACTIVE' as const,
      version: '2.0.0',
      environment: 'production' as const,
      created_at: new Date().toISOString(),
      rollback_available: true,
    },
    {
      id: 'deploy-2',
      name: 'Staging v2.0-rc1',
      status: 'DEPLOYING' as const,
      version: '2.0.0-rc1',
      environment: 'staging' as const,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      rollback_available: false,
    },
    {
      id: 'deploy-3',
      name: 'Development v2.0-beta',
      status: 'FAILED' as const,
      version: '2.0.0-beta',
      environment: 'development' as const,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      rollback_available: true,
    },
  ];

  beforeEach(() => {
    vi.mocked(deploymentsApi.listDeployments).mockResolvedValue(mockDeployments);
  });

  describe('Rendering', () => {
    it('renders page header', () => {
      mount(<DeploymentsPage />);
      cy.contains('h1', 'Deployments').should('be.visible');
    });

    it('renders deployment cards/table', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="deployments-list"]').should('exist');
    });

    it('displays all deployment columns/fields', () => {
      mount(<DeploymentsPage />);
      cy.contains('Environment').should('be.visible');
      cy.contains('Version').should('be.visible');
      cy.contains('Status').should('be.visible');
    });

    it('renders action buttons', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').should('exist');
      cy.contains('button', 'Refresh').should('exist');
    });
  });

  describe('Data Display', () => {
    it('displays all deployments', () => {
      mount(<DeploymentsPage />);
      cy.contains('Production v2.0').should('be.visible');
      cy.contains('Staging v2.0-rc1').should('be.visible');
      cy.contains('Development v2.0-beta').should('be.visible');
    });

    it('shows deployment status', () => {
      mount(<DeploymentsPage />);
      cy.contains('ACTIVE').should('be.visible');
      cy.contains('DEPLOYING').should('be.visible');
      cy.contains('FAILED').should('be.visible');
    });

    it('displays environment name', () => {
      mount(<DeploymentsPage />);
      cy.contains('production').should('be.visible');
      cy.contains('staging').should('be.visible');
      cy.contains('development').should('be.visible');
    });

    it('shows version number', () => {
      mount(<DeploymentsPage />);
      cy.contains('2.0.0').should('be.visible');
      cy.contains('2.0.0-rc1').should('be.visible');
      cy.contains('2.0.0-beta').should('be.visible');
    });
  });

  describe('Status Indicators', () => {
    it('renders ACTIVE status with success color', () => {
      mount(<DeploymentsPage />);
      cy.contains('Production v2.0').parent().contains('ACTIVE').should('have.class', 'MuiChip-colorSuccess');
    });

    it('renders DEPLOYING status with warning color', () => {
      mount(<DeploymentsPage />);
      cy.contains('Staging v2.0-rc1').parent().contains('DEPLOYING').should('have.class', 'MuiChip-colorWarning');
    });

    it('renders FAILED status with error color', () => {
      mount(<DeploymentsPage />);
      cy.contains('Development v2.0-beta').parent().contains('FAILED').should('have.class', 'MuiChip-colorError');
    });

    it('shows progress bar for DEPLOYING status', () => {
      mount(<DeploymentsPage />);
      cy.contains('Staging v2.0-rc1').parent().get('[data-testid="progress-bar"]').should('exist');
    });
  });

  describe('Environment Filtering', () => {
    it('filters by production environment', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').click();
      cy.contains('Production').click();
      cy.contains('Production v2.0').should('be.visible');
      cy.contains('Staging v2.0-rc1').should('not.be.visible');
    });

    it('filters by staging environment', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').click();
      cy.contains('Staging').click();
      cy.contains('Staging v2.0-rc1').should('be.visible');
      cy.contains('Production v2.0').should('not.be.visible');
    });

    it('filters by development environment', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').click();
      cy.contains('Development').click();
      cy.contains('Development v2.0-beta').should('be.visible');
      cy.contains('Production v2.0').should('not.be.visible');
    });

    it('can select multiple environments', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').click();
      cy.contains('Production').click();
      cy.contains('Staging').click();
      cy.contains('Production v2.0').should('be.visible');
      cy.contains('Staging v2.0-rc1').should('be.visible');
      cy.contains('Development v2.0-beta').should('not.be.visible');
    });
  });

  describe('Status Filtering', () => {
    it('filters by ACTIVE status', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('ACTIVE').click();
      cy.contains('Production v2.0').should('be.visible');
    });

    it('filters by DEPLOYING status', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('DEPLOYING').click();
      cy.contains('Staging v2.0-rc1').should('be.visible');
    });

    it('can select multiple statuses', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('ACTIVE').click();
      cy.contains('FAILED').click();
      cy.contains('Production v2.0').should('be.visible');
      cy.contains('Development v2.0-beta').should('be.visible');
    });
  });

  describe('Deployment Actions', () => {
    it('can rollback active deployment', () => {
      mount(<DeploymentsPage />);
      cy.contains('Production v2.0').parent().contains('button', 'Rollback').click();
      cy.wrap(deploymentsApi.rollbackDeployment).should('have.been.called');
    });

    it('disables rollback for deployments without rollback available', () => {
      mount(<DeploymentsPage />);
      cy.contains('Staging v2.0-rc1').parent().contains('button', 'Rollback').should('be.disabled');
    });

    it('can cancel a deploying deployment', () => {
      mount(<DeploymentsPage />);
      cy.contains('Staging v2.0-rc1').parent().contains('button', 'Cancel').click();
      cy.wrap(deploymentsApi.cancelDeployment).should('have.been.called');
    });

    it('can retry a failed deployment', () => {
      mount(<DeploymentsPage />);
      cy.contains('Development v2.0-beta').parent().contains('button', 'Retry').click();
      cy.wrap(deploymentsApi.retryDeployment).should('have.been.called');
    });

    it('can view deployment details', () => {
      mount(<DeploymentsPage />);
      cy.contains('Production v2.0').parent().contains('button', 'View Details').click();
      cy.contains('Deployment Details').should('be.visible');
    });
  });

  describe('Create Deployment', () => {
    it('opens create deployment dialog', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').click();
      cy.contains('Create New Deployment').should('be.visible');
    });

    it('has version input field', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').click();
      cy.get('input[placeholder="Version"]').should('exist');
    });

    it('has environment selector', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').click();
      cy.get('select[name="environment"]').should('exist');
    });

    it('submits deployment creation form', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').click();
      cy.get('input[placeholder="Version"]').type('2.0.1');
      cy.get('select[name="environment"]').select('staging');
      cy.contains('button', 'Deploy').click();
      cy.wrap(deploymentsApi.createDeployment).should('have.been.called');
    });

    it('shows validation errors for required fields', () => {
      mount(<DeploymentsPage />);
      cy.contains('button', 'New Deployment').click();
      cy.contains('button', 'Deploy').click();
      cy.contains('Version is required').should('be.visible');
      cy.contains('Environment is required').should('be.visible');
    });
  });

  describe('Deployment Timeline', () => {
    it('displays deployment history', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="deployment-timeline"]').should('exist');
    });

    it('shows timeline events in chronological order', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="timeline-event"]').eq(0).should('contain', 'Created');
      cy.get('[data-testid="timeline-event"]').eq(1).should('contain', 'Deployed');
    });

    it('displays deployment status changes', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="timeline-event"]').should('contain', 'Status changed');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no deployments', () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue([]);
      mount(<DeploymentsPage />);
      cy.contains('No deployments').should('be.visible');
    });

    it('shows create deployment button in empty state', () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue([]);
      mount(<DeploymentsPage />);
      cy.contains('button', 'Deploy Now').should('be.visible');
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching', () => {
      vi.mocked(deploymentsApi.listDeployments).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDeployments), 500))
      );
      mount(<DeploymentsPage />);
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on failed load', () => {
      vi.mocked(deploymentsApi.listDeployments).mockRejectedValue(
        new Error('Failed to load deployments')
      );
      mount(<DeploymentsPage />);
      cy.contains('Failed to load deployments').should('be.visible');
    });

    it('shows retry button', () => {
      vi.mocked(deploymentsApi.listDeployments).mockRejectedValue(new Error('Network error'));
      mount(<DeploymentsPage />);
      cy.contains('button', 'Retry').should('exist');
    });
  });

  describe('Auto-refresh', () => {
    it('auto-refreshes deployment list', () => {
      mount(<DeploymentsPage />);
      // Should refresh every 30 seconds
      cy.wait(30000);
      cy.wrap(deploymentsApi.listDeployments).should('have.been.called');
    });

    it('updates deployment status in real-time', () => {
      const TestComponent = () => {
        const [deployments, setDeployments] = React.useState(mockDeployments);
        return (
          <>
            <DeploymentsPage />
            <button
              onClick={() => {
                setDeployments([
                  { ...deployments[1], status: 'ACTIVE' as const },
                  ...deployments.slice(2),
                ]);
              }}
            >
              Simulate Completion
            </button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').click();
      // Status should update in UI
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      mount(<DeploymentsPage />);
      cy.get('h1').should('contain', 'Deployments');
    });

    it('has accessible environment filter', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').should('have.attr', 'role', 'button');
    });

    it('has accessible status filter', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="status-filter"]').should('have.attr', 'role', 'button');
    });

    it('action buttons are keyboard accessible', () => {
      mount(<DeploymentsPage />);
      cy.contains('Production v2.0').parent().contains('button', 'Rollback').focus();
      cy.focused().should('be', 'button');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long version strings', () => {
      const longVersionDeploy = {
        ...mockDeployments[0],
        version: '2.0.0-alpha+build.12345.67890.abcdef123456',
      };
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue([longVersionDeploy]);
      mount(<DeploymentsPage />);
      cy.contains('2.0.0-alpha').should('be.visible');
    });

    it('handles deployments with same version in different environments', () => {
      const sameVersionDeploys = [
        mockDeployments[0],
        { ...mockDeployments[1], version: '2.0.0' },
      ];
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue(sameVersionDeploys);
      mount(<DeploymentsPage />);
      cy.contains('2.0.0').should('have.length', 2);
    });

    it('maintains filter state after refresh', () => {
      mount(<DeploymentsPage />);
      cy.get('[data-testid="env-filter"]').click();
      cy.contains('Production').click();
      cy.contains('button', 'Refresh').click();
      cy.contains('Production v2.0').should('be.visible');
      cy.contains('Staging v2.0-rc1').should('not.be.visible');
    });

    it('handles rapid deployment updates', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <DeploymentsPage />
            <button onClick={() => setCount(count + 1)}>Update: {count}</button>
          </>
        );
      };
      mount(<TestComponent />);
      for (let i = 0; i < 5; i++) {
        cy.get('button').click();
      }
      cy.contains('Production v2.0').should('be.visible');
    });
  });
});
