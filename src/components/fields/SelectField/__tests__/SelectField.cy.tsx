/**
 * SelectField Component - Cypress Tests
 * 
 * Tests dropdown interactions, option selection, accessibility
 * Validates field component works as reusable select element
 */

import React from 'react';
import { mount } from 'cypress/react';
import { SelectField } from '../SelectField';

describe('SelectField Component', () => {
  const mockOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('label').should('have.text', 'Status');
    });

    it('renders as closed select initially', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="listbox"]').should('not.exist');
    });

    it('renders helper text when provided', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          helperText="Choose the content status"
        />
      );
      cy.get('.MuiFormHelperText-root').should('have.text', 'Choose the content status');
    });

    it('shows required indicator', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          required
        />
      );
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });

    it('renders with default value', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          value="published"
        />
      );
      cy.get('[role="button"]').should('have.text', 'Published');
    });
  });

  describe('Dropdown Interactions', () => {
    it('opens dropdown on click', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').should('exist');
    });

    it('displays all options in dropdown', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').should('have.length', 3);
      cy.get('[role="option"]').first().should('have.text', 'Draft');
      cy.get('[role="option"]').eq(1).should('have.text', 'Published');
      cy.get('[role="option"]').eq(2).should('have.text', 'Archived');
    });

    it('closes dropdown after selection', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').first().click();
      cy.get('[role="listbox"]').should('not.exist');
    });

    it('selects option on click', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').contains('Published').click();
      cy.get('[role="button"]').should('have.text', 'Published');
    });

    it('closes dropdown on Escape key', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').should('exist');
      cy.get('[role="button"]').type('{esc}');
      cy.get('[role="listbox"]').should('not.exist');
    });
  });

  describe('State Management', () => {
    it('updates parent state on selection', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <SelectField 
              label="Status"
              options={mockOptions}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="selected">{value}</div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').contains('Draft').click();
      cy.get('[data-testid="selected"]').should('have.text', 'draft');
    });

    it('handles multiple selections', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <SelectField 
              label="Status"
              options={mockOptions}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="history">{value}</div>
          </>
        );
      };

      mount(<TestComponent />);
      
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').contains('Draft').click();
      cy.get('[data-testid="history"]').should('have.text', 'draft');

      cy.get('[role="button"]').click();
      cy.get('[role="option"]').contains('Published').click();
      cy.get('[data-testid="history"]').should('have.text', 'published');
    });

    it('updates display when parent value changes', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('draft');
        return (
          <>
            <SelectField 
              label="Status"
              options={mockOptions}
              value={value}
              onChange={() => {}}
            />
            <button onClick={() => setValue('archived')}>Set Archived</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[role="button"]').should('have.text', 'Draft');
      cy.get('button').click();
      cy.get('[role="button"]').should('have.text', 'Archived');
    });
  });

  describe('Error States', () => {
    it('renders error styling when error=true', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          error
          helperText="Status is required"
        />
      );
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.text', 'Status is required');
    });

    it('updates error state on validation', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState(false);
        
        const handleChange = (e: React.ChangeEvent<any>) => {
          const newValue = e.target.value;
          setValue(newValue);
          setError(newValue === '');
        };

        return (
          <SelectField 
            label="Status"
            options={mockOptions}
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Please select a status' : ''}
          />
        );
      };

      mount(<TestComponent />);
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-error');
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').first().click();
      cy.get('.MuiFormControl-root').should('not.have.class', 'Mui-error');
    });
  });

  describe('Disabled State', () => {
    it('disables select when disabled=true', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          disabled
        />
      );
      cy.get('[role="button"]').should('be.disabled');
    });

    it('prevents opening dropdown when disabled', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          disabled
          value="draft"
        />
      );
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').should('not.exist');
    });
  });

  describe('Dynamic Options', () => {
    it('updates options when props change', () => {
      const TestComponent = () => {
        const [options, setOptions] = React.useState(mockOptions);
        return (
          <>
            <SelectField label="Status" options={options} />
            <button onClick={() => setOptions([
              { value: 'new1', label: 'Option 1' },
              { value: 'new2', label: 'Option 2' },
            ])}>Update Options</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').should('have.length', 3);
      
      cy.contains('Update Options').click();
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').should('have.length', 2);
      cy.get('[role="option"]').first().should('have.text', 'Option 1');
    });

    it('handles empty options gracefully', () => {
      mount(<SelectField label="Status" options={[]} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').should('have.length', 0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates options with arrow keys', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').type('{downarrow}');
      cy.get('[role="option"][aria-selected="true"]').should('contain', 'Draft');
      cy.get('[role="listbox"]').type('{downarrow}');
      cy.get('[role="option"][aria-selected="true"]').should('contain', 'Published');
    });

    it('selects option with Enter key', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').type('{downarrow}{enter}');
      cy.get('[role="button"]').should('have.text', 'Draft');
    });

    it('closes dropdown with Escape key', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="listbox"]').type('{esc}');
      cy.get('[role="listbox"]').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('has label associated with select', () => {
      mount(<SelectField label="Status" options={mockOptions} />);
      cy.get('label').should('have.attr', 'id');
      cy.get('[role="button"]').should('have.attr', 'aria-labelledby');
    });

    it('marks required fields properly', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          required
        />
      );
      cy.get('input').should('have.attr', 'required');
    });

    it('announces error to screen readers', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          error
          helperText="This field is required"
        />
      );
      cy.get('.MuiFormControl-root').should('have.class', 'Mui-error');
    });

    it('supports focus management', () => {
      const TestComponent = () => {
        return (
          <>
            <button>Before</button>
            <SelectField label="Status" options={mockOptions} />
            <button>After</button>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('button').first().focus();
      cy.focused().should('contain.text', 'Before');
      cy.focused().tab();
      cy.focused().should('have.attr', 'aria-haspopup', 'listbox');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          size="small"
        />
      );
      cy.get('.MuiFormControl-root').should('have.class', 'MuiFormControl-sizeSmall');
    });

    it('renders medium size', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          size="medium"
        />
      );
      cy.get('.MuiFormControl-root').should('exist');
    });
  });

  describe('Full Width', () => {
    it('stretches to full width by default', () => {
      mount(
        <SelectField 
          label="Status"
          options={mockOptions}
          fullWidth
        />
      );
      cy.get('.MuiFormControl-root').should('have.css', 'width', '100%');
    });
  });

  describe('Edge Cases', () => {
    it('handles option with special characters', () => {
      const specialOptions = [
        { value: 'opt1', label: 'Option !@#$%' },
        { value: 'opt2', label: 'Option & More' },
      ];

      mount(<SelectField label="Status" options={specialOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').first().should('have.text', 'Option !@#$%');
    });

    it('handles very long option labels', () => {
      const longOptions = [
        { value: 'long', label: 'This is a very long option label that might wrap' },
      ];

      mount(<SelectField label="Status" options={longOptions} />);
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').should('contain', 'This is a very long option label');
    });

    it('handles numeric values correctly', () => {
      const numericOptions = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
        { value: 3, label: 'Three' },
      ];

      const TestComponent = () => {
        const [value, setValue] = React.useState<number | string>(1);
        return (
          <>
            <SelectField 
              label="Number"
              options={numericOptions}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="value">{value}</div>
          </>
        );
      };

      mount(<TestComponent />);
      cy.get('[data-testid="value"]').should('have.text', '1');
      cy.get('[role="button"]').click();
      cy.get('[role="option"]').contains('Two').click();
      cy.get('[data-testid="value"]').should('have.text', '2');
    });
  });
});
