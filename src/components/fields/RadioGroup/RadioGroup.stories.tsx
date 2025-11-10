import { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from './RadioGroup';

export default {
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Choose option',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};

export const WithValue: Story = {
  args: {
    label: 'Visibility',
    value: 'private',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
      { value: 'internal', label: 'Internal' },
    ],
  },
};
