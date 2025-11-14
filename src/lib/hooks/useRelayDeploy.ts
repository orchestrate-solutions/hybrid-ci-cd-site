/**
 * useRelayDeploy Hook
 * Manages wizard state machine, form data accumulation, validation, 
 * and deployment orchestration for the Relay Auto-Deploy Wizard
 */

import { useState, useCallback, useRef } from 'react';
import * as relayDeployApi from '../api/relayDeploy';
import type {
  DeploymentConfig,
  Deployment,
  DeploymentLog,
  ResourceEstimate,
  ValidationResult,
  InfrastructureType,
} from '../api/relayDeploy';

const TOTAL_STEPS = 6;
const STEP_NAMES = [
  'Provider Selection',
  'Infrastructure Type',
  'Region & Sizing',
  'Network Configuration',
  'Review Configuration',
  'Deploy & Monitor',
];

interface WizardState {
  currentStep: number;
  formData: Partial<DeploymentConfig>;
  errors: Record<string, string[]>;
  validationResults: ValidationResult | null;
  terraformCode: string | null;
  deploymentId: string | null;
  deploymentStatus: Deployment | null;
  deploymentLogs: DeploymentLog[];
  deploymentProgress: number;
  credentialsValid: boolean;
  resourceEstimate: ResourceEstimate | null;
  infrastructureTypes: InfrastructureType[];
}

const initialState: WizardState = {
  currentStep: 1,
  formData: {},
  errors: {},
  validationResults: null,
  terraformCode: null,
  deploymentId: null,
  deploymentStatus: null,
  deploymentLogs: [],
  deploymentProgress: 0,
  credentialsValid: false,
  resourceEstimate: null,
  infrastructureTypes: [],
};

