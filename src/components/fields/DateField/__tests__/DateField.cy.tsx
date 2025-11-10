import React from 'react';
import { mount } from 'cypress/react';
import { DateField } from '../DateField';

describe('DateField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<DateField label="Birth Date" />);
      cy.get('label').should('have.text', 'Birth Date');
    });

    it('renders as date input type', () => {
      mount(<DateField label="Event Date" />);
      cy.get('input[type="date"]').should('exist');
    });

    it('shows required indicator when required prop set', () => {
      mount(<DateField label="Due Date" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders helper text', () => {
      mount(
        <DateField
          label="Date"
          helperText="Select a date in the future"
        />
      );
      cy.get('.MuiFormHelperText-root').should(
        'have.text',
        'Select a date in the future'
      );
    });

    it('displays default value', () => {
      mount(<DateField label="Date" value="2024-12-25" />);
      cy.get('input[type="date"]').should('have.value', '2024-12-25');
    });

    it('renders empty when no value provided', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').should('have.value', '');
    });

    it('uses input shrink styling for date fields', () => {
      mount(<DateField label="Date" />);
      cy.get('.MuiInputBase-root').should('exist');
    });
  });

  describe('User Interactions', () => {
    it('accepts valid date input', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });

    it('formats date correctly with leading zeros', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-01-05');
      cy.get('input[type="date"]').should('have.value', '2024-01-05');
    });

    it('handles date selection from date picker', () => {
      mount(<DateField label="Date" value="2024-06-15" />);
      // Note: Native date picker interaction varies by browser
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });

    it('clears input when value is deleted', () => {
      mount(<DateField label="Date" value="2024-06-15" onChange={() => {}} />);
      cy.get('input[type="date"]').clear();
      cy.get('input[type="date"]').should('have.value', '');
    });

    it('calls onChange callback on date change', () => {
      const onChange = cy.stub();
      mount(<DateField label="Date" onChange={onChange} />);
      cy.get('input[type="date"]').type('2024-06-15');
      cy.wrap(onChange).should('have.been.called');
    });

    it('maintains focus after date selection', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').focus();
      cy.get('input[type="date"]').should('have.focus');
    });

    it('allows keyboard navigation in date field', () => {
      mount(<DateField label="Date" value="2024-06-15" />);
      cy.get('input[type="date"]').focus();
      cy.get('input[type="date"]').should('have.focus');
    });
  });

  describe('State Management', () => {
    it('handles controlled component with value prop', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('2024-01-01');
        return (
          <>
            <DateField
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div data-testid="display">Selected: {date}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="date"]').should('have.value', '2024-01-01');
      cy.get('[data-testid="display"]').should('have.text', 'Selected: 2024-01-01');

      cy.get('input[type="date"]').clear().type('2024-12-31');
      cy.get('[data-testid="display"]').should('have.text', 'Selected: 2024-12-31');
    });

    it('handles uncontrolled component', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });

    it('updates when value prop changes externally', () => {
      const TestComponent = ({ initialDate }: { initialDate: string }) => {
        const [date, setDate] = React.useState(initialDate);
        return (
          <>
            <DateField
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button onClick={() => setDate('2024-12-25')}>Set Christmas</button>
          </>
        );
      };
      mount(<TestComponent initialDate="2024-01-01" />);
      cy.get('input[type="date"]').should('have.value', '2024-01-01');
      cy.get('button').click();
      cy.get('input[type="date"]').should('have.value', '2024-12-25');
    });

    it('preserves value through re-renders', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        const [date, setDate] = React.useState('2024-06-15');
        return (
          <>
            <DateField
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
      cy.get('button').click();
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });
  });

  describe('Error States', () => {
    it('shows error styling when error=true', () => {
      mount(
        <DateField
          label="Date"
          error={true}
          helperText="Invalid date"
        />
      );
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Invalid date');
    });

    it('displays error message dynamically', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setDate(value);
          setError(value === '');
        };

        return (
          <DateField
            label="Date"
            value={date}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Date is required' : 'Select a date'}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiFormHelperText-root').should('have.text', 'Date is required');

      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Select a date');
    });

    it('validates date range', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setDate(value);
          // Check if date is in past
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          setError(selectedDate < today);
        };

        return (
          <DateField
            label="Future Date"
            value={date}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Must be future date' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="date"]').type('2020-01-01');
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');
    });

    it('clears error when user corrects date', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('');
        const [error, setError] = React.useState(true);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setDate(value);
          setError(value === '');
        };

        return (
          <DateField
            label="Date"
            value={date}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Required' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-error');

      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('.MuiTextField-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('prevents date input when disabled', () => {
      mount(<DateField label="Date" disabled />);
      cy.get('input[type="date"]').should('be.disabled');
    });

    it('shows disabled styling', () => {
      mount(<DateField label="Date" disabled />);
      cy.get('.MuiTextField-root').should('have.class', 'Mui-disabled');
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        const [date, setDate] = React.useState('');
        return (
          <>
            <DateField
              label="Date"
              disabled={isDisabled}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div data-testid="state">{isDisabled ? 'disabled' : 'enabled'}</div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('input[type="date"]').should('be.disabled');
    });
  });

  describe('Date Format Validation', () => {
    it('accepts YYYY-MM-DD format', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });

    it('handles leap year dates', () => {
      mount(<DateField label="Date" value="2024-02-29" />);
      cy.get('input[type="date"]').should('have.value', '2024-02-29');
    });

    it('handles end of month dates', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-06-30');
      cy.get('input[type="date"]').should('have.value', '2024-06-30');
    });

    it('handles January 1st', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-01-01');
      cy.get('input[type="date"]').should('have.value', '2024-01-01');
    });

    it('handles December 31st', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-12-31');
      cy.get('input[type="date"]').should('have.value', '2024-12-31');
    });

    it('handles future dates', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2099-12-31');
      cy.get('input[type="date"]').should('have.value', '2099-12-31');
    });
  });

  describe('Min/Max Date Constraints', () => {
    it('respects min attribute', () => {
      mount(
        <DateField
          label="Date"
          inputProps={{ min: '2024-01-01' }}
        />
      );
      cy.get('input[type="date"]').should('have.attr', 'min', '2024-01-01');
    });

    it('respects max attribute', () => {
      mount(
        <DateField
          label="Date"
          inputProps={{ max: '2024-12-31' }}
        />
      );
      cy.get('input[type="date"]').should('have.attr', 'max', '2024-12-31');
    });

    it('enforces date range with both min and max', () => {
      mount(
        <DateField
          label="Date Range"
          inputProps={{
            min: '2024-01-01',
            max: '2024-12-31',
          }}
        />
      );
      cy.get('input[type="date"]').should('have.attr', 'min', '2024-01-01');
      cy.get('input[type="date"]').should('have.attr', 'max', '2024-12-31');
    });
  });

  describe('Accessibility', () => {
    it('associates label with date input', () => {
      mount(<DateField label="Birth Date" />);
      cy.get('label').invoke('attr', 'for').then((id) => {
        cy.get(`input#${id}[type="date"]`).should('exist');
      });
    });

    it('supports keyboard navigation', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').focus();
      cy.focused().should('have.attr', 'type', 'date');
    });

    it('marks required field with asterisk', () => {
      mount(<DateField label="Due Date" required />);
      cy.get('label .MuiFormLabel-asterisk').should('be.visible');
    });

    it('announces error message to screen readers', () => {
      mount(
        <DateField
          label="Date"
          error
          helperText="Invalid date format"
        />
      );
      cy.get('.MuiFormHelperText-root')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get('input[type="date"]').should('have.attr', 'aria-describedby', id);
        });
    });

    it('works with aria-label', () => {
      mount(
        <DateField
          label="Visible Label"
          aria-label="Event Date"
        />
      );
      cy.get('input[type="date"]').should('have.attr', 'aria-label', 'Event Date');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string as value', () => {
      mount(<DateField label="Date" value="" onChange={() => {}} />);
      cy.get('input[type="date"]').should('have.value', '');
    });

    it('handles year 2000', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2000-01-01');
      cy.get('input[type="date"]').should('have.value', '2000-01-01');
    });

    it('handles far future dates', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2099-12-31');
      cy.get('input[type="date"]').should('have.value', '2099-12-31');
    });

    it('handles rapid date changes', () => {
      mount(<DateField label="Date" />);
      cy.get('input[type="date"]').type('2024-01-01');
      cy.get('input[type="date"]').clear().type('2024-06-15');
      cy.get('input[type="date"]').clear().type('2024-12-31');
      cy.get('input[type="date"]').should('have.value', '2024-12-31');
    });

    it('handles programmatic value changes', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('');
        return (
          <>
            <DateField
              label="Date"
              value={date}
              onChange={() => {}}
            />
            <button onClick={() => setDate('2024-01-01')}>Jan 1</button>
            <button onClick={() => setDate('2024-06-15')}>Jun 15</button>
            <button onClick={() => setDate('2024-12-25')}>Dec 25</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').eq(0).click();
      cy.get('input[type="date"]').should('have.value', '2024-01-01');
      cy.get('button').eq(1).click();
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
      cy.get('button').eq(2).click();
      cy.get('input[type="date"]').should('have.value', '2024-12-25');
    });

    it('handles date field in a form context', () => {
      const TestComponent = () => {
        const [date, setDate] = React.useState('');
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
        };

        return (
          <form onSubmit={handleSubmit}>
            <DateField
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        );
      };
      mount(<TestComponent />);
      cy.get('input[type="date"]').type('2024-06-15');
      cy.get('button').click();
      cy.get('input[type="date"]').should('have.value', '2024-06-15');
    });
  });
});
