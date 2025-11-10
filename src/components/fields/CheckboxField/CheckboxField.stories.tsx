import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from './CheckboxField';

const meta = {
  component: CheckboxField,
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxField>;

export default meta;
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
