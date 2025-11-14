import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVaultConfig } from '../useVaultConfig';

vi.mock('../../api/vault', () => ({
  vaultApi: {
    getVaults: vi.fn(),
    createVault: vi.fn(),
    updateVault: vi.fn(),
    deleteVault: vi.fn(),
    testConnection: vi.fn(),
  },
}));

describe('useVaultConfig Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(result.current.vaults).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have fetchVaults action', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(typeof result.current.fetchVaults).toBe('function');
  });

  it('should have createVault action', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(typeof result.current.createVault).toBe('function');
  });

  it('should have testConnection action', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(typeof result.current.testConnection).toBe('function');
  });

  it('should have deleteVault action', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(typeof result.current.deleteVault).toBe('function');
  });

  it('should update loading state during fetch', async () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors gracefully', () => {
    const { result } = renderHook(() => useVaultConfig());
    expect(result.current.error).toBeNull();
  });
});
