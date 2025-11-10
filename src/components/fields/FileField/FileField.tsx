import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps, Button, Box } from '@mui/material';
import { Upload } from 'lucide-react';
import React, { useRef } from 'react';

export interface FileFieldProps extends Omit<MuiTextFieldProps, 'type'> {
  label: string;
  accept?: string;
  multiple?: boolean;
  helperText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileField({
  label,
  accept,
  multiple = false,
  helperText,
  onChange,
  disabled = false,
  ...props
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <Button
        variant="outlined"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        startIcon={<Upload className="w-4 h-4" />}
        fullWidth
      >
        {label}
      </Button>
      {helperText && (
        <Box sx={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'text.secondary' }}>
          {helperText}
        </Box>
      )}
    </Box>
  );
}
