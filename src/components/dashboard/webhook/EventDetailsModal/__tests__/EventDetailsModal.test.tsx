import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventDetailsModal from '../EventDetailsModal';

describe('EventDetailsModal', () => {
  const mockEvent = {
    id: 'evt_1',
    timestamp: '2025-11-14T10:00:00Z',
    provider: 'github',
    event_type: 'push',
    status: 'success',
    delivery_status: 'delivered',
    retry_count: 0,
    payload_hash: 'sha256_abc123def456',
    signature_verified: true,
    retry_history: [
      { retry_id: 'retry_1', timestamp: '2025-11-14T10:01:00Z', status: 'failed' },
      { retry_id: 'retry_2', timestamp: '2025-11-14T10:05:00Z', status: 'success' },
    ],
  };

  it('should render modal with event details', () => {
    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('push')).toBeInTheDocument();
  });

  it('should display timestamp in human-readable format', () => {
    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText(/2025-11-14/)).toBeInTheDocument();
  });

  it('should show payload hash without exposing full payload', () => {
    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText(/sha256_abc123/)).toBeInTheDocument();
    expect(screen.queryByText(/sk_live_/)).not.toBeInTheDocument(); // No secrets
  });

  it('should display signature verification status', () => {
    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText('Signature Verified')).toBeInTheDocument();
  });

  it('should show retry button for failed events', () => {
    const failedEvent = { ...mockEvent, status: 'failed' };

    render(
      <EventDetailsModal open={true} event={failedEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText('Retry Delivery')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const failedEvent = { ...mockEvent, status: 'failed' };

    render(
      <EventDetailsModal open={true} event={failedEvent} onClose={vi.fn()} onRetry={onRetry} />
    );

    const retryButton = screen.getByText('Retry Delivery');
    await userEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledWith('evt_1');
  });

  it('should display retry history timeline', () => {
    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(screen.getByText('Retry History')).toBeInTheDocument();
    expect(screen.getByText(/Attempt 1.*failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Attempt 2.*success/i)).toBeInTheDocument();
  });

  it('should show empty state if no retries', () => {
    const noRetriesEvent = { ...mockEvent, retry_history: [] };

    render(
      <EventDetailsModal
        open={true}
        event={noRetriesEvent}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('No retry history')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const onClose = vi.fn();

    render(
      <EventDetailsModal open={true} event={mockEvent} onClose={onClose} onRetry={vi.fn()} />
    );

    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when open prop is false', () => {
    const { container } = render(
      <EventDetailsModal open={false} event={mockEvent} onClose={vi.fn()} onRetry={vi.fn()} />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should show loading state during retry', () => {
    const failedEvent = { ...mockEvent, status: 'failed' };

    render(
      <EventDetailsModal
        open={true}
        event={failedEvent}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        isRetrying={true}
      />
    );

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Delivery/ })).toBeDisabled();
  });
});
