/**
 * ConfigEditor Component - MUI X-based form editor
 * 
 * Form for editing tool configuration with dynamic field generation,
 * validation, and theme support. Composed from TextField microcomponent.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Button,
  Alert,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { TextField } from '../../fields';

interface ConfigEditorProps {
  /** Name of tool being configured */
  toolName: string;
  /** Initial configuration values */
  initialConfig: Record<string, string>;
  /** Called when form is saved */
  onSave: (config: Record<string, string>) => void;
  /** Called when form is cancelled */
  onCancel?: () => void;
}

/**
 * Format field key to readable label
 */
function formatFieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Determine field type based on key name
 */
function getFieldType(key: string): 'password' | 'text' {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('token') || lowerKey.includes('password') ? 'password' : 'text';
}

/**
 * ConfigEditor component using MUI Card + TextField
 */
export function ConfigEditor({
  toolName,
  initialConfig,
  onSave,
  onCancel,
}: ConfigEditorProps) {
  const [config, setConfig] = useState<Record<string, string>>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(Object.keys(initialConfig).length > 0);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setConfig((prev) => ({
        ...prev,
        [key]: value,
      }));

      // Validate: non-empty required fields
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          [key]: 'This field is required',
        }));
        setIsValid(false);
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
        // Check if all fields are valid
        const allFilled = Object.entries({ ...config, [key]: value }).every(
          ([, v]) => v.trim()
        );
        setIsValid(allFilled);
      }
    },
    [config]
  );

  const handleSave = useCallback(() => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(config).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsValid(false);
      return;
    }

    setIsValid(true);
    onSave(config);
  }, [config, onSave]);

  const handleCancel = useCallback(() => {
    setConfig(initialConfig);
    setErrors({});
    onCancel?.();
  }, [initialConfig, onCancel]);

  const hasConfig = Object.keys(config).length > 0;

  return (
    <Card data-testid="config-editor">
      <form noValidate onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <CardContent>
          {/* Header */}
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            {toolName}
          </Typography>

          {/* Form fields */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            {Object.entries(config).map(([key, value]) => (
              <TextField
                key={key}
                label={formatFieldLabel(key)}
                value={value}
                type={getFieldType(key)}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                error={!!errors[key]}
                helperText={errors[key]}
                fullWidth
                aria-label={formatFieldLabel(key)}
              />
            ))}

            {!hasConfig && (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                No configuration fields for {toolName}
              </Typography>
            )}
          </Stack>

          {/* Validation message for empty form */}
          {!isValid && hasConfig && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fill in all required fields
            </Alert>
          )}
        </CardContent>

        {/* Action buttons */}
        <CardActions sx={{ gap: 1, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button
              type="button"
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            disabled={!isValid}
          >
            Save
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}
