'use client';

/**
 * Relay Deploy Page
 * Multi-step wizard for deploying relays to cloud infrastructure with TDD-validated flow
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  LinearProgress,
  Alert,
  Divider,
  Paper,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  ChevronRight,
  ChevronLeft,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRelayDeploy } from '../../../lib/hooks/useRelayDeploy';
import { WizardSteps } from '../../../components/dashboard/relay-deploy/WizardSteps';
import { InfrastructureSelector } from '../../../components/dashboard/relay-deploy/InfrastructureSelector';
import { DeploymentConfirmationModal } from '../../../components/dashboard/relay-deploy/DeploymentConfirmationModal';

/**
 * Relay Deploy Page Component
 */
export default function RelayDeployPage() {
  const wizard = useRelayDeploy();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeploymentProgress, setShowDeploymentProgress] = useState(false);

  // Load infrastructure types when provider changes
  useEffect(() => {
    if (wizard.formData.provider) {
      wizard.loadInfrastructureTypes(wizard.formData.provider);
    }
  }, [wizard.formData.provider]);

  // Start polling when deployment begins
  useEffect(() => {
    if (wizard.deploymentId && wizard.deploymentStatus?.status === 'initializing') {
      wizard.startStatusPolling();
      setShowDeploymentProgress(true);
    }
  }, [wizard.deploymentId]);

  const handleNext = async () => {
    if (wizard.canProceedToNextStep()) {
      if (wizard.currentStep === 5) {
        // On step 5 (review), estimate resources
        try {
          await wizard.estimateResources();
          setShowConfirmation(true);
        } catch (error) {
          console.error('Failed to estimate resources:', error);
        }
      } else {
        wizard.nextStep();
      }
    }
  };

  const handleConfirmDeployment = async () => {
    try {
      await wizard.startDeployment();
      setShowConfirmation(false);
      setShowDeploymentProgress(true);
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  // Step 1: Provider Selection
  const renderProviderSelection = () => (
    <Grid container spacing={2}>
      {[
        { id: 'aws', label: 'AWS', icon: '☁️', description: 'Amazon Web Services' },
        { id: 'azure', label: 'Azure', icon: '🔷', description: 'Microsoft Azure' },
        { id: 'gcp', label: 'Google Cloud', icon: '🌐', description: 'Google Cloud Platform' },
      ].map((provider) => (
        <Grid item xs={12} sm={6} md={4} key={provider.id}>
          <Card
            component="button"
            onClick={() => wizard.setFormData({ provider: provider.id as any })}
            sx={{
              height: '100%',
              border: (theme) =>
                wizard.formData.provider === provider.id
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) =>
                wizard.formData.provider === provider.id
                  ? theme.palette.action.selected
                  : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2rem', mb: 1 }}>{provider.icon}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {provider.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                {provider.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Step 2: Infrastructure Type
  const renderInfrastructureSelection = () => (
    <InfrastructureSelector
      options={wizard.infrastructureTypes}
      selected={wizard.formData.infrastructure_type || null}
      onSelect={(type) => wizard.setFormData({ infrastructure_type: type })}
      isLoading={wizard.infrastructureTypes.length === 0}
    />
  );

  // Step 3: Region & Sizing
  const renderRegionAndSizing = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Select Region
        </Typography>
        <TextField
          select
          fullWidth
          value={wizard.formData.region || ''}
          onChange={(e) => wizard.setFormData({ region: e.target.value })}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Select a region...</option>
          {['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'].map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </TextField>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Instance Type
        </Typography>
        <TextField
          select
          fullWidth
          value={wizard.formData.instance_type || ''}
          onChange={(e) => wizard.setFormData({ instance_type: e.target.value })}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Select instance type...</option>
          {['t3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge'].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </TextField>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Number of Instances
        </Typography>
        <TextField
          type="number"
          fullWidth
          inputProps={{ min: 1, max: 10 }}
          value={wizard.formData.instance_count || 1}
          onChange={(e) =>
            wizard.setFormData({ instance_count: parseInt(e.target.value) })
          }
        />
      </Box>
    </Stack>
  );

  // Step 4: Network Configuration
  const renderNetworkConfiguration = () => (
    <Alert severity="info" sx={{ mb: 2 }}>
      Network configuration will use default security settings optimized for relay operations.
      SSH (port 22) and HTTPS (port 443) will be restricted.
    </Alert>
  );

  // Step 5: Review Configuration
  const renderReview = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Configuration Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: 'textSecondary' }}>
              Provider
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {wizard.formData.provider?.toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: 'textSecondary' }}>
              Region
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {wizard.formData.region}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: 'textSecondary' }}>
              Infrastructure
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {wizard.formData.infrastructure_type}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: 'textSecondary' }}>
              Instance Type
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {wizard.formData.instance_type}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {wizard.resourceEstimate && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Estimated Cost & Time
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                Monthly Cost
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                ${wizard.resourceEstimate.estimated_cost_monthly.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                Deployment Time
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ~{wizard.resourceEstimate.estimated_deployment_time_minutes}m
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Stack>
  );

  // Step 6: Deployment Progress
  const renderDeployment = () => (
    <Stack spacing={2}>
      {wizard.deploymentStatus ? (
        <>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Deployment Progress
              </Typography>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                {wizard.deploymentProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={wizard.deploymentProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Alert
            severity={
              wizard.deploymentStatus.status === 'completed'
                ? 'success'
                : wizard.deploymentStatus.status === 'failed'
                  ? 'error'
                  : 'info'
            }
          >
            {wizard.deploymentStatus.current_step || 'Initializing deployment...'}
          </Alert>

          {wizard.deploymentStatus.status === 'completed' && (
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Deployment Successful!
              </Typography>
              <Typography variant="body2">
                Your relay is now active and ready to receive webhooks.
              </Typography>
            </Alert>
          )}

          {wizard.deploymentStatus.status === 'failed' && (
            <Alert severity="error" icon={<ErrorIcon />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Deployment Failed
              </Typography>
              <Typography variant="body2">{wizard.deploymentStatus.error}</Typography>
            </Alert>
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Stack>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 1:
        return renderProviderSelection();
      case 2:
        return renderInfrastructureSelection();
      case 3:
        return renderRegionAndSizing();
      case 4:
        return renderNetworkConfiguration();
      case 5:
        return renderReview();
      case 6:
        return renderDeployment();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Relay Auto-Deployment Wizard
        </Typography>
        <Typography variant="body2" sx={{ color: 'textSecondary' }}>
          Guided setup for deploying relays to your cloud infrastructure
        </Typography>
      </Box>

      {/* Wizard */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <WizardSteps
            currentStep={wizard.currentStep}
            totalSteps={wizard.totalSteps}
            steps={wizard.stepNames}
            onStepChange={wizard.jumpToStep}
            showProgress={true}
            showLabels={true}
          >
            {renderStepContent()}
          </WizardSteps>

          <Divider sx={{ my: 3 }} />

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              startIcon={<ChevronLeft />}
              onClick={wizard.previousStep}
              disabled={wizard.currentStep === 1 || showDeploymentProgress}
              variant="outlined"
            >
              Back
            </Button>

            <Stack direction="row" spacing={1}>
              {wizard.deploymentStatus?.status === 'completed' && (
                <Button
                  variant="contained"
                  onClick={() => wizard.resetForm()}
                >
                  Deploy Another Relay
                </Button>
              )}

              {wizard.deploymentStatus?.status === 'in_progress' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => wizard.cancelDeployment()}
                >
                  Cancel Deployment
                </Button>
              )}

              {wizard.currentStep < wizard.totalSteps && !showDeploymentProgress && (
                <Button
                  endIcon={<ChevronRight />}
                  onClick={handleNext}
                  disabled={!wizard.canProceedToNextStep()}
                  variant="contained"
                >
                  Next
                </Button>
              )}
            </Stack>
          </Box>

          {/* Validation Errors */}
          {wizard.getStepErrors().length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {wizard.getStepErrors().map((error, i) => (
                <Typography key={i} variant="body2">
                  {error}
                </Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {wizard.resourceEstimate && (
        <DeploymentConfirmationModal
          isOpen={showConfirmation}
          config={wizard.formData as any}
          estimates={wizard.resourceEstimate}
          onConfirm={handleConfirmDeployment}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </Box>
  );
}
