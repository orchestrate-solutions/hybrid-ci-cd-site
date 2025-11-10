/**
 * LoadingSpinner Component Stories
 *
 * Demonstrates the LoadingSpinner component in various states and sizes.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  component: LoadingSpinner,
  tags: ['autodocs'],
  title: 'Micro/LoadingSpinner',
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default loading spinner
 */
export const Default: Story = {
  args: {
    size: 'medium',
  },
};

/**
 * Small spinner for compact spaces
 */
export const Small: Story = {
  args: {
    size: 'small',
  },
};

/**
 * Large spinner for prominent loading states
 */
export const Large: Story = {
  args: {
    size: 'large',
  },
};

/**
 * Spinner with loading label
 */
export const WithLabel: Story = {
  args: {
    size: 'medium',
    label: 'Loading data...',
  },
};

/**
 * Large spinner with label
 */
export const LargeWithLabel: Story = {
  args: {
    size: 'large',
    label: 'Please wait while we fetch your content',
  },
};

/**
 * Custom pixel size
 */
export const CustomSize: Story = {
  args: {
    pixelSize: 64,
    label: 'Custom 64px spinner',
  },
};

/**
 * Multiple spinners showing size scale
 */
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
      <LoadingSpinner size="small" label="Small" />
      <LoadingSpinner size="medium" label="Medium" />
      <LoadingSpinner size="large" label="Large" />
    </div>
  ),
};
