import { Select, MenuItem, FormControl, InputLabel, FormHelperText, SelectProps as MuiSelectProps } from '@mui/material';
import React from 'react';

export interface SelectFieldProps extends Omit<MuiSelectProps<any>, 'children'> {
  label: string;
  options: Array<{ value: any; label: string }>;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export function SelectField({
  label,
  options,
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  value,
  onChange,
  ...props
}: SelectFieldProps) {
  return (
    <FormControl fullWidth={fullWidth} error={error} size={size} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value || ''}
        onChange={onChange}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
