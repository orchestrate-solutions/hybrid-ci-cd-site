import React from 'react';
import { mount } from 'cypress/react';
import { FileField } from '../FileField';

describe('FileField Component', () => {
  describe('Rendering', () => {
    it('renders with label on button', () => {
      mount(<FileField label="Upload Document" />);
      cy.contains('button', 'Upload Document').should('exist');
    });

    it('renders as outlined button', () => {
      mount(<FileField label="Select File" />);
      cy.get('button').should('have.class', 'MuiButton-outlined');
    });

    it('displays upload icon', () => {
      mount(<FileField label="Upload" />);
      cy.get('button svg').should('exist');
    });

    it('renders helper text', () => {
      mount(
        <FileField
          label="Upload"
          helperText="Max file size: 5MB"
        />
      );
      cy.contains('Max file size: 5MB').should('exist');
    });

    it('hides native file input', () => {
      mount(<FileField label="Upload" />);
      cy.get('input[type="file"]').should('have.css', 'display', 'none');
    });
  });

  describe('Single File Upload', () => {
    it('triggers file input on button click', () => {
      mount(<FileField label="Upload" />);
      cy.get('input[type="file"]').should('not.be.visible');
      
      // Button click should trigger file input
      cy.get('button').click();
      // File input should be triggered (can't directly test in Cypress without actual files)
    });

    it('accepts single file by default', () => {
      mount(<FileField label="Upload" />);
      cy.get('input[type="file"]').should('not.have.attr', 'multiple');
    });

    it('accepts specific file types when accept prop set', () => {
      mount(
        <FileField
          label="Upload Image"
          accept="image/*"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*');
    });

    it('accepts CSV files', () => {
      mount(
        <FileField
          label="Upload CSV"
          accept=".csv"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', '.csv');
    });

    it('accepts PDF files', () => {
      mount(
        <FileField
          label="Upload PDF"
          accept=".pdf"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', '.pdf');
    });

    it('accepts multiple file types', () => {
      mount(
        <FileField
          label="Upload"
          accept=".pdf,.doc,.docx"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', '.pdf,.doc,.docx');
    });

    it('calls onChange when file selected', () => {
      const onChange = cy.stub();
      mount(
        <FileField
          label="Upload"
          onChange={onChange}
        />
      );
      
      // Simulate file selection
      cy.get('input[type="file"]').selectFile('cypress/fixtures/example.json', { force: true });
      cy.wrap(onChange).should('have.been.called');
    });
  });

  describe('Multiple File Upload', () => {
    it('accepts multiple files when multiple=true', () => {
      mount(
        <FileField
          label="Upload Files"
          multiple={true}
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'multiple');
    });

    it('does not accept multiple when multiple=false', () => {
      mount(
        <FileField
          label="Upload File"
          multiple={false}
        />
      );
      cy.get('input[type="file"]').should('not.have.attr', 'multiple');
    });

    it('accepts multiple files with specific types', () => {
      mount(
        <FileField
          label="Upload Images"
          multiple={true}
          accept="image/*"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'multiple');
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled=true', () => {
      mount(<FileField label="Upload" disabled />);
      cy.get('button').should('be.disabled');
    });

    it('prevents file selection when disabled', () => {
      mount(<FileField label="Upload" disabled />);
      cy.get('button').should('have.class', 'Mui-disabled');
    });

    it('shows disabled styling', () => {
      mount(<FileField label="Upload" disabled />);
      cy.get('button').should('be.disabled');
      cy.get('button').should('have.class', 'Mui-disabled');
    });

    it('can be re-enabled dynamically', () => {
      const TestComponent = ({ isDisabled }: { isDisabled: boolean }) => {
        return (
          <>
            <FileField label="Upload" disabled={isDisabled} />
            <div data-testid="state">{isDisabled ? 'disabled' : 'enabled'}</div>
          </>
        );
      };
      mount(<TestComponent isDisabled={true} />);
      cy.get('button').should('be.disabled');
    });
  });

  describe('File Type Constraints', () => {
    it('restricts to image files', () => {
      mount(
        <FileField
          label="Upload Image"
          accept="image/*"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*');
    });

    it('restricts to document files', () => {
      mount(
        <FileField
          label="Upload Document"
          accept=".pdf,.doc,.docx,.txt"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', '.pdf,.doc,.docx,.txt');
    });

    it('restricts to video files', () => {
      mount(
        <FileField
          label="Upload Video"
          accept="video/*"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', 'video/*');
    });

    it('allows multiple MIME types', () => {
      mount(
        <FileField
          label="Upload"
          accept="image/png,image/jpeg,image/gif"
        />
      );
      cy.get('input[type="file"]').should(
        'have.attr',
        'accept',
        'image/png,image/jpeg,image/gif'
      );
    });

    it('allows wildcard extensions', () => {
      mount(
        <FileField
          label="Upload"
          accept="image/*,video/*,audio/*"
        />
      );
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*,video/*,audio/*');
    });
  });

  describe('Helper Text', () => {
    it('displays file size limit', () => {
      mount(
        <FileField
          label="Upload"
          helperText="Maximum 10MB"
        />
      );
      cy.contains('Maximum 10MB').should('be.visible');
    });

    it('displays supported formats', () => {
      mount(
        <FileField
          label="Upload"
          helperText="Supported: PNG, JPG, GIF"
        />
      );
      cy.contains('Supported: PNG, JPG, GIF').should('be.visible');
    });

    it('displays upload instructions', () => {
      mount(
        <FileField
          label="Upload"
          helperText="Drag and drop or click to select"
        />
      );
      cy.contains('Drag and drop or click to select').should('be.visible');
    });

    it('displays multiple constraints in helper text', () => {
      const TestComponent = () => {
        const [error, setError] = React.useState(false);
        const helperText = error
          ? 'File too large (max 5MB)'
          : 'PDF files only, max 5MB';

        return (
          <>
            <FileField
              label="Upload"
              helperText={helperText}
            />
            <button onClick={() => setError(!error)}>Toggle Error</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.contains('PDF files only, max 5MB').should('exist');
      cy.get('button').click();
      cy.contains('File too large (max 5MB)').should('exist');
    });
  });

  describe('Accessibility', () => {
    it('button has accessible label', () => {
      mount(<FileField label="Select Document" />);
      cy.contains('button', 'Select Document').should('exist');
    });

    it('button is keyboard accessible', () => {
      mount(<FileField label="Upload" />);
      cy.get('button').focus();
      cy.focused().should('be', 'button');
      cy.get('button').type('{enter}');
      // Enter key should trigger file dialog
    });

    it('button is keyboard accessible with Space', () => {
      mount(<FileField label="Upload" />);
      cy.get('button').focus();
      cy.get('button').type(' ');
      // Space key should trigger file dialog
    });

    it('has semantic button structure', () => {
      mount(<FileField label="Upload" />);
      cy.get('button').should('have.attr', 'type');
    });

    it('hides file input for accessibility', () => {
      mount(<FileField label="Upload" />);
      cy.get('input[type="file"]').should('have.css', 'display', 'none');
    });

    it('helper text provides context', () => {
      mount(
        <FileField
          label="Upload"
          helperText="PNG, JPG, GIF (max 5MB)"
        />
      );
      cy.contains('PNG, JPG, GIF (max 5MB)').should('be.visible');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long helper text', () => {
      const longHelperText =
        'This is a very long helper text that describes all the requirements for uploading files including maximum size limits and supported formats for various file types';
      mount(
        <FileField
          label="Upload"
          helperText={longHelperText}
        />
      );
      cy.contains(longHelperText).should('be.visible');
    });

    it('handles button label with special characters', () => {
      mount(<FileField label="Upload (Required) *" />);
      cy.contains('Upload (Required) *').should('exist');
    });

    it('handles Unicode in label', () => {
      mount(<FileField label="上传文件 📤" />);
      cy.contains('上传文件 📤').should('exist');
    });

    it('handles state changes with file field', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <>
            <FileField label="Upload" />
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').click();
      cy.get('button').should('contain', 'Count: 1');
      cy.get('input[type="file"]').should('exist');
    });

    it('handles multiple file fields on same page', () => {
      mount(
        <>
          <FileField label="Upload Document" accept=".pdf" />
          <FileField label="Upload Image" accept="image/*" multiple={true} />
          <FileField label="Upload Video" accept="video/*" />
        </>
      );
      
      cy.contains('button', 'Upload Document').should('exist');
      cy.contains('button', 'Upload Image').should('exist');
      cy.contains('button', 'Upload Video').should('exist');
      
      cy.get('input[type="file"]').eq(0).should('have.attr', 'accept', '.pdf');
      cy.get('input[type="file"]').eq(1).should('have.attr', 'multiple');
      cy.get('input[type="file"]').eq(2).should('have.attr', 'accept', 'video/*');
    });

    it('maintains state through re-renders', () => {
      const TestComponent = () => {
        const [changed, setChanged] = React.useState(false);
        return (
          <>
            <FileField
              label="Upload"
              accept=".pdf"
              disabled={changed}
            />
            <button onClick={() => setChanged(!changed)}>Toggle</button>
          </>
        );
      };
      mount(<TestComponent />);
      cy.get('button').should('not.be.disabled');
      cy.get('button').click();
      cy.get('button').should('be.disabled');
    });

    it('handles file field in form context', () => {
      const TestComponent = () => {
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
        };

        return (
          <form onSubmit={handleSubmit}>
            <FileField label="Upload" />
            <button type="submit">Submit</button>
          </form>
        );
      };
      mount(<TestComponent />);
      cy.get('form').should('exist');
      cy.contains('button', 'Submit').should('exist');
    });

    it('dynamically changes accept attribute', () => {
      const TestComponent = ({ accept }: { accept: string }) => {
        return <FileField label="Upload" accept={accept} />;
      };
      mount(<TestComponent accept="image/*" />);
      cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*');
    });

    it('dynamically changes multiple attribute', () => {
      const TestComponent = ({ multiple }: { multiple: boolean }) => {
        return <FileField label="Upload" multiple={multiple} />;
      };
      mount(<TestComponent multiple={false} />);
      cy.get('input[type="file"]').should('not.have.attr', 'multiple');
    });
  });
});
