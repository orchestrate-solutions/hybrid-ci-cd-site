import { Meta, StoryObj } from '@storybook/react';
import { TextField } from './TextField';

export default {
  component: TextField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'boolean' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    variant: { control: { type: 'select', options: ['outlined', 'filled', 'standard'] } },
    size: { control: { type: 'select', options: ['small', 'medium'] } },
  },
} satisfies Meta<typeof TextField>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'user@example.com',
    value: 'john@example.com',
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: true,
    helperText: 'Username must be at least 3 characters',
  },
};

export const Required: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    required: true,
    helperText: 'Must contain uppercase, lowercase, and number',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Account ID',
    value: 'ACC-12345',
    disabled: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'API Key',
    placeholder: 'sk_live_...',
    helperText: 'Keep this secret. Never share your API key.',
    type: 'password',
  },
};

export const Small: Story = {
  args: {
    label: 'Search',
    placeholder: 'Type to search...',
    size: 'small',
  },
};

export const Multiline: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description',
    multiline: true,
    rows: 4,
  },
};
