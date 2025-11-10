'use client';

import React from 'react';
import { Switch, FormControlLabel, Box, Typography, Alert } from '@mui/material';

interface DemoModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function DemoModeToggle({ enabled, onChange }: DemoModeToggleProps) {
  return (
    <Box className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Demo Mode
          </Typography>
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            Display realistic mock data instead of connecting to the backend
          </Typography>
        </div>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => onChange(e.target.checked)}
              size="medium"
              data-testid="demo-mode-toggle"
            />
          }
          label=""
        />
      </div>

      {enabled && (
        <Alert severity="info" className="text-sm">
          Demo Mode is <strong>ON</strong>. You're viewing mock data. Refresh Mode is disabled in demo.
        </Alert>
      )}
    </Box>
  );
}
