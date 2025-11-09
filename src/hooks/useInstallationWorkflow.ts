/**
 * useInstallationWorkflow Hook
 * Manages config installation workflow state and actions
 */

import { useState, useCallback } from 'react';

export interface InstallationStep {
  step: 'select' | 'configure' | 'review' | 'install' | 'complete';
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  message?: string;
}

export function useInstallationWorkflow() {
  const [currentStep, setCurrentStep] = useState<InstallationStep>({
    step: 'select',
    status: 'pending',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const advance = useCallback((step: InstallationStep['step']) => {
    setCurrentStep({ step, status: 'in-progress' });
  }, []);

  const complete = useCallback(() => {
    setCurrentStep({ step: 'complete', status: 'complete', message: 'Installation complete!' });
  }, []);

  const fail = useCallback((message: string) => {
    setError(message);
    setCurrentStep((prev) => ({ ...prev, status: 'error', message }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep({ step: 'select', status: 'pending' });
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    currentStep,
    error,
    isLoading,
    setIsLoading,
    advance,
    complete,
    fail,
    reset,
  };
}
