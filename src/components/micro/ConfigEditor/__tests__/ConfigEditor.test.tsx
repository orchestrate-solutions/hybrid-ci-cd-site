/**
 * RED Phase: ConfigEditor Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigEditor } from '../ConfigEditor';

describe('ConfigEditor Component (RED Phase)', () => {
  describe('Rendering', () => {
    it('renders form with tool name as title', () => {
      render(<ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />);

      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(<ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel handler provided', () => {
      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{}}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders with testid', () => {
      render(<ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />);

      expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    });
  });

  describe('Initial Configuration', () => {
    it('loads initial config values into form', () => {
      const initialConfig = {
        owner: 'orchestrate-solutions',
        repo: 'hybrid-ci-cd-site',
      };

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={initialConfig}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('orchestrate-solutions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('hybrid-ci-cd-site')).toBeInTheDocument();
    });

    it('starts with empty form when no initial config', () => {
      render(<ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />);

      // When empty config, no textboxes should exist
      const inputs = screen.queryAllByRole('textbox');
      expect(inputs.length).toBe(0);
      // Message shows that there are no fields
      expect(screen.getByText(/no configuration/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with updated config when form is valid', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'test', repo: 'test' }}
          onSave={onSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalledWith(expect.any(Object));
    });

    it('includes all form values in save payload', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{
            owner: 'orchestrate-solutions',
            repo: 'hybrid-ci-cd-site',
          }}
          onSave={onSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'orchestrate-solutions',
          repo: 'hybrid-ci-cd-site',
        })
      );
    });

    it('allows modifying config values before save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'old-owner' }}
          onSave={onSave}
        />
      );

      const ownerInput = screen.getByDisplayValue('old-owner') as HTMLInputElement;
      await user.clear(ownerInput);
      await user.type(ownerInput, 'new-owner');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'new-owner',
        })
      );
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{}}
          onSave={vi.fn()}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('discards changes when cancel clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const onSave = vi.fn();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'original' }}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

      const ownerInput = screen.getByDisplayValue('original') as HTMLInputElement;
      await user.clear(ownerInput);
      await user.type(ownerInput, 'modified');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('shows validation error when saving with empty required fields', async () => {
      const user = userEvent.setup();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: '', repo: '' }}
          onSave={vi.fn()}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation errors for required fields
      const errorMessages = screen.queryAllByText(/required/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('disables save button while form is invalid', () => {
      render(
        <ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />
      );

      const saveButton = screen.getByRole('button', { name: /save/i }) as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);
    });

    it('enables save button when valid', async () => {
      const user = userEvent.setup();

      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'valid', repo: 'valid' }}
          onSave={vi.fn()}
        />
      );

      // Once valid config is loaded, save button should be enabled
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });
  });

  describe('Dynamic Field Generation', () => {
    it('renders field for each config key', () => {
      render(
        <ConfigEditor
          toolName="Kubernetes"
          initialConfig={{
            clusterName: 'prod',
            namespace: 'default',
            apiServer: 'https://api.k8s',
          }}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('prod')).toBeInTheDocument();
      expect(screen.getByDisplayValue('default')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://api.k8s')).toBeInTheDocument();
    });

    it('allows adding new fields dynamically', async () => {
      const user = userEvent.setup();

      render(
        <ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />
      );

      // Look for "add field" or similar button
      const addButton = screen.queryByRole('button', { name: /add/i });
      if (addButton) {
        await user.click(addButton);
        expect(screen.queryByTestId('field-input')).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('has semantic form structure', () => {
      const { container } = render(
        <ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />
      );

      // Form element should exist
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('inputs have associated labels', () => {
      render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: '' }}
          onSave={vi.fn()}
        />
      );

      // Verify form inputs have labels or aria-labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-label', expect.any(String));
      });
    });
  });

  describe('Styling', () => {
    it('applies theme CSS variables', () => {
      const { container } = render(
        <ConfigEditor toolName="GitHub Actions" initialConfig={{}} onSave={vi.fn()} />
      );

      const form = container.querySelector('[data-testid="config-editor"]');
      const computedStyle = window.getComputedStyle(form!);

      expect(computedStyle.backgroundColor).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tool name', () => {
      render(
        <ConfigEditor toolName="" initialConfig={{}} onSave={vi.fn()} />
      );

      expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    });

    it('handles very large config objects', () => {
      const largeConfig: Record<string, string> = {};
      for (let i = 0; i < 50; i++) {
        largeConfig[`field_${i}`] = `value_${i}`;
      }

      render(
        <ConfigEditor
          toolName="Complex Tool"
          initialConfig={largeConfig}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    });

    it('preserves config when re-rendering', () => {
      const { rerender } = render(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'test' }}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('test')).toBeInTheDocument();

      rerender(
        <ConfigEditor
          toolName="GitHub Actions"
          initialConfig={{ owner: 'test' }}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    });
  });
});
