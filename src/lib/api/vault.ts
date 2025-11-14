const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VaultConfig {
  id: string;
  name: string;
  provider: 'aws_secrets_manager' | 'azure_keyvault' | 'gcp_secret_manager';
  region: string;
  is_connected: boolean;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface VaultSecret {
  name: string;
  created_at: string;
  updated_at: string;
}

export interface VaultConnectionTest {
  connected: boolean;
  message: string;
  latency_ms: number;
}

export interface VaultStatus {
  vault_id: string;
  is_healthy: boolean;
  last_sync: string;
  sync_frequency_seconds: number;
  error_count_24h: number;
  total_secrets: number;
}

export interface VaultCreateRequest {
  name: string;
  provider: 'aws_secrets_manager' | 'azure_keyvault' | 'gcp_secret_manager';
  region: string;
  connection_string?: string;
}

export const vaultApi = {
  async getVaults(): Promise<VaultConfig[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/configs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.vaults || [];
    } catch (err) {
      throw new Error(`Failed to fetch vaults: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async createVault(vault: VaultCreateRequest): Promise<VaultConfig> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vault),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(`Failed to create vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async updateVault(vaultId: string, updates: Partial<VaultConfig>): Promise<VaultConfig> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/configs/${vaultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(`Failed to update vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async deleteVault(vaultId: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/configs/${vaultId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      throw new Error(`Failed to delete vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async testConnection(vaultId: string): Promise<VaultConnectionTest> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/test/${vaultId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(`Failed to test connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async listSecrets(vaultId: string): Promise<VaultSecret[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/${vaultId}/secrets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.secrets || [];
    } catch (err) {
      throw new Error(`Failed to list secrets: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },

  async getVaultStatus(vaultId: string): Promise<VaultStatus> {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/${vaultId}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(`Failed to get vault status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  },
};
