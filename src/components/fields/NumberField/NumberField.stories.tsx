import type { Meta, StoryObj } from '@storybook/react';
import { NumberField } from './NumberField';

const meta = {
  component: NumberField,
  tags: ['autodocs'],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Quantity',
    placeholder: 'Enter quantity',
  },
};

export const WithMinMax: Story = {
  args: {
    label: 'Port',
    inputProps: { min: 1, max: 65535 },
    helperText: 'Valid port range: 1-65535',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Timeout (seconds)',
    value: 30,
    inputProps: { min: 0 },
  },
};
