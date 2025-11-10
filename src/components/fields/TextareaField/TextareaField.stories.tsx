import type { Meta, StoryObj } from '@storybook/react';
import { TextareaField } from './TextareaField';

const meta = {
  component: TextareaField,
  tags: ['autodocs'],
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Enter notes...',
    rows: 4,
  },
};

export const Large: Story = {
  args: {
    label: 'Description',
    rows: 8,
    placeholder: 'Detailed description',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Comments',
    rows: 5,
    helperText: 'Keep it concise',
  },
};
