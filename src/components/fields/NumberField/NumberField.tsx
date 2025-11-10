import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, Skeleton } from '@mui/material';
import React from 'react';

export interface NumberFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  helperText?: string;
  error?: boolean;
  /** Loading state - shows skeleton placeholder */
  loading?: boolean;
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function NumberField({
  label,
  helperText,
  error = false,
  loading = false,
  value,
  onChange,
  inputProps,
  fullWidth = true,
  ...props
}: NumberFieldProps) {
  // Show skeleton while loading
  if (loading) {
    return (
      <Skeleton variant="rounded">
        <MuiTextField
          label={label}
          type="number"
          fullWidth={fullWidth}
          disabled
          sx={{ visibility: 'hidden' }}
        />
      </Skeleton>
    );
  }
  return (
    <MuiTextField
      label={label}
      type="number"
      helperText={helperText}
      error={error}
      value={value || ''}
      onChange={onChange}
      inputProps={inputProps}
      fullWidth={fullWidth}
      {...props}
    />
  );
}
