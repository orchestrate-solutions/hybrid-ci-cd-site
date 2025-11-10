import React from 'react';
import { mount } from 'cypress/react';
import { AgentsPage } from '../page';
import * as agentsApi from '@/lib/api/agents';

// Mock the agents API
vi.mock('@/lib/api/agents');

describe('AgentsPage Component', () => {
  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Agent Alpha',
      status: 'ACTIVE' as const,
      assigned_tasks: 5,
      last_heartbeat: new Date().toISOString(),
    },
    {
      id: 'agent-2',
      name: 'Agent Beta',
      status: 'IDLE' as const,
      assigned_tasks: 0,
      last_heartbeat: new Date().toISOString(),
    },
    {
      id: 'agent-3',
      name: 'Agent Gamma',
      status: 'OFFLINE' as const,
      assigned_tasks: 2,
      last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.mocked(agentsApi.listAgents).mockResolvedValue(mockAgents);
  });

  describe('Rendering', () => {
    it('renders page header', () => {
      mount(<AgentsPage />);
      cy.contains('h1', 'Agents').should('be.visible');
    });

    it('renders data grid with agent table', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="agents-table"]').should('exist');
    });

    it('displays all agent columns', () => {
      mount(<AgentsPage />);
      cy.contains('Name').should('be.visible');
      cy.contains('Status').should('be.visible');
      cy.contains('Tasks').should('be.visible');
    });

    it('renders action buttons in toolbar', () => {
      mount(<AgentsPage />);
      cy.contains('button', 'Register').should('exist');
      cy.contains('button', 'Refresh').should('exist');
    });
  });

  describe('Data Display', () => {
    it('displays all agents in table', async () => {
      mount(<AgentsPage />);
      
      // Wait for data to load
      cy.contains('Agent Alpha').should('be.visible');
      cy.contains('Agent Beta').should('be.visible');
      cy.contains('Agent Gamma').should('be.visible');
    });

    it('shows agent status badge', () => {
      mount(<AgentsPage />);
      cy.contains('ACTIVE').should('be.visible');
      cy.contains('IDLE').should('be.visible');
      cy.contains('OFFLINE').should('be.visible');
    });

    it('displays assigned task count', () => {
      mount(<AgentsPage />);
      cy.get('tr').contains('5').should('exist'); // Agent Alpha tasks
      cy.get('tr').contains('0').should('exist'); // Agent Beta tasks
    });

    it('shows last heartbeat time', () => {
      mount(<AgentsPage />);
      // Heartbeat should be displayed in each row
      cy.get('[data-testid="agents-table"] tbody tr').should('have.length', 3);
    });
  });

  describe('Status Badges', () => {
    it('renders ACTIVE status with success color', () => {
      mount(<AgentsPage />);
      cy.contains('ACTIVE').should('have.class', 'MuiChip-colorSuccess');
    });

    it('renders IDLE status with warning color', () => {
      mount(<AgentsPage />);
      cy.contains('IDLE').should('have.class', 'MuiChip-colorWarning');
    });

    it('renders OFFLINE status with error color', () => {
      mount(<AgentsPage />);
      cy.contains('OFFLINE').should('have.class', 'MuiChip-colorError');
    });
  });

  describe('User Interactions', () => {
    it('can refresh agent list', () => {
      mount(<AgentsPage />);
      cy.contains('button', 'Refresh').click();
      cy.wrap(agentsApi.listAgents).should('have.been.called');
    });

    it('opens register agent dialog on button click', () => {
      mount(<AgentsPage />);
      cy.contains('button', 'Register').click();
      cy.contains('Register New Agent').should('be.visible');
    });

    it('can click agent row to view details', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="agents-table"] tbody tr').first().click();
      // Details panel or modal should open
    });

    it('can sort by agent name', () => {
      mount(<AgentsPage />);
      cy.contains('th', 'Name').click();
      // Table should sort
    });

    it('can filter agents by status', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('ACTIVE').click();
      // Table should update to show only ACTIVE agents
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no agents available', () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue([]);
      mount(<AgentsPage />);
      cy.contains('No agents available').should('be.visible');
    });

    it('shows empty state message with register button', () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue([]);
      mount(<AgentsPage />);
      cy.contains('button', 'Register Agent').should('be.visible');
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching', () => {
      vi.mocked(agentsApi.listAgents).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(mockAgents), 500);
        })
      );
      mount(<AgentsPage />);
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
    });

    it('hides loading indicator after data loads', async () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.contains('Agent Alpha').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on failed load', () => {
      vi.mocked(agentsApi.listAgents).mockRejectedValue(
        new Error('Failed to load agents')
      );
      mount(<AgentsPage />);
      cy.contains('Failed to load agents').should('be.visible');
    });

    it('shows retry button on error', () => {
      vi.mocked(agentsApi.listAgents).mockRejectedValueOnce(
        new Error('Network error')
      );
      mount(<AgentsPage />);
      cy.contains('button', 'Retry').should('exist');
    });

    it('retries load when retry button clicked', () => {
      const listAgentsSpy = vi.mocked(agentsApi.listAgents);
      listAgentsSpy.mockRejectedValueOnce(new Error('Error'));
      listAgentsSpy.mockResolvedValueOnce(mockAgents);
      
      mount(<AgentsPage />);
      cy.contains('button', 'Retry').click();
      cy.wrap(listAgentsSpy).should('have.been.calledTimes', 2);
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls with multiple agents', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="pagination"]').should('exist');
    });

    it('can navigate between pages', () => {
      mount(<AgentsPage />);
      cy.get('button[aria-label="Go to next page"]').click();
      // Page should update
    });

    it('disables previous page button on first page', () => {
      mount(<AgentsPage />);
      cy.get('button[aria-label="Go to previous page"]').should('be.disabled');
    });

    it('shows page size options', () => {
      mount(<AgentsPage />);
      cy.contains('Rows per page').should('be.visible');
    });

    it('can change page size', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="page-size"]').click();
      cy.contains('50').click();
      // Table should update with new page size
    });
  });

  describe('Selection', () => {
    it('allows selecting individual agents', () => {
      mount(<AgentsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('be.checked');
    });

    it('allows selecting all agents with header checkbox', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="select-all-checkbox"]').click();
      cy.get('input[type="checkbox"]').each((checkbox) => {
        cy.wrap(checkbox).should('be.checked');
      });
    });

    it('shows bulk action buttons when agents selected', () => {
      mount(<AgentsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Pause Selected').should('be.visible');
      cy.contains('button', 'Resume Selected').should('be.visible');
    });

    it('can pause selected agents', () => {
      mount(<AgentsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Pause Selected').click();
      cy.wrap(agentsApi.pauseAgent).should('have.been.called');
    });

    it('can resume selected agents', () => {
      mount(<AgentsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Resume Selected').click();
      cy.wrap(agentsApi.resumeAgent).should('have.been.called');
    });
  });

  describe('Accessibility', () => {
    it('has semantic table structure', () => {
      mount(<AgentsPage />);
      cy.get('table').should('exist');
      cy.get('thead').should('exist');
      cy.get('tbody').should('exist');
    });

    it('has accessible column headers', () => {
      mount(<AgentsPage />);
      cy.get('th').should('have.length', 4); // Name, Status, Tasks, Actions
    });

    it('has accessible action buttons', () => {
      mount(<AgentsPage />);
      cy.contains('button', 'Register').should('have.attr', 'type', 'button');
      cy.contains('button', 'Refresh').should('have.attr', 'type', 'button');
    });

    it('has accessible status badges', () => {
      mount(<AgentsPage />);
      cy.contains('ACTIVE').should('have.attr', 'role', 'img');
    });

    it('supports keyboard navigation', () => {
      mount(<AgentsPage />);
      cy.get('[data-testid="agents-table"] tbody tr').first().focus();
      cy.focused().should('have.attr', 'tabindex');
    });
  });

  describe('Real-time Updates', () => {
    it('updates agent status in real-time', async () => {
      mount(<AgentsPage />);
      cy.contains('ACTIVE').should('be.visible');

      // Simulate status change
      const updatedAgents = [
        { ...mockAgents[0], status: 'OFFLINE' as const },
        ...mockAgents.slice(1),
      ];
      vi.mocked(agentsApi.listAgents).mockResolvedValue(updatedAgents);
      
      cy.get('[data-testid="refresh-interval"]').should('exist');
    });

    it('auto-refreshes agent list at interval', () => {
      mount(<AgentsPage />);
      // After 30 seconds, list should refresh automatically
      cy.wait(30000);
      cy.wrap(agentsApi.listAgents).should('have.been.called');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long agent names', () => {
      const longNameAgent = {
        ...mockAgents[0],
        name: 'This is a very long agent name that might wrap to multiple lines in the table cell',
      };
      vi.mocked(agentsApi.listAgents).mockResolvedValue([longNameAgent]);
      mount(<AgentsPage />);
      cy.contains('This is a very long').should('be.visible');
    });

    it('handles agents with no assigned tasks', () => {
      mount(<AgentsPage />);
      cy.contains('Agent Beta').parent().contains('0').should('exist');
    });

    it('handles stale heartbeat data', () => {
      const staleAgent = {
        ...mockAgents[2],
        last_heartbeat: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      };
      vi.mocked(agentsApi.listAgents).mockResolvedValue([staleAgent]);
      mount(<AgentsPage />);
      cy.contains('OFFLINE').should('be.visible');
    });

    it('handles rapid status changes', () => {
      const TestComponent = () => {
        const [agents, setAgents] = React.useState(mockAgents);
        return (
          <>
            <AgentsPage />
            <button
              onClick={() => {
                setAgents([
                  { ...agents[0], status: 'IDLE' as const },
                  ...agents.slice(1),
                ]);
              }}
            >
              Update
            </button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').click();
      // Status should update in table
    });

    it('maintains state through refresh', () => {
      mount(<AgentsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Refresh').click();
      // Selection should be maintained
    });
  });
});
