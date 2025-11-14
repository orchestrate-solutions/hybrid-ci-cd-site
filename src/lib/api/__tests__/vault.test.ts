import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

import { vaultApi } from '../vault';

describe('Vault API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVaults', () => {
    it('should fetch all configured vaults', async () => {
      const mockVaults = [
        {
          id: 'vault-1',
          name: 'AWS Secrets Manager',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: true,
          last_sync: '2025-11-13T10:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vaults: mockVaults }),
      });

      const result = await vaultApi.getVaults();
      expect(result).toEqual(mockVaults);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vault/configs'),
        expect.any(Object)
      );
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(vaultApi.getVaults()).rejects.toThrow('Failed to fetch vaults');
    });
  });

  describe('createVault', () => {
    it('should create a new vault configuration', async () => {
      const newVault = {
        name: 'Azure Key Vault',
        provider: 'azure_keyvault',
        region: 'eastus',
        connection_string: 'https://my-vault.vault.azure.net/',
      };

      const mockResponse = {
        id: 'vault-2',
        ...newVault,
        is_connected: false,
        last_sync: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await vaultApi.createVault(newVault);
      expect(result.id).toBe('vault-2');
      expect(result.name).toBe('Azure Key Vault');
    });

    it('should handle creation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid configuration' }),
      });

      await expect(vaultApi.createVault({} as any)).rejects.toThrow();
    });
  });

  describe('testConnection', () => {
    it('should test vault connectivity', async () => {
      const mockResult = {
        connected: true,
        message: 'Successfully connected to vault',
        latency_ms: 245,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await vaultApi.testConnection('vault-1');
      expect(result.connected).toBe(true);
      expect(result.latency_ms).toBeGreaterThan(0);
    });

    it('should return false on connection failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: false,
          message: 'Connection refused',
          latency_ms: 0,
        }),
      });

      const result = await vaultApi.testConnection('vault-1');
      expect(result.connected).toBe(false);
    });
  });

  describe('updateVault', () => {
    it('should update vault configuration', async () => {
      const updates = { is_active: false };
      const mockResponse = {
        id: 'vault-1',
        name: 'AWS Secrets Manager',
        provider: 'aws_secrets_manager',
        ...updates,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await vaultApi.updateVault('vault-1', updates);
      expect(result.is_active).toBe(false);
    });
  });

  describe('deleteVault', () => {
    it('should delete a vault configuration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await expect(vaultApi.deleteVault('vault-1')).resolves.not.toThrow();
    });
  });

  describe('listSecrets', () => {
    it('should list secrets from a vault', async () => {
      const mockSecrets = [
        { name: 'db_password', created_at: '2025-11-01T00:00:00Z', updated_at: '2025-11-13T00:00:00Z' },
        { name: 'api_key', created_at: '2025-11-05T00:00:00Z', updated_at: '2025-11-12T00:00:00Z' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secrets: mockSecrets }),
      });

      const result = await vaultApi.listSecrets('vault-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('db_password');
    });
  });

  describe('getVaultStatus', () => {
    it('should get vault health and status', async () => {
      const mockStatus = {
        vault_id: 'vault-1',
        is_healthy: true,
        last_sync: '2025-11-13T10:30:00Z',
        sync_frequency_seconds: 300,
        error_count_24h: 0,
        total_secrets: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await vaultApi.getVaultStatus('vault-1');
      expect(result.is_healthy).toBe(true);
      expect(result.total_secrets).toBe(5);
    });
  });
});
