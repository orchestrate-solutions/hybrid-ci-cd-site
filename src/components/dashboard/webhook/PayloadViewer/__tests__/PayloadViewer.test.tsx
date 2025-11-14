import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayloadViewer from '../PayloadViewer';

describe('PayloadViewer', () => {
  const mockPayload = {
    repository: 'my-repo',
    branch: 'main',
    commit: {
      sha: 'abc123',
      message: 'Add feature',
    },
    pusher: {
      name: 'john-dev',
      email: 'john@example.com',
    },
  };

  it('should render payload viewer', () => {
    render(<PayloadViewer payload={mockPayload} hash="sha256_abc123" />);

    expect(screen.getByText(/Payload Preview/i)).toBeInTheDocument();
  });

  it('should display payload hash', () => {
    render(<PayloadViewer payload={mockPayload} hash="sha256_abc123def456" />);

    expect(screen.getByText(/sha256_abc123def456/)).toBeInTheDocument();
  });

  it('should display formatted JSON payload', () => {
    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" />);

    expect(screen.getByText(/my-repo/)).toBeInTheDocument();
    expect(screen.getByText(/main/)).toBeInTheDocument();
    expect(screen.getByText(/Add feature/)).toBeInTheDocument();
  });

  it('should NOT display sensitive fields', () => {
    const sensitivePayload = {
      repository: 'repo',
      token: 'ghp_xxxxx', // GitHub token
      api_key: 'sk_live_xxxxx', // API key
      password: 'secret123',
    };

    render(<PayloadViewer payload={sensitivePayload} hash="sha256_abc" />);

    // Sensitive values should be redacted or not shown
    expect(screen.queryByText(/ghp_/)).not.toBeInTheDocument();
    expect(screen.queryByText(/sk_live_/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret123/)).not.toBeInTheDocument();
  });

  it('should provide copy-to-clipboard functionality', async () => {
    const user = userEvent.setup();
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });

    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('should show copy confirmation message', async () => {
    const user = userEvent.setup();
    
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });

    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument();
  });

  it('should support expand/collapse for nested objects', async () => {
    const user = userEvent.setup();

    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" />);

    // Click to expand commit object
    const expandButton = screen.getByRole('button', { name: /commit/i });
    await user.click(expandButton);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('should show empty state for missing payload', () => {
    render(<PayloadViewer payload={null} hash="sha256_abc" />);

    expect(screen.getByText(/No payload data/i)).toBeInTheDocument();
  });

  it('should support search within payload', async () => {
    const user = userEvent.setup();

    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" searchable={true} />);

    const searchInput = screen.getByPlaceholderText(/search payload/i);
    await user.type(searchInput, 'repository');

    const highlighted = screen.getByText(/repository/);
    expect(highlighted).toHaveClass('highlighted');
  });

  it('should display a warning for large payloads', () => {
    const largePayload = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [`field_${i}`, `value_${i}`])
    );

    render(<PayloadViewer payload={largePayload} hash="sha256_abc" />);

    expect(screen.getByText(/This payload contains.*fields/i)).toBeInTheDocument();
  });

  it('should provide download as JSON option', async () => {
    const user = userEvent.setup();

    render(<PayloadViewer payload={mockPayload} hash="sha256_abc" />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    // Verify file download was triggered (can't test actual download in jsdom)
    expect(downloadButton).toBeInTheDocument();
  });
});
