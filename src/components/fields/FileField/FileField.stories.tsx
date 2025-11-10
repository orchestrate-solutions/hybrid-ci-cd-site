import type { Meta, StoryObj } from '@storybook/react';
import { FileField } from './FileField';

const meta = {
  component: FileField,
  tags: ['autodocs'],
} satisfies Meta<typeof FileField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Upload Config',
  },
};

export const WithAccept: Story = {
  args: {
    label: 'Upload YAML',
    accept: '.yaml,.yml',
    helperText: 'YAML files only',
  },
};

export const Multiple: Story = {
  args: {
    label: 'Upload Files',
    multiple: true,
    helperText: 'Select multiple files',
  },
};
