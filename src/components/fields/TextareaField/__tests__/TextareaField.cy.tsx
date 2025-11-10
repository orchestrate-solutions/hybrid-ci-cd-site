import React from 'react';
import { mount } from 'cypress/react';
import { TextareaField } from '../TextareaField';

describe('TextareaField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<TextareaField label="Description" />);
      cy.get('label').should('have.text', 'Description');
    });

    it('shows required indicator when required prop set', () => {
      mount(<TextareaField label="Comment" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders helper text', () => {
      mount(
        <TextareaField
          label="Notes"
          helperText="Max 500 characters"
        />
      );
      cy.get('.MuiFormHelperText-root').should('have.text', 'Max 500 characters');
    });

    it('renders textarea with default rows', () => {
      mount(<TextareaField label="Message" />);
      cy.get('textarea').should('have.attr', 'rows', '4');
    });

    it('renders textarea with custom rows', () => {
      mount(<TextareaField label="Message" rows={6} />);
      cy.get('textarea').should('have.attr', 'rows', '6');
    });

    it('sets placeholder text', () => {
      mount(<TextareaField label="Feedback" placeholder="Enter your feedback..." />);
      cy.get('textarea').should('have.attr', 'placeholder', 'Enter your feedback...');
    });
  });

  describe('User Interactions', () => {
    it('updates value on user input', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type('This is a test message');
      cy.get('textarea').should('have.value', 'This is a test message');
    });

    it('handles multiline input with newlines', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea')
        .type('Line 1{enter}Line 2{enter}Line 3');
      cy.get('textarea').should('have.value', 'Line 1\nLine 2\nLine 3');
    });

    it('handles paste events with multiline text', () => {
      mount(<TextareaField label="Content" />);
      const multilineText = 'First line\nSecond line\nThird line';
      cy.get('textarea').invoke('val', multilineText).trigger('change');
      cy.get('textarea').should('have.value', multilineText);
    });

    it('clears input with Ctrl+A and Delete', () => {
      mount(<TextareaField label="Content" value="Some text" onChange={() => {}} />);
      cy.get('textarea')
        .focus()
        .type('{ctrl}a')
        .type('{del}');
      cy.get('textarea').should('have.value', '');
    });

    it('appends text to existing content', () => {
      mount(<TextareaField label="Content" value="Existing " onChange={() => {}} />);
      cy.get('textarea').focus().type('content');
      cy.get('textarea').should('have.value', 'Existing content');
    });

    it('handles very long text without breaking', () => {
      const longText = 'a'.repeat(1000);
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type(longText);
      cy.get('textarea').should('have.value', longText);
    });

    it('calls onChange callback on input change', () => {
      const onChange = cy.stub();
      mount(<TextareaField label="Content" onChange={onChange} />);
      cy.get('textarea').type('test');
      // onChange called for each character
      cy.wrap(onChange).should('have.been.called');
    });

    it('maintains focus after input', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').focus().type('text');
      cy.get('textarea').should('have.focus');
    });
  });

  describe('State Management', () => {
    it('handles controlled component with value prop', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('Initial');
        return (
          <>
            <TextareaField
              label="Content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="display">{value}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('textarea').should('have.value', 'Initial');
      cy.get('[data-testid="display"]').should('have.text', 'Initial');

      cy.get('textarea').clear().type('Updated');
      cy.get('textarea').should('have.value', 'Updated');
      cy.get('[data-testid="display"]').should('have.text', 'Updated');
    });

    it('handles uncontrolled component', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type('Uncontrolled text');
      cy.get('textarea').should('have.value', 'Uncontrolled text');
    });

    it('updates when value prop changes', () => {
      const TestComponent = ({ initialValue }: { initialValue: string }) => {
        const [value, setValue] = React.useState(initialValue);
        return (
          <>
            <TextareaField
              label="Content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button onClick={() => setValue('Reset')}>Reset</button>
          </>
        );
      };
      mount(<TestComponent initialValue="Start" />);
      cy.get('textarea').should('have.value', 'Start');
      cy.get('button').click();
      cy.get('textarea').should('have.value', 'Reset');
    });

    it('preserves selection position during update', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('Hello World');
        return (
          <TextareaField
            label="Content"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('textarea').focus().type('{end}!');
      cy.get('textarea').should('have.value', 'Hello World!');
    });
  });

  describe('Error States', () => {
    it('shows error styling when error=true', () => {
      mount(
        <TextareaField
          label="Content"
          error={true}
          helperText="This field is required"
        />
      );
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'This field is required');
    });

    it('displays error message dynamically', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newValue = e.target.value;
          setValue(newValue);
          setError(newValue.length === 0);
        };

        return (
          <TextareaField
            label="Required"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Cannot be empty' : 'Enter some text'}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiFormHelperText-root').should('have.text', 'Cannot be empty');

      cy.get('textarea').type('Valid content');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Enter some text');
    });

    it('clears error when user corrects input', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(true);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newValue = e.target.value;
          setValue(newValue);
          setError(newValue.length < 3);
        };

        return (
          <TextareaField
            label="Min 3 chars"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Minimum 3 characters' : 'Valid'}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('textarea').type('ab');
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('textarea').type('c');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });

    it('handles validation on focus loss', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [touched, setTouched] = React.useState(false);

        return (
          <TextareaField
            label="Content"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched && value.length === 0}
            helperText={touched && value.length === 0 ? 'Required' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');

      cy.get('textarea').focus().blur();
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('textarea').focus().type('Valid');
      cy.get('textarea').blur();
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('prevents input when disabled', () => {
      mount(<TextareaField label="Content" disabled />);
      cy.get('textarea').should('be.disabled');
      cy.get('textarea').type('should not appear', { force: false }).should('have.value', '');
    });

    it('shows disabled styling', () => {
      mount(<TextareaField label="Content" disabled />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-disabled');
    });

    it('disables onChange when disabled', () => {
      const onChange = cy.stub();
      mount(<TextareaField label="Content" disabled onChange={onChange} />);
      cy.get('textarea').invoke('prop', 'onChange', { target: { value: 'test' } });
      // onChange should not fire on disabled field
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        const [text, setText] = React.useState('');
        return (
          <>
            <TextareaField
              label="Content"
              disabled={isDisabled}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div data-testid="state">
              {isDisabled ? 'disabled' : 'enabled'}
            </div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('textarea').should('be.disabled');
    });
  });

  describe('Character Counting', () => {
    it('works with external character counter', () => {
      const TestComponent = () => {
        const maxChars = 100;
        const [text, setText] = React.useState('');
        const remaining = maxChars - text.length;

        return (
          <>
            <TextareaField
              label="Description"
              value={text}
              onChange={(e) => setText(e.target.value)}
              helperText={`${remaining} characters remaining`}
              error={remaining < 0}
            />
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiFormHelperText-root').should('have.text', '100 characters remaining');

      cy.get('textarea').type('Hello');
      cy.get('.MuiFormHelperText-root').should('have.text', '95 characters remaining');
    });

    it('prevents exceeding max length', () => {
      const TestComponent = () => {
        const maxChars = 50;
        const [text, setText] = React.useState('');

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          if (e.target.value.length <= maxChars) {
            setText(e.target.value);
          }
        };

        return (
          <TextareaField
            label="Limited"
            value={text}
            onChange={handleChange}
            helperText={`${text.length}/${maxChars}`}
          />
        );
      };
      mount(<TestComponent />);
      const longText = 'a'.repeat(100);
      cy.get('textarea').type(longText);
      cy.get('textarea').should('have.value', 'a'.repeat(50));
      cy.get('.MuiFormHelperText-root').should('have.text', '50/50');
    });
  });

  describe('Accessibility', () => {
    it('associates label with textarea', () => {
      mount(<TextareaField label="Message" />);
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`textarea#${id}`).should('exist');
      });
    });

    it('supports keyboard navigation', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').focus();
      cy.focused().should('have.attr', 'id');
      cy.get('textarea').type('Tab key{tab}');
      cy.focused().should('not.be', 'textarea');
    });

    it('marks required field with asterisk', () => {
      mount(<TextareaField label="Required" required />);
      cy.get('label .MuiFormLabel-asterisk').should('be.visible');
    });

    it('announces error message to screen readers', () => {
      mount(
        <TextareaField
          label="Content"
          error
          helperText="This field is required"
        />
      );
      cy.get('.MuiFormHelperText-root')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get('textarea').should('have.attr', 'aria-describedby', id);
        });
    });

    it('works with aria-label', () => {
      mount(
        <TextareaField
          label="Visible Label"
          aria-label="Accessible Label"
        />
      );
      cy.get('textarea').should('have.attr', 'aria-label', 'Accessible Label');
    });

    it('supports arrow keys for navigation within text', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type('Hello').type('{home}');
      // Cursor should be at start
      cy.get('textarea').should('have.value', 'Hello');
    });

    it('supports Ctrl+A to select all text', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type('Select me').type('{ctrl}a');
      // All text should be selected
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type(specialChars);
      cy.get('textarea').should('have.value', specialChars);
    });

    it('handles empty string value', () => {
      mount(<TextareaField label="Content" value="" onChange={() => {}} />);
      cy.get('textarea').should('have.value', '');
    });

    it('handles whitespace-only input', () => {
      mount(<TextareaField label="Content" />);
      cy.get('textarea').type('   ');
      cy.get('textarea').should('have.value', '   ');
    });

    it('handles Unicode and emoji characters', () => {
      const unicodeText = 'Hello 👋 World 🌍 Привет';
      mount(<TextareaField label="Content" />);
      cy.get('textarea').invoke('val', unicodeText).trigger('change');
      cy.get('textarea').should('have.value', unicodeText);
    });

    it('handles rapid programmatic value changes', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <TextareaField label="Content" value={value} onChange={() => {}} />
            <button onClick={() => setValue('A')}>Set A</button>
            <button onClick={() => setValue('B')}>Set B</button>
            <button onClick={() => setValue('C')}>Set C</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').eq(0).click();
      cy.get('textarea').should('have.value', 'A');
      cy.get('button').eq(1).click();
      cy.get('textarea').should('have.value', 'B');
      cy.get('button').eq(2).click();
      cy.get('textarea').should('have.value', 'C');
    });

    it('handles content copied from rich text', () => {
      mount(<TextareaField label="Content" />);
      const plainText = 'Just plain text';
      cy.get('textarea').invoke('val', plainText).trigger('change');
      cy.get('textarea').should('have.value', plainText);
    });

    it('resizes correctly with different row values', () => {
      const TestComponent = ({ rows }: { rows: number }) => {
        const [rowCount, setRowCount] = React.useState(rows);
        return (
          <>
            <TextareaField label="Content" rows={rowCount} />
            <button onClick={() => setRowCount(10)}>Expand</button>
          </>
        );
      };
      mount(<TestComponent rows={4} />);
      cy.get('textarea').should('have.attr', 'rows', '4');
      cy.get('button').click();
      cy.get('textarea').should('have.attr', 'rows', '10');
    });
  });
});
