import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import React from 'react';

export interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  /** Label text */
  label: string;
  /** Helper text below field */
  helperText?: string;
  /** Show error state */
  error?: boolean;
  /** Field variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** Field size */
  size?: 'small' | 'medium';
  /** Make multiline */
  multiline?: boolean;
  /** Number of rows for multiline */
  rows?: number;
  /** Full width variant */
  fullWidth?: boolean;
  /** Required indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Input type */
  type?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string | number;
  /** onChange callback */
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** onFocus callback */
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** onBlur callback */
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * TextField Microcomponent
 * Atomic form field wrapper around MUI TextField with consistent styling and theming
 */
export function TextField({
  label,
  helperText,
  error = false,
  variant = 'outlined',
  size = 'medium',
  multiline = false,
  rows = 1,
  fullWidth = true,
  required = false,
  disabled = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  // Extract aria-label to pass to the input element
  const ariaLabel = (props as any)['aria-label'];
  const restProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'aria-label')
  );

  return (
    <MuiTextField
      label={label}
      helperText={helperText}
      error={error}
      variant={variant}
      size={size}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      type={multiline ? undefined : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      inputProps={
        ariaLabel
          ? { 'aria-label': ariaLabel }
          : undefined
      }
      slotProps={{
        input: {
          'data-testid': 'text-field-input',
        },
      }}
      {...restProps}
    />
  );
}
