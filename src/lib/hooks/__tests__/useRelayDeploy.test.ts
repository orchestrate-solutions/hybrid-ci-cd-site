import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelayDeploy } from '../useRelayDeploy';

// Mock the API client
vi.mock('../relayDeploy', () => ({
  validateDeploymentConfig: vi.fn(async (config) => ({ valid: true, errors: [] })),
  generateTerraformCode: vi.fn(async (config) => ({ code: 'terraform code', checksum: 'abc123' })),
  deployRelay: vi.fn(async (config) => ({ deployment_id: 'deploy-123', status: 'initializing' })),
  getDeploymentStatus: vi.fn(async (id) => ({ deployment_id: id, status: 'in_progress', progress_percent: 50 })),
  getDeploymentLogs: vi.fn(async (id) => ({ logs: [{ message: 'Log entry' }] })),
  cancelDeployment: vi.fn(async (id) => ({ deployment_id: id, status: 'cancelled' })),
  getInfrastructureTypes: vi.fn(async (provider) => ({ types: [{ id: 'ec2', label: 'EC2' }] })),
  validateCredentials: vi.fn(async (creds) => ({ valid: true, account_id: '123456' })),
}));

describe('useRelayDeploy Hook', () => {
  describe('Wizard State Machine', () => {
    it('should initialize to step 1 (provider selection)', () => {
      const { result } = renderHook(() => useRelayDeploy());
      expect(result.current.currentStep).toBe(1);
      expect(result.current.totalSteps).toBe(6);
    });

    it('should validate step data before allowing progression', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: '' });
      });

      expect(result.current.canProceedToNextStep()).toBe(false);

      act(() => {
        result.current.setFormData({ provider: 'aws' });
      });

      expect(result.current.canProceedToNextStep()).toBe(true);
    });

    it('should move forward through wizard steps', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.setFormData({ provider: 'aws' });
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should move backward through wizard steps', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: 'aws' });
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should prevent going before first step', () => {
      const { result } = renderHook(() => useRelayDeploy());
      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should prevent going beyond last step without deploying', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
          instance_type: 't3.medium',
        });
      });

      for (let i = 1; i < 6; i++) {
        act(() => {
          result.current.nextStep();
        });
      }

      expect(result.current.currentStep).toBe(6);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(6);
    });
  });

  describe('Form Data Management', () => {
    it('should accumulate form data across steps', () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: 'aws' });
      });

      expect(result.current.formData.provider).toBe('aws');

      act(() => {
        result.current.setFormData({ region: 'us-east-1' });
      });

      expect(result.current.formData.provider).toBe('aws');
      expect(result.current.formData.region).toBe('us-east-1');
    });

    it('should reset form data', () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
        });
      });

      expect(result.current.formData.provider).toBe('aws');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({});
      expect(result.current.currentStep).toBe(1);
    });

    it('should validate form data before step progression', () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: '' });
      });

      expect(result.current.getStepErrors()).toContain('Provider is required');
    });
  });

  describe('Deployment Execution', () => {
    it('should validate configuration before deployment', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
          instance_type: 't3.medium',
        });
      });

      await act(async () => {
        await result.current.validateConfiguration();
      });

      expect(result.current.validationResults.isValid).toBe(true);
    });

    it('should generate Terraform code', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
        });
      });

      await act(async () => {
        await result.current.generateTerraform();
      });

      expect(result.current.terraformCode).toBeDefined();
      expect(result.current.terraformCode).toContain('terraform');
    });

    it('should initiate deployment', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
          instance_type: 't3.medium',
        });
      });

      await act(async () => {
        await result.current.startDeployment();
      });

      expect(result.current.deploymentId).toBe('deploy-123');
      expect(result.current.deploymentStatus).toBe('initializing');
    });

    it('should track deployment progress', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
        });
      });

      await act(async () => {
        await result.current.startDeployment();
      });

      await act(async () => {
        await result.current.pollDeploymentStatus();
      });

      expect(result.current.deploymentProgress).toBeGreaterThan(0);
    });

    it('should handle deployment cancellation', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
        });
      });

      await act(async () => {
        await result.current.startDeployment();
      });

      expect(result.current.deploymentId).toBeDefined();

      await act(async () => {
        await result.current.cancelDeployment();
      });

      expect(result.current.deploymentStatus).toBe('cancelled');
    });
  });

  describe('Credential Management', () => {
    it('should validate credentials', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      const credentials = {
        provider: 'aws',
        access_key: 'AKIA123',
        secret_key: 'secret',
      };

      await act(async () => {
        await result.current.validateCredentials(credentials);
      });

      expect(result.current.credentialsValid).toBe(true);
    });

    it('should store encrypted credentials temporarily', () => {
      const { result } = renderHook(() => useRelayDeploy());

      const credentials = {
        provider: 'aws',
        access_key: 'AKIA123',
        secret_key: 'secret',
      };

      act(() => {
        result.current.setCredentials(credentials);
      });

      expect(result.current.credentials).toBeDefined();
      expect(result.current.credentials.provider).toBe('aws');
    });
  });

  describe('Resource Estimation', () => {
    it('should estimate deployment resources', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({
          provider: 'aws',
          region: 'us-east-1',
          infrastructure_type: 'ec2',
          instance_type: 't3.medium',
        });
      });

      await act(async () => {
        await result.current.estimateResources();
      });

      expect(result.current.resourceEstimate).toBeDefined();
      expect(result.current.resourceEstimate.estimated_cost_monthly).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should capture and display validation errors', async () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: 'invalid_provider' });
      });

      const errors = result.current.getStepErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useRelayDeploy());

      act(() => {
        result.current.setFormData({ provider: '' });
      });

      expect(result.current.getStepErrors().length).toBeGreaterThan(0);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.getStepErrors().length).toBe(0);
    });
  });
});
