import type { Meta, StoryObj } from '@storybook/react';
import { InfrastructureSelector } from './InfrastructureSelector';

const meta = {
  component: InfrastructureSelector,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'text' },
    disabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    onSelect: { action: 'Selected' },
  },
} satisfies Meta<typeof InfrastructureSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockInfrastructureTypes = [
  {
    id: 'ec2',
    label: 'EC2',
    description: 'Elastic Compute Cloud - Virtual servers with flexible sizing',
    icon: '🖥️',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    supported_sizes: ['t3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge'],
  },
  {
    id: 'lambda',
    label: 'Lambda',
    description: 'Serverless compute - Pay only for execution time',
    icon: '⚡',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    supported_sizes: ['128MB', '512MB', '1GB', '3GB'],
  },
  {
    id: 'ecs',
    label: 'ECS',
    description: 'Elastic Container Service - Docker container orchestration',
    icon: '🐳',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    supported_sizes: ['256', '512', '1024', '2048'],
  },
];

export const Default: Story = {
  args: {
    options: mockInfrastructureTypes,
    selected: null,
    disabled: false,
  },
};

export const WithSelection: Story = {
  args: {
    options: mockInfrastructureTypes,
    selected: 'ec2',
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    options: mockInfrastructureTypes,
    selected: null,
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    options: [],
    selected: null,
    disabled: false,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    options: [],
    selected: null,
    disabled: false,
    error: 'Failed to load infrastructure types. Please try again.',
  },
};

export const LambdaSelected: Story = {
  args: {
    options: mockInfrastructureTypes,
    selected: 'lambda',
    disabled: false,
  },
};

export const LimitedOptions: Story = {
  args: {
    options: [mockInfrastructureTypes[0], mockInfrastructureTypes[1]],
    selected: null,
    disabled: false,
  },
};
