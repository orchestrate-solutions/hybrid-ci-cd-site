import type { Meta, StoryObj } from '@storybook/react';
import { PasswordField } from './PasswordField';

const meta = {
  component: PasswordField,
  tags: ['autodocs'],
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
  },
};

export const WithValidation: Story = {
  args: {
    label: 'New Password',
    helperText: 'Min 8 characters, 1 uppercase, 1 number',
  },
};

export const Confirm: Story = {
  args: {
    label: 'Confirm Password',
    placeholder: 'Re-enter password',
  },
};
