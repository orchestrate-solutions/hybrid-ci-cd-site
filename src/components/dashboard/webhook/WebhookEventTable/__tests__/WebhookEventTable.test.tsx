import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebhookEventTable from '../WebhookEventTable';

describe('WebhookEventTable', () => {
  const mockEvents = [
    {
      id: 'evt_1',
      timestamp: '2025-11-14T10:00:00Z',
      provider: 'github',
      event_type: 'push',
      status: 'success',
      delivery_status: 'delivered',
      retry_count: 0,
    },
    {
      id: 'evt_2',
      timestamp: '2025-11-14T09:00:00Z',
      provider: 'gitlab',
      event_type: 'merge_request',
      status: 'failed',
      delivery_status: 'failed',
      retry_count: 2,
    },
  ];

  it('should render event table with headers', () => {
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Event Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display all events in table rows', () => {
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('gitlab')).toBeInTheDocument();
    expect(screen.getByText('push')).toBeInTheDocument();
  });

  it('should call onSelectEvent when row is clicked', async () => {
    const onSelectEvent = vi.fn();
    render(<WebhookEventTable events={mockEvents} onSelectEvent={onSelectEvent} />);

    const firstRow = screen.getByText('push').closest('tr');
    await userEvent.click(firstRow!);

    expect(onSelectEvent).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('should show loading skeleton when loading prop is true', () => {
    render(
      <WebhookEventTable events={[]} loading={true} onSelectEvent={vi.fn()} />
    );

    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  it('should show empty state when no events', () => {
    render(<WebhookEventTable events={[]} onSelectEvent={vi.fn()} />);

    expect(screen.getByText('No webhook events found')).toBeInTheDocument();
  });

  it('should filter events by provider', async () => {
    const user = userEvent.setup();
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const providerFilter = screen.getByDisplayValue('All Providers');
    await user.click(providerFilter);
    await user.click(screen.getByText('GitHub'));

    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.queryByText('gitlab')).not.toBeInTheDocument();
  });

  it('should filter events by status', async () => {
    const user = userEvent.setup();
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const statusFilter = screen.getByDisplayValue('All Statuses');
    await user.click(statusFilter);
    await user.click(screen.getByText('Success'));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2); // Header + 1 row
  });

  it('should support searching events', async () => {
    const user = userEvent.setup();
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search events...');
    await user.type(searchInput, 'push');

    expect(screen.getByText('push')).toBeInTheDocument();
    expect(screen.queryByText('merge_request')).not.toBeInTheDocument();
  });

  it('should sort events by clicking column headers', async () => {
    const user = userEvent.setup();
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const timestampHeader = screen.getByText('Timestamp');
    await user.click(timestampHeader);

    // After sort, order should change
    const firstTimestamp = screen.getAllByRole('row')[1];
    expect(within(firstTimestamp).getByText('2025-11-14T09:00:00Z')).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    const manyEvents = Array.from({ length: 50 }, (_, i) => ({
      id: `evt_${i}`,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      provider: 'github',
      event_type: 'push',
      status: 'success',
      delivery_status: 'delivered',
      retry_count: 0,
    }));

    render(
      <WebhookEventTable events={manyEvents} itemsPerPage={10} onSelectEvent={vi.fn()} />
    );

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should show retry count for failed events', () => {
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const failedEventRow = screen.getByText('merge_request').closest('tr');
    expect(within(failedEventRow!).getByText('2')).toBeInTheDocument(); // retry_count: 2
  });

  it('should highlight critical events (delivery failed)', () => {
    render(<WebhookEventTable events={mockEvents} onSelectEvent={vi.fn()} />);

    const failedEventRow = screen.getByText('merge_request').closest('tr');
    expect(failedEventRow).toHaveClass('error-row');
  });
});
