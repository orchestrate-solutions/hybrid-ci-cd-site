import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import React from 'react';

export interface TextareaFieldProps extends MuiTextFieldProps {
  label: string;
  rows?: number;
  helperText?: string;
  error?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}

export function TextareaField({
  label,
  rows = 4,
  helperText,
  error = false,
  value,
  onChange,
  fullWidth = true,
  ...props
}: TextareaFieldProps) {
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
