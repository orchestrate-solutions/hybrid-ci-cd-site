/**
 * RefreshSlider Component
 * 
 * Allows user to control real-time update frequency
 * Live (🟢) ← Efficient (🟡) ← Off (🔴)
 */

import React from 'react';
import { Box, Typography, Slider, Card } from '@mui/material';
import { useUserPreferences } from '@/lib/hooks';

export function RefreshSlider() {
  const { preferences, updatePreferences } = useUserPreferences();

  const modeIndex = ['off', 'efficient', 'live'].indexOf(preferences.realTimeMode);

  const handleChange = (_: Event, newValue: number | number[]) => {
    const modes: Array<'off' | 'efficient' | 'live'> = ['off', 'efficient', 'live'];
    const newMode = modes[newValue as number];
    updatePreferences({ realTimeMode: newMode });
  };

  const modeDescriptions = {
    off: { label: 'Off 🔴', interval: 'Manual' },
    efficient: { label: 'Efficient 🟡', interval: 'Every 30s' },
    live: { label: 'Live 🟢', interval: 'Every 10s' },
  };

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Real-Time Update Mode
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Control how frequently dashboard data refreshes
        </Typography>
      </Box>

      {/* Slider */}
      <Box sx={{ px: 1, mb: 2 }}>
        <Slider
          value={modeIndex}
          onChange={handleChange}
          min={0}
          max={2}
          step={1}
          marks={[
            { value: 0, label: '🔴 Off' },
            { value: 1, label: '🟡 Efficient' },
            { value: 2, label: '🟢 Live' },
          ]}
          valueLabelDisplay="off"
          sx={{
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
            },
          }}
        />
      </Box>

      {/* Current Mode Display */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Current Mode: {modeDescriptions[preferences.realTimeMode].label}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Updates: {modeDescriptions[preferences.realTimeMode].interval}
        </Typography>
      </Box>

      {/* Info */}
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'info.lighter', display: 'none' }}>
        <Typography variant="caption" color="info.dark">
          💡 Live mode uses more bandwidth. Efficient mode is recommended for daily monitoring.
        </Typography>
      </Box>
    </Card>
  );
}
