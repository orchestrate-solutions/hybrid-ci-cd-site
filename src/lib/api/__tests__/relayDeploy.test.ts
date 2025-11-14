import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateDeploymentConfig,
  generateTerraformCode,
  deployRelay,
  getDeploymentStatus,
  getDeploymentLogs,
  cancelDeployment,
  rollbackDeployment,
  getInfrastructureTypes,
  validateCredentials,
  getDeploymentHistory,
  estimateResources,
} from '../relayDeploy';

// Mock fetch
global.fetch = vi.fn();

const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('relayDeploy API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('validateDeploymentConfig', () => {
    it('should validate deployment configuration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, errors: [] }),
      });

      const config = {
        provider: 'aws',
        region: 'us-east-1',
        infrastructure_type: 'ec2',
        instance_type: 't3.medium',
      };

      const result = await validateDeploymentConfig(config);
      expect(result.valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/relays/wizard/validate-config'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should return validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['Invalid region', 'Instance type not available'],
        }),
      });

      const config = { provider: 'invalid', region: 'bad', infrastructure_type: 'ec2' };
      const result = await validateDeploymentConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('generateTerraformCode', () => {
    it('should generate Terraform code from config', async () => {
      const terraformCode = `
resource "aws_instance" "relay" {
  ami           = "ami-12345"
  instance_type = "t3.medium"
}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: terraformCode, checksum: 'abc123' }),
      });

      const config = {
        provider: 'aws',
        region: 'us-east-1',
        infrastructure_type: 'ec2',
        instance_type: 't3.medium',
      };

      const result = await generateTerraformCode(config);
      expect(result.code).toContain('aws_instance');
      expect(result.checksum).toBe('abc123');
    });
  });

  describe('deployRelay', () => {
    it('should initiate relay deployment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployment_id: 'deploy-123',
          status: 'initializing',
          created_at: '2025-01-01T00:00:00Z',
        }),
      });

      const config = {
        provider: 'aws',
        region: 'us-east-1',
        infrastructure_type: 'ec2',
        instance_type: 't3.medium',
      };

      const result = await deployRelay(config);
      expect(result.deployment_id).toBe('deploy-123');
      expect(result.status).toBe('initializing');
    });

    it('should handle deployment errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid configuration' }),
      });

      const config = { provider: 'invalid', region: '', infrastructure_type: 'ec2' };
      await expect(deployRelay(config)).rejects.toThrow();
    });
  });

  describe('getDeploymentStatus', () => {
    it('should fetch deployment status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployment_id: 'deploy-123',
          status: 'in_progress',
          progress_percent: 45,
          current_step: 'Creating security group',
        }),
      });

      const result = await getDeploymentStatus('deploy-123');
      expect(result.deployment_id).toBe('deploy-123');
      expect(result.progress_percent).toBe(45);
    });
  });

  describe('getDeploymentLogs', () => {
    it('should fetch deployment logs', async () => {
      const logs = [
        { timestamp: '2025-01-01T00:00:00Z', level: 'info', message: 'Starting deployment' },
        { timestamp: '2025-01-01T00:00:05Z', level: 'info', message: 'Creating resources' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs, total: 2 }),
      });

      const result = await getDeploymentLogs('deploy-123');
      expect(result.logs).toHaveLength(2);
      expect(result.logs[0].message).toContain('deployment');
    });
  });

  describe('cancelDeployment', () => {
    it('should cancel ongoing deployment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deployment_id: 'deploy-123', status: 'cancelled' }),
      });

      const result = await cancelDeployment('deploy-123');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('rollbackDeployment', () => {
    it('should rollback completed deployment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployment_id: 'deploy-123',
          status: 'rolling_back',
          rollback_step: 1,
        }),
      });

      const result = await rollbackDeployment('deploy-123');
      expect(result.status).toBe('rolling_back');
    });
  });

  describe('getInfrastructureTypes', () => {
    it('should list infrastructure types by provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          types: [
            { id: 'ec2', label: 'EC2', description: 'Elastic Compute Cloud' },
            { id: 'lambda', label: 'Lambda', description: 'Serverless' },
          ],
        }),
      });

      const result = await getInfrastructureTypes('aws');
      expect(result.types).toHaveLength(2);
      expect(result.types[0].id).toBe('ec2');
    });
  });

  describe('validateCredentials', () => {
    it('should validate provider credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, account_id: '123456789' }),
      });

      const credentials = {
        provider: 'aws',
        access_key: 'AKIAIOSFODNN7EXAMPLE',
        secret_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      };

      const result = await validateCredentials(credentials);
      expect(result.valid).toBe(true);
      expect(result.account_id).toBe('123456789');
    });

    it('should reject invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false, error: 'Access Denied' }),
      });

      const credentials = {
        provider: 'aws',
        access_key: 'invalid',
        secret_key: 'invalid',
      };

      const result = await validateCredentials(credentials);
      expect(result.valid).toBe(false);
    });
  });

  describe('getDeploymentHistory', () => {
    it('should fetch deployment history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployments: [
            {
              deployment_id: 'deploy-123',
              status: 'completed',
              created_at: '2025-01-01T00:00:00Z',
            },
          ],
          total: 1,
        }),
      });

      const result = await getDeploymentHistory({ limit: 10 });
      expect(result.deployments).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('estimateResources', () => {
    it('should estimate resource costs and time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          estimated_cost_monthly: 45.5,
          estimated_deployment_time_minutes: 12,
          resource_count: 8,
        }),
      });

      const config = {
        provider: 'aws',
        region: 'us-east-1',
        infrastructure_type: 'ec2',
        instance_type: 't3.medium',
      };

      const result = await estimateResources(config);
      expect(result.estimated_cost_monthly).toBe(45.5);
      expect(result.estimated_deployment_time_minutes).toBe(12);
    });
  });
});
