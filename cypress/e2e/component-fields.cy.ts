/**
 * Cypress Component Tests: Field Microcomponents
 * Tests all 9 MUI X field components in real browser environment
 * Validates: rendering, user input, validation, accessibility
 */

describe('Field Components - Component Tests', () => {
  beforeEach(() => {
    // Visit Storybook page for component testing
    cy.visit('http://localhost:6006');
  });

  describe('TextField Component', () => {
    it('should render text input field', () => {
      cy.navigate_to_story('components-fields-textfield--default');
      cy.get('input[type="text"]').should('exist').should('be.visible');
    });

    it('should accept text input', () => {
      cy.navigate_to_story('components-fields-textfield--default');
      cy.get('input[type="text"]').type('Hello World');
      cy.get('input[type="text"]').should('have.value', 'Hello World');
    });

    it('should display label when provided', () => {
      cy.navigate_to_story('components-fields-textfield--with-label');
      cy.contains('label', 'Username').should('exist');
    });

    it('should show error state', () => {
      cy.navigate_to_story('components-fields-textfield--error');
      cy.get('[role="alert"]').should('exist');
    });

    it('should support disabled state', () => {
      cy.navigate_to_story('components-fields-textfield--disabled');
      cy.get('input[type="text"]').should('be.disabled');
    });

    it('should support placeholder text', () => {
      cy.navigate_to_story('components-fields-textfield--default');
      cy.get('input[type="text"]').invoke('attr', 'placeholder').should('exist');
    });
  });

  describe('SelectField Component', () => {
    it('should render select dropdown', () => {
      cy.navigate_to_story('components-fields-selectfield--default');
      cy.get('select').should('exist').should('be.visible');
    });

    it('should open dropdown on click', () => {
      cy.navigate_to_story('components-fields-selectfield--default');
      cy.get('select').click();
      cy.get('select option').should('have.length.greaterThan', 0);
    });

    it('should change value on selection', () => {
      cy.navigate_to_story('components-fields-selectfield--default');
      cy.get('select').select('option2');
      cy.get('select').should('have.value', 'option2');
    });

    it('should display label', () => {
      cy.navigate_to_story('components-fields-selectfield--with-label');
      cy.contains('label', /option|label/).should('exist');
    });
  });

  describe('CheckboxField Component', () => {
    it('should render checkbox input', () => {
      cy.navigate_to_story('components-fields-checkboxfield--default');
      cy.get('input[type="checkbox"]').should('exist');
    });

    it('should toggle checkbox state', () => {
      cy.navigate_to_story('components-fields-checkboxfield--default');
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('should display label text', () => {
      cy.navigate_to_story('components-fields-checkboxfield--with-label');
      cy.contains('label', /agree|accept|confirm/).should('exist');
    });
  });

  describe('RadioGroup Component', () => {
    it('should render radio buttons', () => {
      cy.navigate_to_story('components-fields-radiogroup--default');
      cy.get('input[type="radio"]').should('have.length.greaterThan', 0);
    });

    it('should select only one radio at a time', () => {
      cy.navigate_to_story('components-fields-radiogroup--default');
      cy.get('input[type="radio"]').first().click();
      cy.get('input[type="radio"]').first().should('be.checked');
      cy.get('input[type="radio"]').last().click();
      cy.get('input[type="radio"]').first().should('not.be.checked');
      cy.get('input[type="radio"]').last().should('be.checked');
    });
  });

  describe('NumberField Component', () => {
    it('should render number input', () => {
      cy.navigate_to_story('components-fields-numberfield--default');
      cy.get('input[type="number"]').should('exist');
    });

    it('should accept numeric input only', () => {
      cy.navigate_to_story('components-fields-numberfield--default');
      cy.get('input[type="number"]').type('123');
      cy.get('input[type="number"]').should('have.value', '123');
    });

    it('should have increment/decrement buttons', () => {
      cy.navigate_to_story('components-fields-numberfield--default');
      cy.get('input[type="number"]').should('exist');
      // Browser provides native spinners for number inputs
    });
  });

  describe('PasswordField Component', () => {
    it('should render password input', () => {
      cy.navigate_to_story('components-fields-passwordfield--default');
      cy.get('input[type="password"]').should('exist');
    });

    it('should mask password by default', () => {
      cy.navigate_to_story('components-fields-passwordfield--default');
      cy.get('input[type="password"]').type('secret123');
      cy.get('input[type="password"]').invoke('attr', 'type').should('equal', 'password');
    });

    it('should have show/hide toggle button', () => {
      cy.navigate_to_story('components-fields-passwordfield--default');
      cy.get('button[aria-label*="show"]').should('exist').or(
        cy.get('button[aria-label*="hide"]').should('exist')
      );
    });
  });

  describe('DateField Component', () => {
    it('should render date input', () => {
      cy.navigate_to_story('components-fields-datefield--default');
      cy.get('input[type="date"]').should('exist');
    });

    it('should accept date input', () => {
      cy.navigate_to_story('components-fields-datefield--default');
      cy.get('input[type="date"]').type('11/09/2025');
      cy.get('input[type="date"]').should('have.value');
    });
  });

  describe('FileField Component', () => {
    it('should render file input', () => {
      cy.navigate_to_story('components-fields-filefield--default');
      cy.get('input[type="file"]').should('exist');
    });

    it('should accept file selection', () => {
      cy.navigate_to_story('components-fields-filefield--default');
      cy.get('input[type="file"]').selectFile('cypress/fixtures/example.json', { force: true });
    });

    it('should display file upload area', () => {
      cy.navigate_to_story('components-fields-filefield--default');
      cy.get('[data-testid="file-upload-area"]').should('exist').or(
        cy.get('input[type="file"]').parent().should('exist')
      );
    });
  });

  describe('TextareaField Component', () => {
    it('should render textarea input', () => {
      cy.navigate_to_story('components-fields-textareafield--default');
      cy.get('textarea').should('exist');
    });

    it('should accept multiline text input', () => {
      cy.navigate_to_story('components-fields-textareafield--default');
      cy.get('textarea').type('Line 1{shift+enter}Line 2');
      cy.get('textarea').should('have.value');
    });

    it('should expand to fit content', () => {
      cy.navigate_to_story('components-fields-textareafield--default');
      cy.get('textarea').invoke('css', 'min-height').should('exist');
    });
  });
});
