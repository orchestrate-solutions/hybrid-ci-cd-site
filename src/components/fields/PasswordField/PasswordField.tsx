import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from 'lucide-react';
import React, { useState } from 'react';

export interface PasswordFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  helperText?: string;
  error?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordField({
  label,
  helperText,
  error = false,
  value,
  onChange,
  fullWidth = true,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <MuiTextField
      label={label}
      type={showPassword ? 'text' : 'password'}
      helperText={helperText}
      error={error}
      value={value || ''}
      onChange={onChange}
      fullWidth={fullWidth}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? (
                  <VisibilityOff className="w-5 h-5" />
                ) : (
                  <Visibility className="w-5 h-5" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}
