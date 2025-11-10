import type { Meta, StoryObj } from '@storybook/react';
import { SelectField } from './SelectField';

const meta = {
  component: SelectField,
  tags: ['autodocs'],
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Environment',
    options: [
      { value: 'dev', label: 'Development' },
      { value: 'staging', label: 'Staging' },
      { value: 'prod', label: 'Production' },
    ],
  },
};

export const WithValue: Story = {
  args: {
    label: 'Priority',
    value: 'high',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    label: 'Status',
    value: 'active',
    disabled: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: 'Region',
    error: true,
    helperText: 'Please select a region',
    options: [
      { value: 'us', label: 'US' },
      { value: 'eu', label: 'Europe' },
      { value: 'asia', label: 'Asia' },
    ],
  },
};
