import type { Meta, StoryObj } from '@storybook/react';
import PayloadViewer from './PayloadViewer';

const meta = {
  component: PayloadViewer,
  tags: ['autodocs'],
  argTypes: {
    payload: { control: 'object' },
    hash: { control: 'text' },
    searchable: { control: 'boolean' },
  },
} satisfies Meta<typeof PayloadViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSimplePayload = {
  repository: 'my-repo',
  branch: 'main',
  commit: {
    sha: 'abc123def456',
    message: 'Add new feature',
    author: 'john-dev',
  },
  timestamp: '2025-11-14T10:00:00Z',
};

const mockComplexPayload = {
  repository: {
    name: 'hybrid-ci-cd',
    url: 'https://github.com/orchestrate-solutions/hybrid-ci-cd',
    private: false,
    owner: 'orchestrate-solutions',
  },
  pusher: {
    name: 'alice-engineer',
    email: 'alice@example.com',
  },
  commits: [
    {
      id: 'abc123',
      message: 'Implement feature X',
      timestamp: '2025-11-14T10:00:00Z',
      author: { name: 'alice', email: 'alice@example.com' },
      modified: ['src/feature.ts', 'tests/feature.test.ts'],
    },
    {
      id: 'def456',
      message: 'Fix bug in feature Y',
      timestamp: '2025-11-14T10:15:00Z',
      author: { name: 'bob', email: 'bob@example.com' },
      modified: ['src/bugfix.ts'],
    },
  ],
  branch: 'feature/new-dashboard',
  before: 'old_sha_1234',
  after: 'new_sha_5678',
};

const mockLargePayload = Object.fromEntries(
  Array.from({ length: 150 }, (_, i) => [
    `field_${i}`,
    `value_${i}_with_some_data_${Math.random().toString(36).substring(7)}`,
  ])
);

export const SimplePayload: Story = {
  args: {
    payload: mockSimplePayload,
    hash: 'sha256_abc123def456ghi789',
    searchable: true,
  },
};

export const ComplexPayload: Story = {
  args: {
    payload: mockComplexPayload,
    hash: 'sha256_xyz789abc123def456',
    searchable: true,
  },
};

export const LargePayload: Story = {
  args: {
    payload: mockLargePayload,
    hash: 'sha256_large_payload_hash',
    searchable: true,
  },
};

export const NoSearchable: Story = {
  args: {
    payload: mockSimplePayload,
    hash: 'sha256_abc123',
    searchable: false,
  },
};

export const NullPayload: Story = {
  args: {
    payload: null,
    hash: 'sha256_missing',
    searchable: true,
  },
};

export const SensitiveDataRedacted: Story = {
  args: {
    payload: {
      repository: 'repo',
      api_key: 'sk_live_secret123456789',
      token: 'ghp_xxxxxxxxxxx',
      password: 'my_secure_password',
      webhook_secret: 'webhook_secret_123',
      public_data: 'this_is_fine',
    },
    hash: 'sha256_sensitive',
    searchable: true,
  },
  render: (args) => (
    <div>
      <p style={{ color: 'red' }}>
        <strong>NOTE:</strong> Sensitive fields (API keys, tokens, passwords, secrets) should be
        redacted/hidden
      </p>
      <PayloadViewer {...args} />
    </div>
  ),
};

export const DeepNesting: Story = {
  args: {
    payload: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                data: 'deeply nested',
                array: [1, 2, 3],
              },
            },
          },
        },
      },
    },
    hash: 'sha256_deeply_nested',
    searchable: true,
  },
};

export const ArrayPayload: Story = {
  args: {
    payload: {
      items: [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'inactive' },
        { id: 3, name: 'Item 3', status: 'active' },
      ],
      count: 3,
    },
    hash: 'sha256_arrays',
    searchable: true,
  },
};
