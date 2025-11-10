import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PluginCard } from '../PluginCard';

const mockPlugin = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  author: 'Test Author',
  description: 'Test plugin description',
  stars: 100,
  downloads: 500,
  verified: true,
  status: 'available' as const,
};

describe('PluginCard', () => {
  // Rendering tests
  it('renders plugin name', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('Test Plugin')).toBeInTheDocument();
  });

  it('renders plugin version', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('renders plugin author', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
  });

  it('renders plugin description', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('Test plugin description')).toBeInTheDocument();
  });

  it('renders star count', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders download count', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    expect(screen.getByText('500 downloads')).toBeInTheDocument();
  });

  // Status badge tests
  it('shows verified badge when verified=true', () => {
    render(<PluginCard plugin={{ ...mockPlugin, verified: true }} onInstall={vi.fn()} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('does not show verified badge when verified=false', () => {
    render(<PluginCard plugin={{ ...mockPlugin, verified: false }} onInstall={vi.fn()} />);
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  // Status indicator tests
  it('shows "Install" button when status=available', () => {
    render(<PluginCard plugin={{ ...mockPlugin, status: 'available' }} onInstall={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Install');
  });

  it('shows "Configure" button when status=installed', () => {
    render(<PluginCard plugin={{ ...mockPlugin, status: 'installed' }} onInstall={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Configure');
  });

  it('shows "Update Available" badge when status=update-available', () => {
    render(
      <PluginCard
        plugin={{ ...mockPlugin, status: 'update-available', installedVersion: '1.0.0' }}
        onInstall={vi.fn()}
      />
    );
    expect(screen.getByText('Update Available')).toBeInTheDocument();
  });

  // Interaction tests
  it('calls onInstall when Install button clicked', async () => {
    const onInstall = vi.fn();
    const user = userEvent.setup();
    render(<PluginCard plugin={{ ...mockPlugin, status: 'available' }} onInstall={onInstall} />);

    const button = screen.getByRole('button', { name: /Install/i });
    await user.click(button);

    expect(onInstall).toHaveBeenCalledWith(mockPlugin.id);
  });

  it('calls onInstall when Configure button clicked', async () => {
    const onInstall = vi.fn();
    const user = userEvent.setup();
    render(<PluginCard plugin={{ ...mockPlugin, status: 'installed' }} onInstall={onInstall} />);

    const button = screen.getByRole('button', { name: /Configure/i });
    await user.click(button);

    expect(onInstall).toHaveBeenCalledWith(mockPlugin.id);
  });

  it('calls onInstall when Update button clicked', async () => {
    const onInstall = vi.fn();
    const user = userEvent.setup();
    render(
      <PluginCard
        plugin={{ ...mockPlugin, status: 'update-available', installedVersion: '1.0.0' }}
        onInstall={onInstall}
      />
    );

    const button = screen.getByRole('button', { name: /Update/i });
    await user.click(button);

    expect(onInstall).toHaveBeenCalledWith(mockPlugin.id);
  });

  // Long content tests
  it('truncates long plugin names', () => {
    const longPlugin = {
      ...mockPlugin,
      name: 'This is a very long plugin name that should be truncated for display purposes',
    };
    const { container } = render(<PluginCard plugin={longPlugin} onInstall={vi.fn()} />);
    const nameElement = container.querySelector('[data-testid="plugin-name"]');
    expect(nameElement).toHaveClass('truncate');
  });

  it('truncates long descriptions', () => {
    const longPlugin = {
      ...mockPlugin,
      description: 'This is a very long description that goes on and on and should be truncated at some point',
    };
    const { container } = render(<PluginCard plugin={longPlugin} onInstall={vi.fn()} />);
    const descElement = container.querySelector('[data-testid="plugin-description"]');
    expect(descElement).toHaveClass('line-clamp-2');
  });

  // Accessibility tests
  it('has proper heading hierarchy', () => {
    render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
  });

  it('button has accessible label', () => {
    render(<PluginCard plugin={{ ...mockPlugin, status: 'available' }} onInstall={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Install/ });
    expect(button).toHaveAccessibleName();
  });

  // CSS variables integration tests
  it('applies CSS variables to card', () => {
    const { container } = render(<PluginCard plugin={mockPlugin} onInstall={vi.fn()} />);
    const card = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(card);
    // Verify card has background-color set (CSS variables in effect)
    expect(styles.backgroundColor).toBeTruthy();
  });
});
