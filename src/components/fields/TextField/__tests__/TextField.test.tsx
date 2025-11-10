import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextField } from '../TextField';

describe('TextField Microcomponent', () => {
  it('renders with label', () => {
    const { container } = render(<TextField label="Username" />);
    const textField = container.querySelector('[class*="MuiTextField"]');
    expect(textField).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<TextField label="Name" placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Name" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, 'test');
    expect(onChange).toHaveBeenCalled();
  });

  it('displays helper text', () => {
    render(<TextField label="Email" helperText="Email required" />);
    expect(screen.getByText('Email required')).toBeInTheDocument();
  });

  it('disables input', () => {
    render(<TextField label="Name" disabled={true} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('renders password type', () => {
    render(<TextField label="Password" type="password" />);
    const input = screen.getByDisplayValue('') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('renders multiline textarea', () => {
    const { container } = render(
      <TextField label="Description" multiline={true} rows={4} />
    );
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('supports controlled value', () => {
    const { rerender } = render(
      <TextField label="Name" value="Initial" onChange={() => {}} />
    );
    let input = screen.getByDisplayValue('Initial') as HTMLInputElement;
    expect(input.value).toBe('Initial');

    rerender(
      <TextField label="Name" value="Updated" onChange={() => {}} />
    );
    input = screen.getByDisplayValue('Updated') as HTMLInputElement;
    expect(input.value).toBe('Updated');
  });
});
