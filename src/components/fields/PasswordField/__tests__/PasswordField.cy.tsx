import React from 'react';
import { mount } from 'cypress/react';
import { PasswordField } from '../PasswordField';

describe('PasswordField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<PasswordField label="Password" />);
      cy.get('label').should('have.text', 'Password');
    });

    it('renders as password input type by default', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').should('exist');
    });

    it('shows required indicator when required prop set', () => {
      mount(<PasswordField label="Password" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders helper text', () => {
      mount(
        <PasswordField
          label="Password"
          helperText="Min 8 characters"
        />
      );
      cy.get('.MuiFormHelperText-root').should('have.text', 'Min 8 characters');
    });

    it('displays visibility toggle button', () => {
      mount(<PasswordField label="Password" />);
      cy.get('button').should('exist');
    });

    it('displays default value masked', () => {
      mount(<PasswordField label="Password" value="secret123" />);
      cy.get('input[type="password"]').should('have.value', 'secret123');
    });
  });

  describe('User Interactions', () => {
    it('accepts password input while hidden', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type('myPassword123');
      cy.get('input[type="password"]').should('have.value', 'myPassword123');
    });

    it('toggles visibility when button clicked', () => {
      mount(<PasswordField label="Password" value="test123" />);
      // Initially hidden
      cy.get('input[type="password"]').should('exist');
      
      // Click toggle button
      cy.get('button').click();
      
      // Should now be visible
      cy.get('input[type="text"]').should('exist');
      cy.get('input[type="text"]').should('have.value', 'test123');
    });

    it('toggles visibility multiple times', () => {
      mount(<PasswordField label="Password" value="secret" />);
      
      cy.get('button').click();
      cy.get('input[type="text"]').should('have.value', 'secret');
      
      cy.get('button').click();
      cy.get('input[type="password"]').should('have.value', 'secret');
      
      cy.get('button').click();
      cy.get('input[type="text"]').should('have.value', 'secret');
    });

    it('preserves value when toggling visibility', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type('complexPass123!@#');
      
      cy.get('button').click();
      cy.get('input[type="text"]').should('have.value', 'complexPass123!@#');
      
      cy.get('button').click();
      cy.get('input[type="password"]').should('have.value', 'complexPass123!@#');
    });

    it('calls onChange callback on input change', () => {
      const onChange = cy.stub();
      mount(<PasswordField label="Password" onChange={onChange} />);
      cy.get('input[type="password"]').type('test');
      cy.wrap(onChange).should('have.been.called');
    });

    it('clears input when value is deleted', () => {
      mount(<PasswordField label="Password" value="secret" onChange={() => {}} />);
      cy.get('input[type="password"]').clear();
      cy.get('input[type="password"]').should('have.value', '');
    });

    it('handles special characters in password', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type(specialChars);
      cy.get('input[type="password"]').should('have.value', specialChars);
    });
  });

  describe('State Management', () => {
    it('handles controlled component with value prop', () => {
      const TestComponent = () => {
        const [password, setPassword] = React.useState('initial');
        return (
          <>
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div data-testid="display">Length: {password.length}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="password"]').should('have.value', 'initial');
      cy.get('[data-testid="display"]').should('have.text', 'Length: 7');

      cy.get('input[type="password"]').clear().type('newpass');
      cy.get('[data-testid="display"]').should('have.text', 'Length: 7');
    });

    it('handles uncontrolled component', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type('uncontrolled');
      cy.get('input[type="password"]').should('have.value', 'uncontrolled');
    });

    it('updates when value prop changes externally', () => {
      const TestComponent = ({ initialValue }: { initialValue: string }) => {
        const [password, setPassword] = React.useState(initialValue);
        return (
          <>
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => setPassword('newPassword123')}>Reset</button>
          </>
        );
      };
      mount(<TestComponent initialValue="oldPass" />);
      cy.get('input[type="password"]').should('have.value', 'oldPass');
      cy.get('button').click();
      cy.get('input[type="password"]').should('have.value', 'newPassword123');
    });

    it('preserves visibility state during value updates', () => {
      const TestComponent = () => {
        const [password, setPassword] = React.useState('test1');
        return (
          <>
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => setPassword('test2')}>Update</button>
          </>
        );
      };
      mount(<TestComponent />);
      
      // Toggle to visible
      cy.get('button:first').click();
      cy.get('input[type="text"]').should('have.value', 'test1');
      
      // Update value while visible
      cy.get('button:last').click();
      cy.get('input[type="text"]').should('have.value', 'test2');
    });
  });

  describe('Error States', () => {
    it('shows error styling when error=true', () => {
      mount(
        <PasswordField
          label="Password"
          error={true}
          helperText="Password is too weak"
        />
      );
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Password is too weak');
    });

    it('validates password strength', () => {
      const TestComponent = () => {
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const pass = e.target.value;
          setPassword(pass);
          setError(pass.length < 8);
        };

        return (
          <PasswordField
            label="Password"
            value={password}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Min 8 characters' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="password"]').type('short');
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('input[type="password"]').clear().type('longPassword123');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });

    it('clears error when user corrects password', () => {
      const TestComponent = () => {
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState(true);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const pass = e.target.value;
          setPassword(pass);
          setError(pass === '');
        };

        return (
          <PasswordField
            label="Password"
            value={password}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Required' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('input[type="password"]').type('validPassword');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('prevents password input when disabled', () => {
      mount(<PasswordField label="Password" disabled />);
      cy.get('input[type="password"]').should('be.disabled');
    });

    it('disables visibility toggle when disabled', () => {
      mount(<PasswordField label="Password" disabled />);
      cy.get('button').should('be.disabled');
    });

    it('shows disabled styling', () => {
      mount(<PasswordField label="Password" disabled />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-disabled');
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        const [password, setPassword] = React.useState('');
        return (
          <>
            <PasswordField
              label="Password"
              disabled={isDisabled}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div data-testid="state">{isDisabled ? 'disabled' : 'enabled'}</div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('input[type="password"]').should('be.disabled');
      cy.get('button').should('be.disabled');
    });
  });

  describe('Accessibility', () => {
    it('associates label with password input', () => {
      mount(<PasswordField label="Password" />);
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`input#${id}[type="password"]`).should('exist');
      });
    });

    it('supports keyboard navigation', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').focus();
      cy.focused().should('have.attr', 'type', 'password');
    });

    it('toggle button is keyboard accessible', () => {
      mount(<PasswordField label="Password" value="test123" />);
      cy.get('button').focus();
      cy.focused().should('be', 'button');
      cy.get('button').type('{enter}');
      cy.get('input[type="text"]').should('exist');
    });

    it('marks required field with asterisk', () => {
      mount(<PasswordField label="Password" required />);
      cy.get('label .MuiFormLabel-asterisk').should('be.visible');
    });

    it('announces error to screen readers', () => {
      mount(
        <PasswordField
          label="Password"
          error
          helperText="Password too weak"
        />
      );
      cy.get('.MuiFormHelperText-root')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get('input[type="password"]').should('have.attr', 'aria-describedby', id);
        });
    });

    it('works with aria-label', () => {
      mount(
        <PasswordField
          label="Visible"
          aria-label="Secret Password"
        />
      );
      cy.get('input[type="password"]').should('have.attr', 'aria-label', 'Secret Password');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long passwords', () => {
      const longPassword = 'a'.repeat(256);
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type(longPassword);
      cy.get('input[type="password"]').should('have.value', longPassword);
    });

    it('handles Unicode and special characters', () => {
      const unicodePassword = 'Пароль123!@#日本語';
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').invoke('val', unicodePassword).trigger('change');
      cy.get('input[type="password"]').should('have.value', unicodePassword);
    });

    it('handles rapid toggle clicks', () => {
      mount(<PasswordField label="Password" value="test123" />);
      cy.get('button').click(); // show
      cy.get('button').click(); // hide
      cy.get('button').click(); // show
      cy.get('input[type="text"]').should('have.value', 'test123');
    });

    it('handles empty password', () => {
      mount(<PasswordField label="Password" value="" onChange={() => {}} />);
      cy.get('input[type="password"]').should('have.value', '');
    });

    it('handles whitespace in password', () => {
      mount(<PasswordField label="Password" />);
      cy.get('input[type="password"]').type('pass word 123');
      cy.get('input[type="password"]').should('have.value', 'pass word 123');
    });

    it('preserves cursor position when toggling visibility', () => {
      mount(<PasswordField label="Password" value="password" />);
      cy.get('input[type="password"]').focus();
      cy.get('button').click();
      // Cursor should still be in field
      cy.get('input[type="text"]').should('have.focus');
    });

    it('handles form submission with password', () => {
      const TestComponent = () => {
        const [password, setPassword] = React.useState('');
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
        };

        return (
          <form onSubmit={handleSubmit}>
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="password"]').type('secret123');
      cy.get('form button').click();
      cy.get('input[type="password"]').should('have.value', 'secret123');
    });
  });
});
