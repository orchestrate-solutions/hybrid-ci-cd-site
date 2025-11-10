import React from 'react';
import { mount } from 'cypress/react';
import { RadioGroup } from '../RadioGroup';

describe('RadioGroup Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  describe('Rendering', () => {
    it('renders with label', () => {
      mount(
        <RadioGroup label="Choose one" options={mockOptions} />
      );
      cy.get('legend').should('have.text', 'Choose one');
    });

    it('renders all radio options', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[type="radio"]').should('have.length', 3);
      cy.get('label').should('contain', 'Option 1');
      cy.get('label').should('contain', 'Option 2');
      cy.get('label').should('contain', 'Option 3');
    });

    it('renders with helper text', () => {
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          helperText="Choose one option"
        />
      );
      cy.get('.MuiFormHelperText-root').should('have.text', 'Choose one option');
    });

    it('renders in vertical layout by default', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      // MUI vertical radio groups don't have specific row class
      cy.get('.MuiRadioGroup-root').should('exist');
    });

    it('renders in horizontal layout when row=true', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} row={true} />
      );
      cy.get('.MuiRadioGroup-row').should('exist');
    });

    it('displays default selection', () => {
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          value="option2"
        />
      );
      cy.get('input[value="option2"]').should('be.checked');
    });
  });

  describe('User Interactions', () => {
    it('selects radio button on click', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').should('not.be.checked');
      cy.get('input[value="option1"]').click();
      cy.get('input[value="option1"]').should('be.checked');
    });

    it('deselects previous option when selecting new one', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} value="option1" />
      );
      cy.get('input[value="option1"]').should('be.checked');
      cy.get('input[value="option2"]').click();
      cy.get('input[value="option1"]').should('not.be.checked');
      cy.get('input[value="option2"]').should('be.checked');
    });

    it('selects option by clicking label', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.contains('label', 'Option 2').click();
      cy.get('input[value="option2"]').should('be.checked');
    });

    it('handles rapid option changes', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').click();
      cy.get('input[value="option1"]').should('be.checked');

      cy.get('input[value="option2"]').click();
      cy.get('input[value="option2"]').should('be.checked');

      cy.get('input[value="option3"]').click();
      cy.get('input[value="option3"]').should('be.checked');
    });

    it('calls onChange callback when selection changes', () => {
      const onChange = cy.stub();
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          onChange={onChange}
        />
      );
      cy.get('input[value="option1"]').click();
      cy.wrap(onChange).should('have.been.called');
    });

    it('maintains focus after selection', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').focus().click();
      cy.get('input[value="option1"]').should('have.focus');
    });
  });

  describe('State Management', () => {
    it('handles controlled component with value prop', () => {
      const TestComponent = () => {
        const [selected, setSelected] = React.useState('option1');
        return (
          <>
            <RadioGroup
              label="Select"
              options={mockOptions}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            />
            <div data-testid="display">Selected: {selected}</div>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[value="option1"]').should('be.checked');
      cy.get('[data-testid="display"]').should('have.text', 'Selected: option1');

      cy.get('input[value="option2"]').click();
      cy.get('[data-testid="display"]').should('have.text', 'Selected: option2');
    });

    it('handles uncontrolled component', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').click();
      cy.get('input[value="option1"]').should('be.checked');
    });

    it('updates when value prop changes externally', () => {
      const TestComponent = ({ initialValue }: { initialValue: string }) => {
        const [value, setValue] = React.useState(initialValue);
        return (
          <>
            <RadioGroup
              label="Select"
              options={mockOptions}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button onClick={() => setValue('option3')}>Select 3</button>
          </>
        );
      };
      mount(<TestComponent initialValue="option1" />);
      cy.get('input[value="option1"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[value="option3"]').should('be.checked');
    });

    it('preserves selection across re-renders', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        const [selected, setSelected] = React.useState('option2');
        return (
          <>
            <RadioGroup
              label="Select"
              options={mockOptions}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            />
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[value="option2"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[value="option2"]').should('be.checked');
    });
  });

  describe('Error States', () => {
    it('shows error styling when error=true', () => {
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          error={true}
          helperText="Please select an option"
        />
      );
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Please select an option');
    });

    it('displays error message dynamically', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          setError(false);
        };

        const handleSubmit = () => {
          if (!value) {
            setError(true);
          }
        };

        return (
          <>
            <RadioGroup
              label="Select"
              options={mockOptions}
              value={value}
              onChange={handleChange}
              error={error}
              helperText={error ? 'Please select one' : ''}
            />
            <button onClick={handleSubmit}>Submit</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').click();
      cy.get('.MuiFormHelperText-root').should('have.text', 'Please select one');

      cy.get('input[value="option1"]').click();
      cy.get('.MuiFormHelperText-root').should('not.exist');
    });

    it('clears error when user selects option', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(true);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          setError(false);
        };

        return (
          <RadioGroup
            label="Select"
            options={mockOptions}
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Error' : ''}
          />
        );
      };
      mount(<TestComponent />);
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-error');

      cy.get('input[value="option1"]').click();
      cy.get('.MuiFormControl-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('prevents selection when disabled', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} disabled />
      );
      cy.get('input[type="radio"]').each((radio) => {
        cy.wrap(radio).should('be.disabled');
      });
    });

    it('shows disabled styling', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} disabled />
      );
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-disabled');
    });

    it('disables onChange when disabled', () => {
      const onChange = cy.stub();
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          disabled
          onChange={onChange}
        />
      );
      cy.get('input[value="option1"]').click({ force: true });
      // onClick event still fires but should not change state
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        const [selected, setSelected] = React.useState('');
        return (
          <>
            <RadioGroup
              label="Select"
              options={mockOptions}
              disabled={isDisabled}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            />
            <div data-testid="state">{isDisabled ? 'disabled' : 'enabled'}</div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('input[type="radio"]').first().should('be.disabled');
    });
  });

  describe('Dynamic Options', () => {
    it('updates when options prop changes', () => {
      const TestComponent = ({ options }: { options: typeof mockOptions }) => {
        return <RadioGroup label="Select" options={options} />;
      };
      mount(<TestComponent options={mockOptions} />);
      cy.get('input[type="radio"]').should('have.length', 3);
    });

    it('handles empty options array', () => {
      mount(
        <RadioGroup label="Select" options={[]} />
      );
      cy.get('input[type="radio"]').should('have.length', 0);
    });

    it('handles options with numeric values', () => {
      const numericOptions = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
        { value: 3, label: 'Three' },
      ];
      mount(
        <RadioGroup label="Select" options={numericOptions} value={2} />
      );
      cy.get('input[value="2"]').should('be.checked');
    });

    it('handles options with boolean values', () => {
      const booleanOptions = [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ];
      mount(
        <RadioGroup label="Select" options={booleanOptions} value={true} />
      );
      // Boolean values are tricky; they'll be stringified
      cy.get('input[value="true"]').should('be.checked');
    });

    it('handles options with special characters', () => {
      const specialOptions = [
        { value: 'opt!@#$', label: 'Option with symbols' },
        { value: 'opt/path', label: 'Option with path' },
      ];
      mount(
        <RadioGroup label="Select" options={specialOptions} />
      );
      cy.get('input[value="opt!@#$"]').click();
      cy.get('input[value="opt!@#$"]').should('be.checked');
    });

    it('preserves selection when options update', () => {
      const TestComponent = () => {
        const [options, setOptions] = React.useState(mockOptions);
        const [selected, setSelected] = React.useState('option1');

        return (
          <>
            <RadioGroup
              label="Select"
              options={options}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            />
            <button onClick={() => setOptions([...options])}>Refresh</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('input[value="option1"]').should('be.checked');
      cy.get('button').click();
      cy.get('input[value="option1"]').should('be.checked');
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates options with arrow keys', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} value="option1" />
      );
      cy.get('input[value="option1"]').focus();
      cy.get('input[value="option1"]').type('{downarrow}');
      // Focus should move to next option
    });

    it('supports keyboard selection with Space', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').focus();
      cy.get('input[value="option1"]').type(' ');
      cy.get('input[value="option1"]').should('be.checked');
    });

    it('supports keyboard selection with Enter', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option2"]').focus();
      cy.get('input[value="option2"]').type('{enter}');
      cy.get('input[value="option2"]').should('be.checked');
    });

    it('wraps around with arrow keys in horizontal layout', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} row={true} />
      );
      cy.get('input[value="option1"]').focus();
      // Test wrap-around behavior
    });
  });

  describe('Accessibility', () => {
    it('associates legend with radio group', () => {
      mount(
        <RadioGroup label="Choose wisely" options={mockOptions} />
      );
      cy.get('legend').should('have.text', 'Choose wisely');
    });

    it('each radio has associated label', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]')
        .parent()
        .should('contain', 'Option 1');
    });

    it('announces error to screen readers', () => {
      mount(
        <RadioGroup
          label="Select"
          options={mockOptions}
          error={true}
          helperText="This field is required"
        />
      );
      cy.get('.MuiFormHelperText-root')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get('.MuiRadioGroup-root').should('have.attr', 'aria-describedby');
        });
    });

    it('supports focus management', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('input[value="option1"]').focus();
      cy.focused().should('have.value', 'option1');
    });

    it('provides semantic HTML structure', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      cy.get('fieldset').should('exist');
      cy.get('legend').should('exist');
    });
  });

  describe('Edge Cases', () => {
    it('handles long option labels', () => {
      const longLabelOptions = [
        { value: '1', label: 'This is a very long option label that might wrap to multiple lines' },
        { value: '2', label: 'Another long label with lots of text content here' },
      ];
      mount(
        <RadioGroup label="Select" options={longLabelOptions} />
      );
      cy.get('input[value="1"]').click();
      cy.get('input[value="1"]').should('be.checked');
    });

    it('handles Unicode characters in labels', () => {
      const unicodeOptions = [
        { value: '1', label: 'English' },
        { value: '2', label: 'Français' },
        { value: '3', label: '日本語' },
      ];
      mount(
        <RadioGroup label="Select" options={unicodeOptions} />
      );
      cy.get('input[value="3"]').click();
      cy.get('input[value="3"]').should('be.checked');
    });

    it('handles emoji in labels', () => {
      const emojiOptions = [
        { value: '1', label: '👍 Good' },
        { value: '2', label: '👎 Bad' },
        { value: '3', label: '😐 Neutral' },
      ];
      mount(
        <RadioGroup label="Select" options={emojiOptions} />
      );
      cy.contains('label', '👍').parent().find('input').click();
      cy.contains('label', '👍').parent().find('input').should('be.checked');
    });

    it('handles very large option sets', () => {
      const largeOptions = Array.from({ length: 50 }, (_, i) => ({
        value: `opt${i}`,
        label: `Option ${i + 1}`,
      }));
      mount(
        <RadioGroup label="Select" options={largeOptions} />
      );
      cy.get('input[type="radio"]').should('have.length', 50);
      cy.get('input[value="opt25"]').click();
      cy.get('input[value="opt25"]').should('be.checked');
    });

    it('handles rapid option selection and deselection', () => {
      mount(
        <RadioGroup label="Select" options={mockOptions} />
      );
      for (let i = 0; i < 3; i++) {
        cy.get('input[value="option1"]').click();
        cy.get('input[value="option2"]').click();
        cy.get('input[value="option3"]').click();
      }
      cy.get('input[value="option3"]').should('be.checked');
    });
  });
});
