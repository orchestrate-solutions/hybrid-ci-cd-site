import { useState, useCallback, useEffect } from 'react';
import { vaultApi, VaultConfig, VaultCreateRequest, VaultConnectionTest } from '../api/vault';

interface UseVaultConfigReturn {
  vaults: VaultConfig[];
  loading: boolean;
  error: Error | null;
  fetchVaults: () => Promise<void>;
  createVault: (vault: VaultCreateRequest) => Promise<VaultConfig>;
  updateVault: (vaultId: string, updates: Partial<VaultConfig>) => Promise<VaultConfig>;
  deleteVault: (vaultId: string) => Promise<void>;
  testConnection: (vaultId: string) => Promise<VaultConnectionTest>;
}

export function useVaultConfig(): UseVaultConfigReturn {
  const [vaults, setVaults] = useState<VaultConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all vaults
  const fetchVaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vaultApi.getVaults();
      setVaults(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vaults'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new vault
  const createVaultFn = useCallback(async (vault: VaultCreateRequest): Promise<VaultConfig> => {
    try {
      setError(null);
      const newVault = await vaultApi.createVault(vault);
      setVaults((prev) => [...prev, newVault]);
      return newVault;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create vault');
      setError(error);
      throw error;
    }
  }, []);

  // Update vault
  const updateVaultFn = useCallback(async (vaultId: string, updates: Partial<VaultConfig>) => {
    try {
      setError(null);
      const updated = await vaultApi.updateVault(vaultId, updates);
      setVaults((prev) => prev.map((v) => (v.id === vaultId ? updated : v)));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update vault');
      setError(error);
      throw error;
    }
  }, []);

  // Delete vault
  const deleteVaultFn = useCallback(async (vaultId: string) => {
    try {
      setError(null);
      await vaultApi.deleteVault(vaultId);
      setVaults((prev) => prev.filter((v) => v.id !== vaultId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete vault');
      setError(error);
      throw error;
    }
  }, []);

  // Test connection
  const testConnectionFn = useCallback(async (vaultId: string): Promise<VaultConnectionTest> => {
    try {
      setError(null);
      return await vaultApi.testConnection(vaultId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to test connection');
      setError(error);
      throw error;
    }
  }, []);

  // Load vaults on mount
  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  return {
    vaults,
    loading,
    error,
    fetchVaults,
    createVault: createVaultFn,
    updateVault: updateVaultFn,
    deleteVault: deleteVaultFn,
    testConnection: testConnectionFn,
  };
}
