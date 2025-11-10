import { Meta, StoryObj } from '@storybook/react';
import { PluginCard } from './PluginCard';

export default {
  component: PluginCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PluginCard>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    plugin: {
      id: 'github-actions-plugin',
      name: 'GitHub Actions Integration',
      version: '1.2.3',
      author: 'Orchestrate Solutions',
      description: 'Seamlessly integrate GitHub Actions workflows into your CI/CD pipeline',
      stars: 342,
      downloads: 1240,
      verified: true,
      status: 'available',
    },
    onInstall: () => console.log('Install clicked'),
  },
};

export const Installed: Story = {
  args: {
    plugin: {
      id: 'github-actions-plugin',
      name: 'GitHub Actions Integration',
      version: '1.2.3',
      author: 'Orchestrate Solutions',
      description: 'Seamlessly integrate GitHub Actions workflows into your CI/CD pipeline',
      stars: 342,
      downloads: 1240,
      verified: true,
      status: 'installed',
    },
    onInstall: () => console.log('Configure clicked'),
  },
};

export const UpdateAvailable: Story = {
  args: {
    plugin: {
      id: 'github-actions-plugin',
      name: 'GitHub Actions Integration',
      version: '1.3.0',
      author: 'Orchestrate Solutions',
      description: 'Seamlessly integrate GitHub Actions workflows into your CI/CD pipeline',
      stars: 342,
      downloads: 1240,
      verified: true,
      status: 'update-available',
      installedVersion: '1.2.3',
    },
    onInstall: () => console.log('Update clicked'),
  },
};

export const Unverified: Story = {
  args: {
    plugin: {
      id: 'custom-plugin',
      name: 'Custom Deployment Tool',
      version: '0.5.0',
      author: 'Community Developer',
      description: 'Custom deployment orchestration for specialized infrastructure',
      stars: 12,
      downloads: 45,
      verified: false,
      status: 'available',
    },
    onInstall: () => console.log('Install clicked'),
  },
};

export const LongContent: Story = {
  args: {
    plugin: {
      id: 'complex-plugin',
      name: 'Advanced Multi-Cloud Orchestration with Extended Deployment Capabilities',
      version: '2.0.1',
      author: 'Enterprise Solutions Corporation',
      description:
        'Comprehensive multi-cloud deployment orchestration supporting AWS, Azure, GCP with advanced networking, security policies, and compliance automation',
      stars: 1250,
      downloads: 45320,
      verified: true,
      status: 'available',
    },
    onInstall: () => console.log('Install clicked'),
  },
};

export const HighEngagement: Story = {
  args: {
    plugin: {
      id: 'popular-plugin',
      name: 'Docker Registry Manager',
      version: '3.1.0',
      author: 'Container Experts',
      description: 'Enterprise-grade Docker image management and security scanning',
      stars: 5230,
      downloads: 198450,
      verified: true,
      status: 'installed',
    },
    onInstall: () => console.log('Configure clicked'),
  },
};
