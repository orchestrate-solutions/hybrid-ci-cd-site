/**
 * CheckboxField Component - Cypress Tests
 * 
 * Tests checkbox toggle, state management, accessibility
 * Validates checkbox field works as reusable form element
 */

import React from 'react';
import { mount } from 'cypress/react';
import { CheckboxField } from '../CheckboxField';

describe('CheckboxField Component', () => {
  describe('Rendering', () => {
    it('renders checkbox with label', () => {
      mount(<CheckboxField label="Agree to terms" />);
      cy.get('input[type="checkbox"]').should('exist');
      cy.get('label').should('have.text', 'Agree to terms');
    });

    it('renders unchecked by default', () => {
      mount(<CheckboxField label="Subscribe" />);
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('renders checked when checked=true', () => {
      mount(<CheckboxField label="Subscribed" checked={true} onChange={() => {}} />);
      cy.get('input[type="checkbox"]').should('be.checked');
    });

    it('renders with label adjacent to checkbox', () => {
      mount(<CheckboxField label="Enable notifications" />);
      cy.get('.MuiFormControlLabel-root').should('exist');
      cy.get('input[type="checkbox"]').should('exist');
      cy.get('label').should('have.text', 'Enable notifications');
    });
  });

  describe('User Interactions', () => {
    it('toggles on click', () => {
      mount(<CheckboxField label="Accept" />);
      cy.get('input[type="checkbox"]').should('not.be.checked');
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('toggles when clicking label', () => {
      mount(<CheckboxField label="Click label" />);
      cy.get('input[type="checkbox"]').should('not.be.checked');
      cy.get('label').click();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('label').click();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('handles multiple rapid clicks', () => {
      mount(<CheckboxField label="Rapid toggle" />);
      cy.get('input[type="checkbox"]').click().click().click();
      cy.get('input[type="checkbox"]').should('be.checked'); // Odd number of clicks
    });

    it('toggles with space key when focused', () => {
      mount(<CheckboxField label="Space toggle" />);
      cy.get('input[type="checkbox"]').focus();
      cy.get('input[type="checkbox"]').type(' ');
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('input[type="checkbox"]').type(' ');
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });
  });

  describe('State Management', () => {
    it('handles controlled component state', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <>
            <CheckboxField 
              label="Controlled"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <div data-testid="status">{checked ? 'Checked' : 'Unchecked'}</div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[data-testid="status"]').should('have.text', 'Unchecked');
      cy.get('input[type="checkbox"]').click();
      cy.get('[data-testid="status"]').should('have.text', 'Checked');
    });

    it('updates when parent state changes', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(true);
        return (
          <>
            <CheckboxField 
              label="Controlled"
              checked={checked}
              onChange={() => {}}
            />
            <button onClick={() => setChecked(!checked)}>Toggle</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('tracks state through multiple toggles', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        const [toggleCount, setToggleCount] = React.useState(0);
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setChecked(e.target.checked);
          setToggleCount(toggleCount + 1);
        };

        return (
          <>
            <CheckboxField 
              label="Counter"
              checked={checked}
              onChange={handleChange}
            />
            <div data-testid="count">Toggles: {toggleCount}</div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[data-testid="count"]').should('have.text', 'Toggles: 0');
      cy.get('input[type="checkbox"]').click();
      cy.get('[data-testid="count"]').should('have.text', 'Toggles: 1');
      cy.get('input[type="checkbox"]').click();
      cy.get('[data-testid="count"]').should('have.text', 'Toggles: 2');
    });
  });

  describe('Disabled State', () => {
    it('disables checkbox when disabled=true', () => {
      mount(<CheckboxField label="Disabled" disabled />);
      cy.get('input[type="checkbox"]').should('be.disabled');
    });

    it('prevents toggling when disabled', () => {
      mount(<CheckboxField label="Locked" disabled checked={true} onChange={() => {}} />);
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('be.checked'); // Unchanged
    });

    it('shows disabled styling', () => {
      mount(<CheckboxField label="Disabled checkbox" disabled />);
      cy.get('.MuiFormControlLabel-root').should('have.class', 'Mui-disabled');
    });
  });

  describe('Multiple Checkboxes', () => {
    it('handles independent state for multiple checkboxes', () => {
      const TestComponent = () => {
        const [checked1, setChecked1] = React.useState(false);
        const [checked2, setChecked2] = React.useState(false);
        return (
          <>
            <CheckboxField 
              label="Option 1"
              checked={checked1}
              onChange={(e) => setChecked1(e.target.checked)}
            />
            <CheckboxField 
              label="Option 2"
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
            />
            <div data-testid="state">
              {checked1 ? '1' : '0'} {checked2 ? '1' : '0'}
            </div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[data-testid="state"]').should('have.text', '0 0');
      
      cy.contains('Option 1').parent().find('input').click();
      cy.get('[data-testid="state"]').should('have.text', '1 0');
      
      cy.contains('Option 2').parent().find('input').click();
      cy.get('[data-testid="state"]').should('have.text', '1 1');
      
      cy.contains('Option 1').parent().find('input').click();
      cy.get('[data-testid="state"]').should('have.text', '0 1');
    });
  });

  describe('Accessibility', () => {
    it('has checkbox input element', () => {
      mount(<CheckboxField label="Accessible" />);
      cy.get('input[type="checkbox"]').should('exist');
    });

    it('associates label with checkbox', () => {
      mount(<CheckboxField label="Associated label" />);
      cy.get('input[type="checkbox"]').should('have.attr', 'id');
      cy.get('label').should('have.attr', 'for');
      
      cy.get('input[type="checkbox"]').invoke('attr', 'id').then((id) => {
        cy.get(`label[for="${id}"]`).should('exist');
      });
    });

    it('supports aria-label prop', () => {
      mount(
        <CheckboxField 
          label="Visible Label"
          aria-label="Screen reader label"
        />
      );
      cy.get('input[type="checkbox"]').should('have.attr', 'aria-label');
    });

    it('supports keyboard navigation', () => {
      const TestComponent = () => {
        return (
          <>
            <button>Before</button>
            <CheckboxField label="Focused checkbox" />
            <button>After</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('button').first().focus();
      cy.focused().should('contain.text', 'Before');
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'checkbox');
      cy.focused().tab();
      cy.focused().should('contain.text', 'After');
    });

    it('works with screen reader for state changes', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <>
            <CheckboxField 
              label="Status indicator"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <div aria-live="polite" data-testid="announcement">
              {checked ? 'Enabled' : 'Disabled'}
            </div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[data-testid="announcement"]').should('have.text', 'Disabled');
      cy.get('input[type="checkbox"]').click();
      cy.get('[data-testid="announcement"]').should('have.text', 'Enabled');
    });

    it('has proper ARIA checked attribute', () => {
      mount(<CheckboxField label="ARIA test" checked={false} onChange={() => {}} />);
      cy.get('input[type="checkbox"]').should('have.attr', 'aria-checked', 'false');
    });
  });

  describe('Integration with Forms', () => {
    it('works in form submission', () => {
      const TestComponent = () => {
        const [agreed, setAgreed] = React.useState(false);
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (agreed) {
            cy.get('[data-testid="success"]').should('have.text', 'Submitted');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <CheckboxField 
              label="Agree to terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <button type="submit">Submit</button>
            <div data-testid="success"></div>
          </form>
        );
      };

      mount(<TestComponent />);
      cy.get('button[type="submit"]').click();
      cy.get('input[type="checkbox"]').click();
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="success"]').should('have.text', 'Submitted');
    });

    it('resets with form reset', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(true);
        
        const handleReset = () => {
          setChecked(false);
        };

        return (
          <form onReset={handleReset}>
            <CheckboxField 
              label="Resetable"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <button type="reset">Reset</button>
          </form>
        );
      };

      mount(<TestComponent />);
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('button[type="reset"]').click();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long label text', () => {
      const longLabel = 'This is a very long checkbox label that might wrap to multiple lines in the UI';
      mount(<CheckboxField label={longLabel} />);
      cy.get('label').should('have.text', longLabel);
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('be.checked');
    });

    it('handles special characters in label', () => {
      const specialLabel = 'Accept & agree to terms (v2.0) [required]';
      mount(<CheckboxField label={specialLabel} />);
      cy.get('label').should('have.text', specialLabel);
    });

    it('handles rapid programmatic state changes', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);
        
        return (
          <>
            <CheckboxField 
              label="Rapid updates"
              checked={checked}
              onChange={() => {}}
            />
            <button onClick={() => {
              setChecked(true);
              setTimeout(() => setChecked(false), 100);
            }}>Rapid Toggle</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('button').click();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.wait(150);
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('maintains state across multiple renders', () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(true);
        const [, setRender] = React.useState(0);
        
        return (
          <>
            <CheckboxField 
              label="Persistent"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <button onClick={() => setRender(r => r + 1)}>Re-render</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[type="checkbox"]').should('be.checked');
    });
  });
});
