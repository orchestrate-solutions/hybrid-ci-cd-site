/**
 * Agents Page Filter Integration Tests
 * Tests that filter changes properly trigger state updates and data refetches
 */

describe('Agents Page - Filter Integration', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/agents');
  });

  describe('Status Filter', () => {
    it('changes filter state when status dropdown is clicked', () => {
      cy.get('[data-testid="filter-status"]').should('have.value', 'ALL');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      cy.get('[data-testid="filter-status"]').should('have.value', 'RUNNING');
    });

    it('triggers data refetch when status filter changes', () => {
      cy.intercept('GET', '/api/agents*', {
        statusCode: 200,
        body: {
          agents: [
            {
              id: 'agent-1',
              name: 'Agent 1',
              status: 'RUNNING',
              pool_id: 'pool-prod',
              cpu_cores: 8,
              memory_gb: 16,
              last_heartbeat: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getRunningAgents');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      cy.wait('@getRunningAgents').then((interception) => {
        expect(interception.request.url).to.include('status=RUNNING');
      });

      cy.get('[data-testid="agents-table"]').should('contain', 'Agent 1');
    });

    it('filters correctly by each status', () => {
      const statuses = [
        { label: 'Idle', value: 'IDLE' },
        { label: 'Running', value: 'RUNNING' },
        { label: 'Paused', value: 'PAUSED' },
        { label: 'Offline', value: 'OFFLINE' },
        { label: 'Error', value: 'ERROR' },
      ];

      statuses.forEach(({ label, value }) => {
        cy.intercept('GET', `/api/agents*status=${value}*`, {
          statusCode: 200,
          body: {
            agents: [
              {
                id: 'agent-1',
                name: `Agent ${value}`,
                status: value as any,
                pool_id: 'pool-1',
                cpu_cores: 4,
                memory_gb: 8,
                last_heartbeat: new Date().toISOString(),
              },
            ],
            total: 1,
          },
        }).as(`get${value}Agents`);

        cy.get('[data-testid="filter-status"]').click();
        cy.contains('[role="option"]', label).click();

        cy.wait(`@get${value}Agents`);
        cy.get('[data-testid="agents-table"]').should('contain', `Agent ${value}`);
      });
    });

    it('returns to page 0 when filter changes', () => {
      // Go to next page
      cy.get('button:contains("2")').click({ force: true });

      // Apply filter (should reset to page 0)
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Paused').click();

      // Verify back on page 0
      cy.get('[data-testid="pagination"]').should('contain', '1–');
    });
  });

  describe('Show All Option', () => {
    it('shows all agents when ALL is selected', () => {
      cy.intercept('GET', '/api/agents*', {
        statusCode: 200,
        body: {
          agents: [
            {
              id: 'agent-1',
              name: 'Agent 1',
              status: 'RUNNING',
              pool_id: 'pool-1',
              cpu_cores: 8,
              memory_gb: 16,
              last_heartbeat: new Date().toISOString(),
            },
            {
              id: 'agent-2',
              name: 'Agent 2',
              status: 'IDLE',
              pool_id: 'pool-1',
              cpu_cores: 4,
              memory_gb: 8,
              last_heartbeat: new Date().toISOString(),
            },
            {
              id: 'agent-3',
              name: 'Agent 3',
              status: 'OFFLINE',
              pool_id: 'pool-2',
              cpu_cores: 2,
              memory_gb: 4,
              last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
          total: 3,
        },
      }).as('getAllAgents');

      // Default is ALL
      cy.get('[data-testid="filter-status"]').should('have.value', 'ALL');

      // Verify all agents shown
      cy.wait('@getAllAgents');
      cy.get('[data-testid="agents-table"] tbody tr').should('have.length', 3);
    });
  });

  describe('Filter State Persistence', () => {
    it('applies multiple filters independently', () => {
      // First, test filtering
      cy.intercept('GET', '/api/agents*status=IDLE*', {
        statusCode: 200,
        body: {
          agents: [
            {
              id: 'agent-1',
              name: 'Idle Agent',
              status: 'IDLE',
              pool_id: 'pool-1',
              cpu_cores: 4,
              memory_gb: 8,
              last_heartbeat: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getIdleAgents');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Idle').click();

      cy.wait('@getIdleAgents');
      cy.get('[data-testid="agents-table"]').should('contain', 'Idle Agent');

      // Change filter
      cy.intercept('GET', '/api/agents*status=RUNNING*', {
        statusCode: 200,
        body: {
          agents: [
            {
              id: 'agent-2',
              name: 'Running Agent',
              status: 'RUNNING',
              pool_id: 'pool-1',
              cpu_cores: 8,
              memory_gb: 16,
              last_heartbeat: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getRunningAgents');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      cy.wait('@getRunningAgents');
      cy.get('[data-testid="agents-table"]').should('contain', 'Running Agent');
      cy.get('[data-testid="agents-table"]').should('not.contain', 'Idle Agent');
    });
  });

  describe('Filter Error Handling', () => {
    it('shows error message when filter query fails', () => {
      cy.intercept('GET', '/api/agents*status=ERROR*', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('failedQuery');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Error').click();

      cy.wait('@failedQuery');

      cy.get('[role="alert"]').should('contain', 'Failed');
    });

    it('allows retry after failed query', () => {
      let callCount = 0;

      cy.intercept('GET', '/api/agents*status=OFFLINE*', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({
            statusCode: 500,
            body: { error: 'Server error' },
          });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              agents: [
                {
                  id: 'agent-1',
                  name: 'Offline Agent',
                  status: 'OFFLINE',
                  pool_id: 'pool-1',
                  cpu_cores: 2,
                  memory_gb: 4,
                  last_heartbeat: new Date(Date.now() - 86400000).toISOString(),
                },
              ],
              total: 1,
            },
          });
        }
      }).as('offlineQuery');

      // Apply filter (first call fails)
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Offline').click();

      cy.wait('@offlineQuery');
      cy.get('[role="alert"]').should('contain', 'Failed');

      // Click retry
      cy.get('[role="alert"]').within(() => {
        cy.get('button').contains('Retry').click();
      });

      // Retry succeeds
      cy.wait('@offlineQuery');
      cy.get('[data-testid="agents-table"]').should('contain', 'Offline Agent');
    });
  });

  describe('Pagination with Filter', () => {
    it('maintains rows per page setting when filter applied', () => {
      cy.intercept('GET', '/api/agents*limit=25*', {
        statusCode: 200,
        body: {
          agents: Array.from({ length: 25 }, (_, i) => ({
            id: `agent-${i}`,
            name: `Agent ${i}`,
            status: 'IDLE',
            pool_id: 'pool-1',
            cpu_cores: 4,
            memory_gb: 8,
            last_heartbeat: new Date().toISOString(),
          })),
          total: 50,
        },
      }).as('get25Agents');

      // Change rows per page to 25
      cy.get('[data-testid="pagination"]').within(() => {
        cy.get('select').select('25');
      });

      cy.wait('@get25Agents');

      // Apply filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Idle').click();

      // Verify rows per page still 25
      cy.get('[data-testid="pagination"]').should('contain', '1–25');
    });
  });
});