export function useRelayDeploy() {
  const [state, setState] = useState<WizardState>(initialState);
  const [credentials, setCredentialsInternal] = useState<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update form data, preserving existing data from previous steps
   */
  const setFormData = useCallback((data: Partial<DeploymentConfig>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      errors: { ...prev.errors }, // Reset errors for affected fields
    }));
  }, []);

  /**
   * Get validation errors for current step
   */
  const getStepErrors = useCallback((): string[] => {
    const stepErrors = state.errors[state.currentStep.toString()] || [];
    return stepErrors;
  }, [state.currentStep, state.errors]);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
    }));
  }, []);

  /**
   * Validate form data for current step
   */
  const validateCurrentStep = useCallback((): boolean => {
    const stepErrors: string[] = [];
    const { formData } = state;

    switch (state.currentStep) {
      case 1: // Provider Selection
        if (!formData.provider) stepErrors.push('Provider is required');
        break;
      case 2: // Infrastructure Type
        if (!formData.infrastructure_type) stepErrors.push('Infrastructure type is required');
        break;
      case 3: // Region & Sizing
        if (!formData.region) stepErrors.push('Region is required');
        if (!formData.instance_type) stepErrors.push('Instance type is required');
        break;
      case 4: // Network Configuration
        // Optional step, minimal validation
        break;
      case 5: // Review
        if (!formData.relay_name) stepErrors.push('Relay name is required');
        break;
    }

    if (stepErrors.length > 0) {
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [state.currentStep]: stepErrors },
      }));
      return false;
    }

    return true;
  }, [state.currentStep, state.formData]);

  /**
   * Check if user can proceed to next step
   */
  const canProceedToNextStep = useCallback((): boolean => {
    return validateCurrentStep() && state.currentStep < TOTAL_STEPS;
  }, [validateCurrentStep, state.currentStep]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    if (canProceedToNextStep()) {
      setState((prev) => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS),
      }));
    }
  }, [canProceedToNextStep]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  /**
   * Jump to specific step (if already completed)
   */
  const jumpToStep = useCallback((step: number) => {
    if (step > 0 && step <= state.currentStep) {
      setState((prev) => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, [state.currentStep]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setState(initialState);
    setCredentialsInternal(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  /**
   * Validate deployment configuration
   */
  const validateConfiguration = useCallback(async () => {
    try {
      const result = await relayDeployApi.validateDeploymentConfig(
        state.formData as DeploymentConfig
      );
      setState((prev) => ({
        ...prev,
        validationResults: result,
      }));
      return result.valid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Validation failed';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, validation: [errorMsg] },
      }));
      return false;
    }
  }, [state.formData]);

  /**
   * Generate Terraform code from configuration
   */
  const generateTerraform = useCallback(async () => {
    try {
      const result = await relayDeployApi.generateTerraformCode(
        state.formData as DeploymentConfig
      );
      setState((prev) => ({
        ...prev,
        terraformCode: result.code,
      }));
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terraform generation failed';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, terraform: [errorMsg] },
      }));
      throw error;
    }
  }, [state.formData]);

  /**
   * Initiate deployment
   */
  const startDeployment = useCallback(async () => {
    try {
      // Validate configuration first
      const isValid = await validateConfiguration();
      if (!isValid) throw new Error('Configuration validation failed');

      // Generate Terraform code
      await generateTerraform();

      // Start deployment
      const deployment = await relayDeployApi.deployRelay(state.formData as DeploymentConfig);

      setState((prev) => ({
        ...prev,
        deploymentId: deployment.deployment_id,
        deploymentStatus: deployment,
        currentStep: TOTAL_STEPS,
      }));

      return deployment;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Deployment failed';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, deployment: [errorMsg] },
      }));
      throw error;
    }
  }, [state.formData, validateConfiguration, generateTerraform]);

  /**
   * Poll deployment status
   */
  const pollDeploymentStatus = useCallback(async () => {
    if (!state.deploymentId) return;

    try {
      const deployment = await relayDeployApi.getDeploymentStatus(state.deploymentId);
      const logs = await relayDeployApi.getDeploymentLogs(state.deploymentId);

      setState((prev) => ({
        ...prev,
        deploymentStatus: deployment,
        deploymentLogs: logs.logs,
        deploymentProgress: deployment.progress_percent || 0,
      }));

      // Stop polling when deployment is complete, failed, or cancelled
      if (['completed', 'failed', 'cancelled'].includes(deployment.status)) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Failed to poll deployment status:', error);
    }
  }, [state.deploymentId]);

  /**
   * Start automatic polling of deployment status
   */
  const startStatusPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Initial poll immediately
    pollDeploymentStatus();

    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      pollDeploymentStatus();
    }, 2000);
  }, [pollDeploymentStatus]);

  /**
   * Cancel ongoing deployment
   */
  const cancelDeployment = useCallback(async () => {
    if (!state.deploymentId) return;

    try {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      const deployment = await relayDeployApi.cancelDeployment(state.deploymentId);
      setState((prev) => ({
        ...prev,
        deploymentStatus: deployment,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to cancel deployment';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, cancel: [errorMsg] },
      }));
    }
  }, [state.deploymentId]);

  /**
   * Validate credentials for cloud provider
   */
  const validateCredentials = useCallback(
    async (creds: any) => {
      try {
        const result = await relayDeployApi.validateCredentials(creds);
        setState((prev) => ({
          ...prev,
          credentialsValid: result.valid,
        }));
        return result.valid;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          credentialsValid: false,
        }));
        return false;
      }
    },
    []
  );

  /**
   * Set credentials (encrypted)
   */
  const setCredentials = useCallback((creds: any) => {
    setCredentialsInternal(creds);
  }, []);

  /**
   * Load infrastructure types for provider
   */
  const loadInfrastructureTypes = useCallback(async (provider: string) => {
    try {
      const result = await relayDeployApi.getInfrastructureTypes(
        provider as 'aws' | 'azure' | 'gcp'
      );
      setState((prev) => ({
        ...prev,
        infrastructureTypes: result.types,
      }));
    } catch (error) {
      console.error('Failed to load infrastructure types:', error);
    }
  }, []);

  /**
   * Estimate resources and costs
   */
  const estimateResources = useCallback(async () => {
    try {
      const estimate = await relayDeployApi.estimateResources(state.formData as DeploymentConfig);
      setState((prev) => ({
        ...prev,
        resourceEstimate: estimate,
      }));
      return estimate;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to estimate resources';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, estimate: [errorMsg] },
      }));
      throw error;
    }
  }, [state.formData]);

  return {
    // State
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    stepNames: STEP_NAMES,
    formData: state.formData,
    deploymentId: state.deploymentId,
    deploymentStatus: state.deploymentStatus,
    deploymentLogs: state.deploymentLogs,
    deploymentProgress: state.deploymentProgress,
    terraformCode: state.terraformCode,
    credentialsValid: state.credentialsValid,
    resourceEstimate: state.resourceEstimate,
    infrastructureTypes: state.infrastructureTypes,
    validationResults: state.validationResults,

    // Credentials
    credentials,
    setCredentials,
    validateCredentials,

    // Navigation
    nextStep,
    previousStep,
    jumpToStep,
    canProceedToNextStep,

    // Form management
    setFormData,
    resetForm,
    getStepErrors,
    clearErrors,

    // Deployment
    validateConfiguration,
    generateTerraform,
    startDeployment,
    cancelDeployment,
    pollDeploymentStatus,
    startStatusPolling,

    // Infrastructure
    loadInfrastructureTypes,
    estimateResources,
  };
}
