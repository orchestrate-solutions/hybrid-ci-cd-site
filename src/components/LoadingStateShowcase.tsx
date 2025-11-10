/**
 * Loading States Showcase
 *
 * Demonstrates loading states for all field components and the LoadingSpinner.
 * This page shows how to use loading states while fetching data.
 */

import React from 'react';
import { Box, Typography, Grid, Button, Stack } from '@mui/material';
import {
  TextField,
  SelectField,
  CheckboxField,
  RadioGroup,
  NumberField,
  PasswordField,
  DateField,
  FileField,
  TextareaField,
} from '@/components/fields';
import { LoadingSpinner } from '@/components/micro/LoadingSpinner';

/**
 * Example page demonstrating loading states
 */
export function LoadingStateShowcase() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSimulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const sampleOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Loading States Showcase
      </Typography>

      <Stack direction="row" gap={2} sx={{ mb: 4 }}>
        <Button
          variant="contained"
          onClick={handleSimulateLoading}
          disabled={isLoading}
        >
          Simulate Loading (2s)
        </Button>
        <Typography sx={{ alignSelf: 'center' }}>
          {isLoading ? 'Loading...' : 'Ready'}
        </Typography>
      </Stack>

      {/* Spinner Section */}
      <Box sx={{ mb: 6, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          LoadingSpinner Component
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <LoadingSpinner size="small" label="Small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LoadingSpinner size="medium" label="Medium" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LoadingSpinner size="large" label="Large" />
          </Grid>
        </Grid>
      </Box>

      {/* Fields Loading State Section */}
      <Box sx={{ mb: 6, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Field Components with Loading State
        </Typography>

        <Grid container spacing={2}>
          {/* Text Field */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Text Field"
              placeholder="Example text"
              loading={isLoading}
            />
          </Grid>

          {/* Select Field */}
          <Grid item xs={12} sm={6} md={4}>
            <SelectField
              label="Select Field"
              options={sampleOptions}
              loading={isLoading}
            />
          </Grid>

          {/* Number Field */}
          <Grid item xs={12} sm={6} md={4}>
            <NumberField
              label="Number Field"
              placeholder="Enter number"
              loading={isLoading}
            />
          </Grid>

          {/* Date Field */}
          <Grid item xs={12} sm={6} md={4}>
            <DateField label="Date Field" loading={isLoading} />
          </Grid>

          {/* Password Field */}
          <Grid item xs={12} sm={6} md={4}>
            <PasswordField
              label="Password Field"
              placeholder="Enter password"
              loading={isLoading}
            />
          </Grid>

          {/* File Field */}
          <Grid item xs={12} sm={6} md={4}>
            <FileField label="Upload File" loading={isLoading} />
          </Grid>

          {/* Textarea Field */}
          <Grid item xs={12}>
            <TextareaField
              label="Textarea Field"
              placeholder="Enter description"
              loading={isLoading}
              rows={4}
            />
          </Grid>

          {/* Checkbox Field */}
          <Grid item xs={12} sm={6}>
            <CheckboxField label="Checkbox Field" loading={isLoading} />
          </Grid>

          {/* Radio Group */}
          <Grid item xs={12} sm={6}>
            <RadioGroup
              label="Radio Group"
              options={sampleOptions}
              loading={isLoading}
            />
          </Grid>
        </Grid>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Click "Simulate Loading" to see all components transition to their loading states.
        This demonstrates how fields appear while data is being fetched.
      </Typography>
    </Box>
  );
}
