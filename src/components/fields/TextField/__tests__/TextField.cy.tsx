/**
 * TextField Component - Cypress Tests
 * 
 * Tests user interactions, state changes, accessibility
 * Validates component works standalone before integration
 */

import React from 'react';
import { mount } from 'cypress/react';
import { TextField } from '../TextField';

describe('TextField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<TextField label="Email Address" />);
      cy.get('label').should('have.text', 'Email Address');
    });

    it('renders input with data-testid', () => {
      mount(<TextField label="Name" />);
      cy.get('[data-testid="text-field-input"]').should('exist');
    });

    it('renders helper text when provided', () => {
      mount(<TextField label="Password" helperText="Min 8 characters" />);
      cy.get('.MuiFormHelperText-root').should('have.text', 'Min 8 characters');
    });

    it('shows required indicator when required=true', () => {
      mount(<TextField label="Username" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders with placeholder text', () => {
      mount(<TextField label="Search" placeholder="Type to search..." />);
      cy.get('input').should('have.attr', 'placeholder', 'Type to search...');
    });

    it('renders with different variants', () => {
      mount(<TextField label="Outlined" variant="outlined" />);
      cy.get('.MuiOutlinedInput-root').should('exist');

      mount(<TextField label="Filled" variant="filled" />);
      cy.get('.MuiFilledInput-root').should('exist');

      mount(<TextField label="Standard" variant="standard" />);
      cy.get('.MuiInput-root').should('exist');
    });

    it('renders with different sizes', () => {
      mount(<TextField label="Small" size="small" />);
      cy.get('input').should('have.class', 'MuiInputBase-inputSizeSmall');

      mount(<TextField label="Medium" size="medium" />);
      cy.get('input').should('exist');
    });
  });

  describe('User Interactions', () => {
    it('updates value on user input', () => {
      mount(<TextField label="Name" />);
      cy.get('input').type('John Doe');
      cy.get('input').should('have.value', 'John Doe');
    });

    it('clears value correctly', () => {
      mount(<TextField label="Email" value="test@example.com" onChange={() => {}} />);
      cy.get('input').clear();
      cy.get('input').should('have.value', '');
    });

    it('handles paste events', () => {
      mount(<TextField label="Text" />);
      cy.get('input').invoke('val', 'pasted text').trigger('change');
      cy.get('input').should('have.value', 'pasted text');
    });

    it('handles numeric input', () => {
      mount(<TextField label="Age" type="number" />);
      cy.get('input').type('25');
      cy.get('input').should('have.value', '25');
    });

    it('handles email input with type validation', () => {
      mount(<TextField label="Email" type="email" />);
      cy.get('input').should('have.attr', 'type', 'email');
    });

    it('handles password input masking', () => {
      mount(<TextField label="Password" type="password" />);
      cy.get('input').should('have.attr', 'type', 'password');
      cy.get('input').type('secret123');
      cy.get('input').should('have.value', 'secret123');
    });

    it('focuses and blurs correctly', () => {
      const handleFocus = cy.stub();
      const handleBlur = cy.stub();
      mount(
        <TextField 
          label="Email" 
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      );
      cy.get('input').focus();
      cy.get('input').blur();
    });
  });

  describe('State Management', () => {
    it('handles controlled component updates', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <TextField 
              label="Name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="display">{value}</div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('input').type('Alice');
      cy.get('[data-testid="display"]').should('have.text', 'Alice');
    });

    it('updates when parent value changes', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <TextField label="Count" value={count.toString()} onChange={() => {}} />
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('input').should('have.value', '0');
      cy.get('button').click();
      cy.get('input').should('have.value', '1');
    });
  });

  describe('Error States', () => {
    it('renders error styling when error=true', () => {
      mount(
        <TextField 
          label="Email" 
          error 
          helperText="Invalid email format"
        />
      );
      cy.get('input').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Invalid email format');
    });

    it('updates error state dynamically', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(false);
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          setValue(newValue);
          setError(!newValue.includes('@'));
        };

        return (
          <TextField 
            label="Email"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Must contain @' : ''}
          />
        );
      };

      mount(<TestComponent />);
      cy.get('input').type('invalid');
      cy.get('input').should('have.class', 'Mui-error');
      cy.get('input').clear().type('valid@email.com');
      cy.get('input').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled=true', () => {
      mount(<TextField label="Disabled Field" disabled />);
      cy.get('input').should('be.disabled');
    });

    it('prevents typing when disabled', () => {
      mount(<TextField label="Disabled" disabled value="locked" onChange={() => {}} />);
      cy.get('input').should('have.value', 'locked');
      cy.get('input').type('new text');
      cy.get('input').should('have.value', 'locked'); // Unchanged
    });
  });

  describe('Multiline Input', () => {
    it('renders textarea when multiline=true', () => {
      mount(<TextField label="Comments" multiline rows={4} />);
      cy.get('textarea').should('exist');
    });

    it('handles multiline text with newlines', () => {
      mount(<TextField label="Message" multiline rows={3} />);
      cy.get('textarea').type('Line 1{enter}Line 2');
      cy.get('textarea').should('contain', 'Line 1');
    });

    it('expands rows appropriately', () => {
      mount(<TextField label="Notes" multiline rows={2} />);
      cy.get('textarea').should('have.attr', 'rows', '2');
    });
  });

  describe('Accessibility', () => {
    it('has label associated with input', () => {
      mount(<TextField label="Email Address" />);
      cy.get('label').should('have.attr', 'for');
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`input#${id}`).should('exist');
      });
    });

    it('supports aria-label prop', () => {
      mount(
        <TextField 
          label="Search" 
          aria-label="Search products"
        />
      );
      cy.get('input').should('have.attr', 'aria-label', 'Search products');
    });

    it('marks required fields properly', () => {
      mount(<TextField label="Email" required />);
      cy.get('input').should('have.attr', 'required');
    });

    it('links helper text to input', () => {
      mount(
        <TextField 
          label="Password"
          helperText="Min 8 characters"
          id="password-field"
        />
      );
      cy.get('input').should('have.id', 'password-field');
    });

    it('supports keyboard navigation', () => {
      const TestComponent = () => {
        return (
          <>
            <button>Before</button>
            <TextField label="Focused" />
            <button>After</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('button').first().focus();
      cy.focused().should('contain.text', 'Before');
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'text-field-input');
      cy.focused().tab();
      cy.focused().should('contain.text', 'After');
    });
  });

  describe('Full Width', () => {
    it('stretches to full width by default', () => {
      mount(<TextField label="Full Width" fullWidth />);
      cy.get('.MuiTextField-root').should('have.css', 'width', '100%');
    });

    it('respects fullWidth=false', () => {
      mount(<TextField label="Not Full Width" fullWidth={false} />);
      cy.get('.MuiTextField-root').should('not.have.css', 'width', '100%');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long input', () => {
      const longText = 'a'.repeat(500);
      mount(<TextField label="Long Text" />);
      cy.get('input').type(longText);
      cy.get('input').should('have.value', longText);
    });

    it('handles special characters', () => {
      mount(<TextField label="Special" />);
      cy.get('input').type('!@#$%^&*()');
      cy.get('input').should('have.value', '!@#$%^&*()');
    });

    it('handles empty string correctly', () => {
      mount(<TextField label="Empty" value="" onChange={() => {}} />);
      cy.get('input').should('have.value', '');
    });

    it('trims whitespace on blur if configured', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          setValue(e.target.value.trim());
        };
        return (
          <TextField 
            label="Trim"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
          />
        );
      };

      mount(<TestComponent />);
      cy.get('input').type('  spaces  ');
      cy.get('input').blur();
      cy.get('input').should('have.value', 'spaces');
    });
  });
});
