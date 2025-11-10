import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, Skeleton } from '@mui/material';
import React from 'react';

export interface DateFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  error?: boolean;
  /** Loading state - shows skeleton placeholder */
  loading?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function DateField({
  label,
  value,
  onChange,
  helperText,
  error = false,
  loading = false,
  inputProps,
  fullWidth = true,
  ...props
}: DateFieldProps) {
  // Show skeleton while loading
  if (loading) {
    return (
      <Skeleton variant="rounded">
        <MuiTextField
          label={label}
          type="date"
          fullWidth={fullWidth}
          disabled
          sx={{ visibility: 'hidden' }}
          slotProps={{
            input: { shrink: true },
          }}
        />
      </Skeleton>
    );
  }
  return (
    <MuiTextField
      label={label}
      type="date"
      value={value || ''}
      onChange={onChange}
      helperText={helperText}
      error={error}
      inputProps={inputProps}
      fullWidth={fullWidth}
      slotProps={{
        input: { shrink: true },
      }}
      {...props}
    />
  );
}
