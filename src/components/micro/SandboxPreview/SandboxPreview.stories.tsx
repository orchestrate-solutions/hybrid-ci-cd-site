import type { Meta, StoryObj } from '@storybook/react';
import { SandboxPreview } from './SandboxPreview';

const meta = {
  component: SandboxPreview,
  tags: ['autodocs'],
} satisfies Meta<typeof SandboxPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sandbox: {
      id: 'sandbox-1',
      name: 'GitHub Actions Plugin Sandbox',
      isolationLevel: 'strict',
      resources: {
        cpuLimit: '2 cores',
        memoryLimit: '4GB',
        diskLimit: '10GB',
      },
      networkAccess: {
        enabled: true,
        allowedDomains: ['api.github.com', 'github.com', '*.githubusercontent.com'],
        blockedPorts: ['22', '25', '3306'],
      },
      fileSystemAccess: {
        readPaths: ['/app', '/config'],
        writePaths: ['/tmp', '/workspace'],
        restrictedPaths: ['/etc', '/root', '/var/log'],
      },
      status: 'active',
    },
  },
};

export const RestrictedSandbox: Story = {
  args: {
    sandbox: {
      id: 'sandbox-2',
      name: 'Minimal Security Plugin',
      isolationLevel: 'strict',
      resources: {
        cpuLimit: '1 core',
        memoryLimit: '512MB',
        diskLimit: '1GB',
      },
      networkAccess: {
        enabled: false,
        allowedDomains: [],
        blockedPorts: ['1-65535'],
      },
      fileSystemAccess: {
        readPaths: ['/config'],
        writePaths: [],
        restrictedPaths: ['/etc', '/root', '/var/log', '/app'],
      },
      status: 'active',
    },
  },
};

export const PermissiveSandbox: Story = {
  args: {
    sandbox: {
      id: 'sandbox-3',
      name: 'Enterprise Integration Plugin',
      isolationLevel: 'standard',
      resources: {
        cpuLimit: '4 cores',
        memoryLimit: '16GB',
        diskLimit: '100GB',
      },
      networkAccess: {
        enabled: true,
        allowedDomains: ['*'],
        blockedPorts: [],
      },
      fileSystemAccess: {
        readPaths: ['/app', '/config', '/home'],
        writePaths: ['/tmp', '/workspace', '/home'],
        restrictedPaths: [],
      },
      status: 'active',
    },
  },
};

export const InactiveSandbox: Story = {
  args: {
    sandbox: {
      id: 'sandbox-4',
      name: 'Development Sandbox',
      isolationLevel: 'moderate',
      resources: {
        cpuLimit: '2 cores',
        memoryLimit: '8GB',
        diskLimit: '50GB',
      },
      networkAccess: {
        enabled: true,
        allowedDomains: ['localhost', '127.0.0.1'],
        blockedPorts: ['22', '3306', '5432'],
      },
      fileSystemAccess: {
        readPaths: ['/workspace'],
        writePaths: ['/workspace'],
        restrictedPaths: ['/etc', '/root'],
      },
      status: 'inactive',
    },
  },
};
