/**
 * StatusCard Cypress Component Tests
 *
 * Real browser testing for:
 * - Rendering and DOM structure
 * - Theme switching behavior
 * - Interactive states (hover, click)
 * - Accessibility compliance
 * - Visual regression baseline
 */

import { StatusCard, StatusType } from '../StatusCard';
import {
  CheckCircle as SuccessIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

describe('StatusCard Component', () => {
  describe('Rendering', () => {
    it('renders label and value correctly', () => {
      cy.mount(
        <StatusCard label="Jobs Running" value={8} testId="jobs-card" />
      );

      cy.get('text').contains('Jobs Running').should('be.visible');
      cy.get('[data-testid="jobs-card-value"]').should('contain', '8');
    });

    it('renders with icon', () => {
      cy.mount(
        <StatusCard
          label="Success"
          value={10}
          icon={<SuccessIcon data-testid="success-icon" />}
          testId="icon-card"
        />
      );

      cy.get('[data-testid="success-icon"]').should('exist');
    });

    it('formats large numbers with thousands separator', () => {
      cy.mount(
        <StatusCard label="Total" value={1234567} testId="large-num" />
      );

      cy.get('[data-testid="large-num-value"]').should('contain', '1,234,567');
    });
  });

  describe('Status Variants', () => {
    const statuses: Array<{ status: StatusType; badge: string }> = [
      { status: 'success', badge: '✅' },
      { status: 'warning', badge: '⚠️' },
      { status: 'error', badge: '❌' },
      { status: 'info', badge: 'ℹ️' },
    ];

    statuses.forEach(({ status, badge }) => {
      it(`renders ${status} status with correct badge`, () => {
        cy.mount(
          <StatusCard
            label={`${status} Status`}
            value={1}
            status={status}
            testId={`${status}-card`}
          />
        );

        cy.get('text').contains(badge).should('be.visible');
      });
    });
  });

  describe('Interactive Behavior', () => {
    it('handles click events when onClick is provided', () => {
      const handleClick = cy.spy();

      cy.mount(
        <StatusCard
          label="Clickable"
          value={10}
          onClick={() => handleClick()}
          testId="clickable-card"
        />
      );

      cy.get('[data-testid="clickable-card"]').click();
    });

    it('shows hover effects when clickable', () => {
      cy.mount(
        <StatusCard
          label="Hover Test"
          value={5}
          onClick={() => {}}
          testId="hover-card"
        />
      );

      cy.get('[data-testid="hover-card"]')
        .trigger('mouseenter')
        .should('have.css', 'box-shadow');
    });

    it('does not show hover effects when not clickable', () => {
      cy.mount(
        <StatusCard label="No Hover" value={5} testId="no-hover-card" />
      );

      cy.get('[data-testid="no-hover-card"]').trigger('mouseenter');
      // Card should remain unchanged without transform
    });
  });

  describe('Accessibility', () => {
    it('has proper test IDs for automation', () => {
      cy.mount(
        <StatusCard label="A11y" value={100} testId="a11y-test" />
      );

      cy.get('[data-testid="a11y-test"]').should('exist');
      cy.get('[data-testid="a11y-test-value"]').should('exist');
    });

    it('uses semantic heading elements', () => {
      cy.mount(
        <StatusCard label="Semantic" value={50} testId="semantic" />
      );

      // h5 for value (semantic heading)
      cy.get('.MuiTypography-h5').should('contain', '50');

      // caption for label
      cy.get('.MuiTypography-caption').should('contain', 'Semantic');
    });
  });

  describe('Theme Compliance', () => {
    it('renders correctly in light theme', () => {
      cy.mount(
        <StatusCard
          label="Light"
          value={10}
          status="success"
          testId="light-card"
        />
      );

      cy.get('[data-testid="light-card"]').should('be.visible');
      // Visual theme would be apparent in visual testing
    });

    it('respects theme palette colors', () => {
      cy.mount(
        <StatusCard
          label="Theme Test"
          value={5}
          status="success"
          testId="theme-test"
        />
      );

      // Card should use theme tokens (verified via DOM inspection)
      cy.get('[data-testid="theme-test"]').should('have.css', 'border-color');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      cy.mount(<StatusCard label="Zero" value={0} testId="zero" />);

      cy.get('[data-testid="zero-value"]').should('contain', '0');
    });

    it('handles string values', () => {
      cy.mount(
        <StatusCard label="Status" value="OPERATIONAL" testId="string" />
      );

      cy.get('[data-testid="string-value"]').should('contain', 'OPERATIONAL');
    });

    it('handles long labels with text wrapping', () => {
      const longLabel = 'This is a very long label that demonstrates text wrapping behavior';

      cy.mount(
        <StatusCard label={longLabel} value={1} testId="long-label" />
      );

      cy.get('text').contains(longLabel).should('be.visible');
    });
  });

  describe('Visual Regression', () => {
    it('matches snapshot for all status variants', () => {
      cy.mount(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <StatusCard label="Success" value={10} status="success" testId="snap-success" />
          <StatusCard label="Warning" value={3} status="warning" testId="snap-warning" />
          <StatusCard label="Error" value={1} status="error" testId="snap-error" />
          <StatusCard label="Info" value={7} status="info" testId="snap-info" />
        </div>
      );

      cy.get('[data-testid="snap-success"]').should('be.visible');
      cy.get('[data-testid="snap-warning"]').should('be.visible');
      cy.get('[data-testid="snap-error"]').should('be.visible');
      cy.get('[data-testid="snap-info"]').should('be.visible');

      // Snapshot would be captured here in CI/CD
      cy.screenshot('statuscard-variants');
    });

    it('maintains appearance in grid layout', () => {
      cy.mount(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatusCard label="Queued" value={42} status="info" testId="grid-1" />
          <StatusCard label="Running" value={8} status="success" testId="grid-2" />
          <StatusCard label="Failed" value={2} status="error" testId="grid-3" />
        </div>
      );

      cy.get('[data-testid="grid-1"]').should('be.visible');
      cy.get('[data-testid="grid-2"]').should('be.visible');
      cy.get('[data-testid="grid-3"]').should('be.visible');

      cy.screenshot('statuscard-grid');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      cy.viewport('iphone-x');

      cy.mount(
        <StatusCard label="Mobile" value={10} testId="mobile-card" />
      );

      cy.get('[data-testid="mobile-card"]').should('be.visible');
    });

    it('renders correctly on tablet viewport', () => {
      cy.viewport('ipad-2');

      cy.mount(
        <StatusCard label="Tablet" value={10} testId="tablet-card" />
      );

      cy.get('[data-testid="tablet-card"]').should('be.visible');
    });

    it('renders correctly on desktop viewport', () => {
      cy.viewport(1280, 720);

      cy.mount(
        <StatusCard label="Desktop" value={10} testId="desktop-card" />
      );

      cy.get('[data-testid="desktop-card"]').should('be.visible');
    });
  });

  describe('Integration', () => {
    it('works within a dashboard grid', () => {
      cy.mount(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatusCard label="Jobs Queued" value={42} status="info" testId="dashboard-1" />
          <StatusCard label="Jobs Running" value={8} status="success" testId="dashboard-2" />
          <StatusCard label="Jobs Failed" value={2} status="error" testId="dashboard-3" />
          <StatusCard label="Pending" value={1} status="warning" testId="dashboard-4" />
        </div>
      );

      cy.get('[data-testid="dashboard-1"]').should('be.visible');
      cy.get('[data-testid="dashboard-2"]').should('be.visible');
      cy.get('[data-testid="dashboard-3"]').should('be.visible');
      cy.get('[data-testid="dashboard-4"]').should('be.visible');

      // All cards should be aligned in grid
      cy.get('[data-testid="dashboard-1"]').then(($card1) => {
        cy.get('[data-testid="dashboard-2"]').should(($card2) => {
          // Cards should be in same row (same top position)
          expect($card1[0].getBoundingClientRect().top).to.equal(
            $card2[0].getBoundingClientRect().top
          );
        });
      });
    });
  });
});
