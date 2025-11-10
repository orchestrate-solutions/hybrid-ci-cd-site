import { Checkbox, FormControlLabel, FormControlLabelProps, Skeleton } from '@mui/material';
import React from 'react';

export interface CheckboxFieldProps extends Omit<FormControlLabelProps, 'control'> {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  /** Loading state - shows skeleton placeholder */
  loading?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CheckboxField({
  label,
  checked = false,
  disabled = false,
  loading = false,
  onChange,
  ...props
}: CheckboxFieldProps) {
  // Show skeleton while loading by rendering hidden and measuring
  if (loading) {
    return (
      <Skeleton variant="rounded">
        <FormControlLabel
          control={<Checkbox checked={false} disabled />}
          label={label}
          sx={{ visibility: 'hidden' }}
        />
      </Skeleton>
    );
  }
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} />}
      label={label}
      {...props}
    />
  );
}
