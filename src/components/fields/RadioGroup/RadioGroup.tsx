import { RadioGroup as MuiRadioGroup, FormControlLabel, Radio, FormControl, FormLabel, FormHelperText, Skeleton } from '@mui/material';
import React from 'react';

export interface RadioGroupProps {
  label: string;
  options: Array<{ value: any; label: string }>;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** Loading state - shows skeleton placeholder */
  loading?: boolean;
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
  loading = false,
  row = false,
}: RadioGroupProps) {
  // Show skeleton while loading by rendering hidden and measuring
  if (loading) {
    return (
      <Skeleton variant="rounded">
        <FormControl disabled>
          <FormLabel>{label}</FormLabel>
          <MuiRadioGroup row={row} sx={{ visibility: 'hidden' }}>
            {options.slice(0, 1).map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </MuiRadioGroup>
        </FormControl>
      </Skeleton>
    );
  }
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
