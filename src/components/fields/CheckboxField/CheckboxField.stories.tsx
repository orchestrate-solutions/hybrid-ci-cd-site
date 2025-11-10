import { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from './CheckboxField';

export default {
  component: CheckboxField,
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxField>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'I agree to terms',
  },
};

export const Checked: Story = {
  args: {
    label: 'Subscribe to updates',
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read-only setting',
    disabled: true,
    checked: true,
  },
};
