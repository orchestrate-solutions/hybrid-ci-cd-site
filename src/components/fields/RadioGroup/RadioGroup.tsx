import { RadioGroup as MuiRadioGroup, FormControlLabel, Radio, FormControl, FormLabel, FormHelperText } from '@mui/material';
import React from 'react';

export interface RadioGroupProps {
  label: string;
  options: Array<{ value: any; label: string }>;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  row?: boolean;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  row = false,
}: RadioGroupProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      <FormLabel>{label}</FormLabel>
      <MuiRadioGroup value={value || ''} onChange={onChange} row={row}>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </MuiRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
