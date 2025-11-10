import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, Skeleton } from '@mui/material';
import React from 'react';

export interface TextareaFieldProps extends MuiTextFieldProps {
  label: string;
  rows?: number;
  helperText?: string;
  error?: boolean;
  /** Loading state - shows skeleton placeholder */
  loading?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}

export function TextareaField({
  label,
  rows = 4,
  helperText,
  error = false,
  loading = false,
  value,
  onChange,
  fullWidth = true,
  ...props
}: TextareaFieldProps) {
  // Show skeleton while loading
  if (loading) {
    return (
      <Skeleton variant="rounded">
        <MuiTextField
          label={label}
          multiline
          rows={rows}
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
      multiline
      rows={rows}
      helperText={helperText}
      error={error}
      value={value || ''}
      onChange={onChange}
      fullWidth={fullWidth}
      {...props}
    />
  );
}
