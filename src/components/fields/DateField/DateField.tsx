import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import React from 'react';

export interface DateFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  error?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function DateField({
  label,
  value,
  onChange,
  helperText,
  error = false,
  inputProps,
  fullWidth = true,
  ...props
}: DateFieldProps) {
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
