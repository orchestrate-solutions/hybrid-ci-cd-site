import { Meta, StoryObj } from '@storybook/react';
import { DateField } from './DateField';

export default {
  component: DateField,
  tags: ['autodocs'],
} satisfies Meta<typeof DateField>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Start Date',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Date of Birth',
    value: '1990-01-15',
  },
};

export const WithRange: Story = {
  args: {
    label: 'Deployment Date',
    helperText: 'Must be in the future',
    inputProps: { min: new Date().toISOString().split('T')[0] },
  },
};
