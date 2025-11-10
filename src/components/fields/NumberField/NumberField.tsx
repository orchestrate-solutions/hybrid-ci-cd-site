import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import React from 'react';

export interface NumberFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  helperText?: string;
  error?: boolean;
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function NumberField({
  label,
  helperText,
  error = false,
  value,
  onChange,
  inputProps,
  fullWidth = true,
  ...props
}: NumberFieldProps) {
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
