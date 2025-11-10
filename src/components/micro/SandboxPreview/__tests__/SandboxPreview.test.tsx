import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SandboxPreview } from '../SandboxPreview';

const mockSandbox = {
  id: 'sandbox-1',
  name: 'GitHub Actions Plugin Sandbox',
  isolationLevel: 'strict' as const,
  resources: {
    cpuLimit: '2 cores',
    memoryLimit: '4GB',
    diskLimit: '10GB',
  },
  networkAccess: {
    enabled: true,
    allowedDomains: ['api.github.com', 'github.com'],
    blockedPorts: ['22', '25', '3306'],
  },
  fileSystemAccess: {
    readPaths: ['/app', '/config'],
    writePaths: ['/tmp', '/workspace'],
    restrictedPaths: ['/etc', '/root', '/var/log'],
  },
  status: 'active' as const,
};

describe('SandboxPreview', () => {
  // Rendering tests
  it('renders sandbox name', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('GitHub Actions Plugin Sandbox')).toBeInTheDocument();
  });

  it('renders sandbox ID', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText(/sandbox-1/)).toBeInTheDocument();
  });

  // Isolation level badge tests
  it('displays isolation level badge', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText(/strict/i)).toBeInTheDocument();
  });

  // Resource limits tests
  it('renders CPU limit', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('2 cores')).toBeInTheDocument();
  });

  it('renders memory limit', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('4GB')).toBeInTheDocument();
  });

  it('renders disk limit', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('10GB')).toBeInTheDocument();
  });

  // Network access tests
  it('shows network access status', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText(/network access enabled/i)).toBeInTheDocument();
  });

  it('displays allowed domains', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('api.github.com')).toBeInTheDocument();
    expect(screen.getByText('github.com')).toBeInTheDocument();
  });

  it('displays blocked ports', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  // File system access tests
  it('displays read paths', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('/app')).toBeInTheDocument();
    expect(screen.getByText('/config')).toBeInTheDocument();
  });

  it('displays write paths', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('/tmp')).toBeInTheDocument();
    expect(screen.getByText('/workspace')).toBeInTheDocument();
  });

  it('displays restricted paths', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('/etc')).toBeInTheDocument();
    expect(screen.getByText('/root')).toBeInTheDocument();
  });

  // Status badge tests
  it('shows active status badge', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows inactive status badge', () => {
    const inactiveSandbox = { ...mockSandbox, status: 'inactive' as const };
    render(<SandboxPreview sandbox={inactiveSandbox} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  // Network disabled tests
  it('shows network disabled message', () => {
    const noNetworkSandbox = {
      ...mockSandbox,
      networkAccess: { ...mockSandbox.networkAccess, enabled: false },
    };
    render(<SandboxPreview sandbox={noNetworkSandbox} />);
    expect(screen.getByText(/network access disabled/i)).toBeInTheDocument();
  });

  // Accessibility tests
  it('has proper heading hierarchy', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
  });

  it('renders sections with proper headings', () => {
    render(<SandboxPreview sandbox={mockSandbox} />);
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Network Access')).toBeInTheDocument();
    expect(screen.getByText('File System Access')).toBeInTheDocument();
  });

  // Empty collections handling
  it('handles empty allowed domains', () => {
    const noDomainsSandbox = {
      ...mockSandbox,
      networkAccess: { ...mockSandbox.networkAccess, allowedDomains: [] },
    };
    render(<SandboxPreview sandbox={noDomainsSandbox} />);
    expect(screen.getByText(/no domains allowed/i)).toBeInTheDocument();
  });

  it('handles empty blocked ports', () => {
    const noPortsSandbox = {
      ...mockSandbox,
      networkAccess: { ...mockSandbox.networkAccess, blockedPorts: [] },
    };
    render(<SandboxPreview sandbox={noPortsSandbox} />);
    expect(screen.getByText(/no ports blocked/i)).toBeInTheDocument();
  });
});
