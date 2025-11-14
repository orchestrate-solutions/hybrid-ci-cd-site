import type { Meta, StoryObj } from '@storybook/react';
import { WizardSteps } from './WizardSteps';

const meta = {
  component: WizardSteps,
  tags: ['autodocs'],
  argTypes: {
    currentStep: { control: 'number' },
    totalSteps: { control: 'number' },
    onStepChange: { action: 'Step changed' },
    showProgress: { control: 'boolean' },
    showLabels: { control: 'boolean' },
  },
} satisfies Meta<typeof WizardSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [
  'Provider Selection',
  'Infrastructure Type',
  'Region & Sizing',
  'Network Configuration',
  'Review Configuration',
  'Deploy & Monitor',
];

const stepContent = (
  <div style={{ padding: '1rem', minHeight: '300px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
    <p>Step content would go here...</p>
  </div>
);

export const Step1Start: Story = {
  args: {
    currentStep: 1,
    totalSteps: 6,
    steps,
    children: stepContent,
  },
};

export const Step3InProgress: Story = {
  args: {
    currentStep: 3,
    totalSteps: 6,
    steps,
    children: stepContent,
  },
};

export const Step6Final: Story = {
  args: {
    currentStep: 6,
    totalSteps: 6,
    steps,
    children: stepContent,
  },
};

export const WithoutProgress: Story = {
  args: {
    currentStep: 2,
    totalSteps: 6,
    steps,
    children: stepContent,
    showProgress: false,
  },
};

export const WithoutLabels: Story = {
  args: {
    currentStep: 4,
    totalSteps: 6,
    steps,
    children: stepContent,
    showLabels: false,
  },
};
