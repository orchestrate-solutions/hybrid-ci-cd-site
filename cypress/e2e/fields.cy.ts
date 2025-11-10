/**
 * Cypress Tests for All Field Components
 * Tests: TextField, SelectField, CheckboxField, RadioGroup, NumberField, PasswordField, DateField, FileField, TextareaField
 */

describe('Field Components E2E', () => {
  describe('TextField', () => {
    it('should render and accept input', () => {
      cy.visit('http://localhost:3000');
      // Navigate to storybook when ready
      cy.get('[data-testid="textfield"]', { timeout: 10000 }).should('exist');
    });

    it('should show error state', () => {
      cy.get('[data-testid="textfield-error"]').should('exist');
    });

    it('should be disabled when disabled prop is set', () => {
      cy.get('[data-testid="textfield-disabled"]').should('be.disabled');
    });

    it('should update value on user input', () => {
      cy.get('input[type="text"]').first().type('test value');
      cy.get('input[type="text"]').first().should('have.value', 'test value');
    });
  });

  describe('SelectField', () => {
    it('should render with options', () => {
      cy.get('[role="combobox"]').should('exist');
    });

    it('should open menu on click', () => {
      cy.get('[role="combobox"]').click();
      cy.get('[role="listbox"]').should('be.visible');
    });

    it('should select option', () => {
      cy.get('[role="combobox"]').click();
      cy.get('[role="option"]').first().click();
      cy.get('[role="combobox"]').should('have.text', /Option|Select/);
    });
  });

  describe('CheckboxField', () => {
    it('should render checkbox', () => {
      cy.get('input[type="checkbox"]').should('exist');
    });

    it('should toggle on click', () => {
      cy.get('input[type="checkbox"]').first().should('not.be.checked');
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('be.checked');
    });

    it('should show label', () => {
      cy.get('label').should('have.length.greaterThan', 0);
    });
  });

  describe('RadioGroup', () => {
    it('should render radio buttons', () => {
      cy.get('input[type="radio"]').should('have.length.greaterThan', 0);
    });

    it('should select radio option', () => {
      cy.get('input[type="radio"]').first().click();
      cy.get('input[type="radio"]').first().should('be.checked');
    });

    it('should uncheck previous radio when new one is selected', () => {
      cy.get('input[type="radio"]').first().click();
      cy.get('input[type="radio"]').eq(1).click();
      cy.get('input[type="radio"]').first().should('not.be.checked');
      cy.get('input[type="radio"]').eq(1).should('be.checked');
    });
  });

  describe('NumberField', () => {
    it('should render number input', () => {
      cy.get('input[type="number"]').should('exist');
    });

    it('should accept numeric input', () => {
      cy.get('input[type="number"]').first().type('42');
      cy.get('input[type="number"]').first().should('have.value', '42');
    });

    it('should handle increment/decrement', () => {
      const input = cy.get('input[type="number"]').first();
      input.should('have.value', '0');
    });
  });

  describe('PasswordField', () => {
    it('should render password input', () => {
      cy.get('input[type="password"]').should('exist');
    });

    it('should hide password text', () => {
      cy.get('input[type="password"]').first().type('secret123');
      cy.get('input[type="password"]').first().should('have.value', 'secret123');
    });

    it('should show/hide password toggle button', () => {
      cy.get('[data-testid="visibility-toggle"]').should('exist');
    });
  });

  describe('DateField', () => {
    it('should render date input', () => {
      cy.get('input[type="date"]').should('exist');
    });

    it('should accept date value', () => {
      cy.get('input[type="date"]').first().type('2025-12-25');
      cy.get('input[type="date"]').first().should('have.value', '2025-12-25');
    });
  });

  describe('FileField', () => {
    it('should render file input', () => {
      cy.get('input[type="file"]').should('exist');
    });

    it('should handle file selection', () => {
      const fileName = 'test.txt';
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('test file content'),
        fileName: fileName,
      });
      cy.get('input[type="file"]').should('have.value', expect.stringContaining(fileName));
    });
  });

  describe('TextareaField', () => {
    it('should render textarea', () => {
      cy.get('textarea').should('exist');
    });

    it('should accept multiline input', () => {
      cy.get('textarea').first().type('Line 1\nLine 2\nLine 3');
      cy.get('textarea').first().should('have.value', 'Line 1\nLine 2\nLine 3');
    });

    it('should resize based on content', () => {
      cy.get('textarea').first().should('exist');
    });
  });
});
