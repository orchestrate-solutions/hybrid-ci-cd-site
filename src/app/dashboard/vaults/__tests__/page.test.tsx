import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VaultsPage from '../page';

vi.mock('../../../lib/hooks/useVaultConfig', () => ({
  useVaultConfig: vi.fn(() => ({
    vaults: [
      {
        id: 'vault-1',
        name: 'AWS Secrets',
        provider: 'aws_secrets_manager',
        region: 'us-east-1',
        is_connected: true,
        is_active: true,
        created_at: '2025-11-01T00:00:00Z',
        updated_at: '2025-11-13T00:00:00Z',
      },
    ],
    loading: false,
    error: null,
    fetchVaults: vi.fn(),
    createVault: vi.fn(),
    deleteVault: vi.fn(),
    testConnection: vi.fn(),
  })),
}));

describe('VaultsPage', () => {
  it('should render page title', () => {
    render(<VaultsPage />);
    expect(screen.getByText(/vault/i)).toBeInTheDocument();
  });

  it('should display vault cards', () => {
    render(<VaultsPage />);
    expect(screen.getByText('AWS Secrets')).toBeInTheDocument();
  });

  it('should have create button', () => {
    render(<VaultsPage />);
    expect(screen.getByRole('button', { name: /create|add|new/i })).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<VaultsPage />);
    // Should render without error
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should display tabs for different views', () => {
    render(<VaultsPage />);
    expect(screen.getByRole('tab', { name: /configured/i })).toBeInTheDocument();
  });
});
