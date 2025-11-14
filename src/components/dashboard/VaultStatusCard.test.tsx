import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VaultStatusCard } from './VaultStatusCard';

describe('VaultStatusCard', () => {
  it('should render vault name', () => {
    render(
      <VaultStatusCard
        vault={{
          id: 'vault-1',
          name: 'AWS Secrets Manager',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: true,
          is_active: true,
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-13T00:00:00Z',
        }}
      />
    );
    expect(screen.getByText('AWS Secrets Manager')).toBeInTheDocument();
  });

  it('should show connected status when is_connected true', () => {
    render(
      <VaultStatusCard
        vault={{
          id: 'vault-1',
          name: 'AWS',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: true,
          is_active: true,
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-13T00:00:00Z',
        }}
      />
    );
    const element = screen.getByText(/connected|active/i);
    expect(element).toBeInTheDocument();
  });

  it('should show disconnected status when is_connected false', () => {
    render(
      <VaultStatusCard
        vault={{
          id: 'vault-1',
          name: 'AWS',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: false,
          is_active: true,
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-13T00:00:00Z',
        }}
      />
    );
    expect(screen.getByText(/disconnected|error|failed/i)).toBeInTheDocument();
  });

  it('should display provider name', () => {
    render(
      <VaultStatusCard
        vault={{
          id: 'vault-1',
          name: 'AWS',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: true,
          is_active: true,
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-13T00:00:00Z',
        }}
      />
    );
    expect(screen.getByText(/aws|secrets|manager/i)).toBeInTheDocument();
  });

  it('should render test connection button', () => {
    render(
      <VaultStatusCard
        vault={{
          id: 'vault-1',
          name: 'AWS',
          provider: 'aws_secrets_manager',
          region: 'us-east-1',
          is_connected: true,
          is_active: true,
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-13T00:00:00Z',
        }}
        onTest={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
  });
});
