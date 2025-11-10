import { Checkbox, FormControlLabel, FormControlLabelProps } from '@mui/material';
import React from 'react';

export interface CheckboxFieldProps extends Omit<FormControlLabelProps, 'control'> {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CheckboxField({
  label,
  checked = false,
  disabled = false,
  onChange,
  ...props
}: CheckboxFieldProps) {
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} />}
      label={label}
      {...props}
    />
  );
}
