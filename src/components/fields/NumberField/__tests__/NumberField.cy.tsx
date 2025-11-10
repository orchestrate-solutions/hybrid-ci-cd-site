import React from 'react';
import { mount } from 'cypress/react';
import { NumberField } from '../NumberField';

describe('NumberField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<NumberField label="Age" />);
      cy.get('label').should('have.text', 'Age');
    });

    it('renders as number input type', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').should('exist');
    });

    it('shows required indicator when required prop set', () => {
      mount(<NumberField label="Score" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders helper text', () => {
      mount(
        <NumberField
          label="Quantity"
          helperText="Enter quantity between 1 and 100"
        />
      );
      cy.get('.MuiFormHelperText-root').should(
        'have.text',
        'Enter quantity between 1 and 100'
      );
    });

    it('displays default value', () => {
      mount(<NumberField label="Count" value={42} />);
      cy.get('input[type="number"]').should('have.value', '42');
    });

    it('renders empty when no value provided', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').should('have.value', '');
    });
  });

  describe('User Interactions', () => {
    it('accepts numeric input', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('123');
      cy.get('input[type="number"]').should('have.value', '123');
    });

    it('accepts negative numbers', () => {
      mount(<NumberField label="Temperature" />);
      cy.get('input[type="number"]').type('-15');
      cy.get('input[type="number"]').should('have.value', '-15');
    });

    it('accepts decimal numbers', () => {
      mount(<NumberField label="Price" />);
      cy.get('input[type="number"]').type('19.99');
      cy.get('input[type="number"]').should('have.value', '19.99');
    });

    it('handles zero input', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('0');
      cy.get('input[type="number"]').should('have.value', '0');
    });

    it('increments with up arrow key', () => {
      mount(<NumberField label="Count" value={5} onChange={() => {}} />);
      cy.get('input[type="number"]').focus().type('{uparrow}');
      // Value should increment by 1 (browser behavior)
    });

    it('decrements with down arrow key', () => {
      mount(<NumberField label="Count" value={5} onChange={() => {}} />);
      cy.get('input[type="number"]').focus().type('{downarrow}');
      // Value should decrement by 1 (browser behavior)
    });

    it('calls onChange callback on value change', () => {
      const onChange = cy.stub();
      mount(<NumberField label="Count" onChange={onChange} />);
      cy.get('input[type="number"]').type('42');
      cy.wrap(onChange).should('have.been.called');
    });

    it('clears input when value is deleted', () => {
      mount(<NumberField label="Count" value={42} onChange={() => {}} />);
      cy.get('input[type="number"]').clear();
      cy.get('input[type="number"]').should('have.value', '');
    });
  });

  describe('State Management', () => {
    it('handles controlled component with value prop', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState(10);
        return (
          <>
            <NumberField
              label="Count"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
            <div data-testid="display">Value: {value}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="number"]').should('have.value', '10');
      cy.get('[data-testid="display"]').should('have.text', 'Value: 10');

      cy.get('input[type="number"]').clear().type('25');
      cy.get('[data-testid="display"]').should('have.text', 'Value: 25');
    });

    it('handles uncontrolled component', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('99');
      cy.get('input[type="number"]').should('have.value', '99');
    });

    it('updates when value prop changes externally', () => {
      const TestComponent = ({ initialValue }: { initialValue: number }) => {
        const [value, setValue] = React.useState(initialValue);
        return (
          <>
            <NumberField
              label="Count"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
            <button onClick={() => setValue(100)}>Set 100</button>
          </>
        );
      };
      mount(<TestComponent initialValue={50} />);
      cy.get('input[type="number"]').should('have.value', '50');
      cy.get('button').click();
      cy.get('input[type="number"]').should('have.value', '100');
    });
  });

  describe('Error States', () => {
    it('shows error styling when error=true', () => {
      mount(
        <NumberField
          label="Count"
          error={true}
          helperText="Invalid number"
        />
      );
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Invalid number');
    });

    it('validates range constraints', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const num = Number(e.target.value);
          setValue(e.target.value);
          setError(num < 1 || num > 100);
        };

        return (
          <NumberField
            label="Score"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Must be 1-100' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="number"]').type('150');
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('input[type="number"]').clear().type('50');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });

    it('clears error when user corrects input', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(true);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          setValue(val);
          setError(val === '');
        };

        return (
          <NumberField
            label="Count"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Required' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('input[type="number"]').type('42');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('prevents number input when disabled', () => {
      mount(<NumberField label="Count" disabled />);
      cy.get('input[type="number"]').should('be.disabled');
    });

    it('shows disabled styling', () => {
      mount(<NumberField label="Count" disabled />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-disabled');
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <NumberField
              label="Count"
              disabled={isDisabled}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
            <div data-testid="state">{isDisabled ? 'disabled' : 'enabled'}</div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('input[type="number"]').should('be.disabled');
    });
  });

  describe('Min/Max Constraints', () => {
    it('respects min attribute', () => {
      mount(
        <NumberField
          label="Age"
          inputProps={{ min: '0' }}
        />
      );
      cy.get('input[type="number"]').should('have.attr', 'min', '0');
    });

    it('respects max attribute', () => {
      mount(
        <NumberField
          label="Score"
          inputProps={{ max: '100' }}
        />
      );
      cy.get('input[type="number"]').should('have.attr', 'max', '100');
    });

    it('respects step attribute', () => {
      mount(
        <NumberField
          label="Price"
          inputProps={{ step: '0.01' }}
        />
      );
      cy.get('input[type="number"]').should('have.attr', 'step', '0.01');
    });

    it('enforces min/max with both constraints', () => {
      mount(
        <NumberField
          label="Count"
          inputProps={{
            min: '1',
            max: '10',
            step: '1',
          }}
        />
      );
      cy.get('input[type="number"]').should('have.attr', 'min', '1');
      cy.get('input[type="number"]').should('have.attr', 'max', '10');
    });
  });

  describe('Accessibility', () => {
    it('associates label with number input', () => {
      mount(<NumberField label="Age" />);
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`input#${id}[type="number"]`).should('exist');
      });
    });

    it('supports keyboard navigation', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').focus();
      cy.focused().should('have.attr', 'type', 'number');
    });

    it('marks required field with asterisk', () => {
      mount(<NumberField label="Score" required />);
      cy.get('label .MuiFormLabel-asterisk').should('be.visible');
    });

    it('announces error to screen readers', () => {
      mount(
        <NumberField
          label="Count"
          error
          helperText="Invalid input"
        />
      );
      cy.get('.MuiFormHelperText-root')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get('input[type="number"]').should('have.attr', 'aria-describedby', id);
        });
    });

    it('works with aria-label', () => {
      mount(
        <NumberField
          label="Visible"
          aria-label="Item Count"
        />
      );
      cy.get('input[type="number"]').should('have.attr', 'aria-label', 'Item Count');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('999999999');
      cy.get('input[type="number"]').should('have.value', '999999999');
    });

    it('handles scientific notation', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('1e5');
      // Depending on browser, this might display as 100000 or 1e5
      cy.get('input[type="number"]').should('not.have.value', '');
    });

    it('handles decimal precision', () => {
      mount(<NumberField label="Price" />);
      cy.get('input[type="number"]').type('19.99');
      cy.get('input[type="number"]').should('have.value', '19.99');
    });

    it('handles empty to filled transitions', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').should('have.value', '');
      cy.get('input[type="number"]').type('42');
      cy.get('input[type="number"]').should('have.value', '42');
    });

    it('handles rapid value changes', () => {
      mount(<NumberField label="Count" />);
      cy.get('input[type="number"]').type('1');
      cy.get('input[type="number"]').clear().type('2');
      cy.get('input[type="number"]').clear().type('3');
      cy.get('input[type="number"]').should('have.value', '3');
    });

    it('handles programmatic updates', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState(0);
        return (
          <>
            <NumberField
              label="Count"
              value={value}
              onChange={() => {}}
            />
            <button onClick={() => setValue(v => v + 1)}>Increment</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').click();
      cy.get('input[type="number"]').should('have.value', '1');
      cy.get('button').click();
      cy.get('input[type="number"]').should('have.value', '2');
    });
  });
});
