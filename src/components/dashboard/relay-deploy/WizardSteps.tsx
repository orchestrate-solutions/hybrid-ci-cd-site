/**
 * WizardSteps Component
 * Displays step indicators, progress tracking, and content rendering for multi-step wizard
 */

import React from 'react';
import { Box, Stepper, Step, StepLabel, StepConnector, LinearProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface WizardStepsProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepChange: (step: number) => void;
  children?: React.ReactNode;
  showProgress?: boolean;
  showLabels?: boolean;
}

const StyledConnector = styled(StepConnector)(({ theme }) => ({
  '&.MuiStepConnector-root': {
    top: 10,
  },
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.divider,
  },
}));

/**
 * WizardSteps Component
 */
export function WizardSteps({
  currentStep,
  totalSteps,
  steps,
  onStepChange,
  children,
  showProgress = true,
  showLabels = true,
}: WizardStepsProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Progress Bar */}
      {showProgress && (
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            mb: 3,
            height: 4,
            borderRadius: 2,
            backgroundColor: (theme) => theme.palette.divider,
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
            },
          }}
          data-testid="wizard-progress"
        />
      )}

      {/* Stepper */}
      <Stepper
        activeStep={currentStep - 1}
        connector={<StyledConnector />}
        sx={{
          mb: 4,
          px: { xs: 1, sm: 2 },
          py: 2,
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
          borderRadius: 1,
        }}
      >
        {steps.map((label, index) => (
          <Step
            key={index}
            completed={index < currentStep - 1}
            data-testid={`step-indicator-${index + 1}`}
          >
            <StepLabel
              onClick={() => index < currentStep && onStepChange(index + 1)}
              sx={{
                cursor: index < currentStep ? 'pointer' : 'default',
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: index === currentStep - 1 ? 600 : 500,
                  color:
                    index === currentStep - 1
                      ? (theme) => theme.palette.primary.main
                      : index < currentStep - 1
                        ? (theme) => theme.palette.success.main
                        : (theme) => theme.palette.text.secondary,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                },
              }}
            >
              {showLabels ? label : ''}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      {children && (
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.background.paper,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            minHeight: '400px',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: (theme) => theme.palette.primary.main,
            }}
          >
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
          </Typography>

          {children}
        </Box>
      )}

      {/* Step Counter */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1,
        }}
      >
        <Typography variant="caption" color="textSecondary">
          Progress: {currentStep} of {totalSteps}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {Math.round(progressPercentage)}% Complete
        </Typography>
      </Box>
    </Box>
  );
}
