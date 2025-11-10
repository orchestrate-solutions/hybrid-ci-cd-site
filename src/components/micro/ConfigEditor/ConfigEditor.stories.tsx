/**
 * ConfigEditor Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ConfigEditor } from './ConfigEditor';

const meta = {
  component: ConfigEditor,
  tags: ['autodocs'],
  argTypes: {
    toolName: { control: 'text' },
    initialConfig: { control: 'object' },
    onSave: { action: 'save' },
    onCancel: { action: 'cancel' },
  },
} satisfies Meta<typeof ConfigEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toolName: 'GitHub Actions',
    initialConfig: {},
  },
};

export const WithInitialConfig: Story = {
  args: {
    toolName: 'GitHub Actions',
    initialConfig: {
      owner: 'orchestrate-solutions',
      repo: 'hybrid-ci-cd-site',
      token: '***hidden***',
    },
  },
};

export const WithValidation: Story = {
  args: {
    toolName: 'Jenkins',
    initialConfig: {
      url: 'https://jenkins.example.com',
      username: 'admin',
    },
  },
};

export const LongConfigWithMany Fields: Story = {
  args: {
    toolName: 'Kubernetes',
    initialConfig: {
      clusterName: 'production-us-west',
      namespace: 'default',
      kubeconfig: '***hidden***',
      apiServer: 'https://api.k8s.example.com',
      caBundle: '***hidden***',
      clientKey: '***hidden***',
      clientCert: '***hidden***',
    },
  },
};
