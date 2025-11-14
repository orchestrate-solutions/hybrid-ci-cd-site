import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebhookEventsPage from '../page';

vi.mock('../../api/webhooks');
vi.mock('../../hooks/useWebhookEvents');

describe('WebhookEventsPage', () => {
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

  it('should render page title and description', () => {
    render(<WebhookEventsPage />);

    expect(screen.getByText('Webhook Events')).toBeInTheDocument();
    expect(screen.getByText(/View and debug webhook deliveries/i)).toBeInTheDocument();
  });

  it('should display event statistics', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show successful delivery count', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    expect(screen.getByText('Successful')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 success
  });

  it('should show failed delivery count', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 failed
  });

  it('should display average retry count', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    expect(screen.getByText('Avg Retries')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // (0 + 2) / 2 = 1
  });

  it('should render webhook event table', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Event Type')).toBeInTheDocument();
  });

  it('should support date range filtering', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const startDateInput = screen.getByLabelText('Start Date');
    await user.click(startDateInput);
    await user.type(startDateInput, '2025-11-14');

    const endDateInput = screen.getByLabelText('End Date');
    await user.click(endDateInput);
    await user.type(endDateInput, '2025-11-14');

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('github')).toBeInTheDocument();
    });
  });

  it('should filter by provider', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const providerFilter = screen.getByDisplayValue('All Providers');
    await user.click(providerFilter);
    await user.click(screen.getByText('GitHub'));

    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.queryByText('gitlab')).not.toBeInTheDocument();
  });

  it('should filter by delivery status', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const statusFilter = screen.getByDisplayValue('All Statuses');
    await user.click(statusFilter);
    await user.click(screen.getByText('Failed'));

    expect(screen.getByText('merge_request')).toBeInTheDocument();
    expect(screen.queryByText('push')).not.toBeInTheDocument();
  });

  it('should provide search functionality', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const searchInput = screen.getByPlaceholderText('Search events...');
    await user.type(searchInput, 'push');

    expect(screen.getByText('push')).toBeInTheDocument();
    expect(screen.queryByText('merge_request')).not.toBeInTheDocument();
  });

  it('should open event details modal when event is clicked', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const pushEventRow = screen.getByText('push').closest('tr');
    await user.click(pushEventRow!);

    expect(screen.getByText('Event Details')).toBeInTheDocument();
  });

  it('should support manual retry from modal', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const failedEventRow = screen.getByText('merge_request').closest('tr');
    await user.click(failedEventRow!);

    const retryButton = screen.getByText('Retry Delivery');
    await user.click(retryButton);

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('should provide export to CSV option', async () => {
    const user = userEvent.setup();

    render(<WebhookEventsPage events={mockEvents} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
  });

  it('should show loading state while fetching events', () => {
    render(<WebhookEventsPage loading={true} events={[]} />);

    expect(screen.getByText('Loading webhook events...')).toBeInTheDocument();
  });

  it('should show error state with retry button', () => {
    const error = new Error('Failed to fetch events');

    render(<WebhookEventsPage error={error} events={[]} />);

    expect(screen.getByText(/Failed to fetch webhook events/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show empty state when no events', () => {
    render(<WebhookEventsPage events={[]} />);

    expect(screen.getByText('No webhook events found')).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    const manyEvents = Array.from({ length: 50 }, (_, i) => ({
      id: `evt_${i}`,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      provider: i % 2 === 0 ? 'github' : 'gitlab',
      event_type: 'push',
      status: 'success',
      delivery_status: 'delivered',
      retry_count: 0,
    }));

    render(<WebhookEventsPage events={manyEvents} />);

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should show warning alerts for recent failures', () => {
    const recentFailures = [
      {
        id: 'evt_1',
        timestamp: new Date().toISOString(),
        provider: 'github',
        event_type: 'push',
        status: 'failed',
        delivery_status: 'failed',
        retry_count: 3,
      },
    ];

    render(<WebhookEventsPage events={recentFailures} />);

    expect(screen.getByText(/Recent delivery failures detected/i)).toBeInTheDocument();
  });

  it('should support responsive layout', () => {
    render(<WebhookEventsPage events={mockEvents} />);

    const container = screen.getByText('Webhook Events').closest('div');
    expect(container).toHaveClass('responsive-container');
  });

  it('should refresh events when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    render(<WebhookEventsPage events={mockEvents} onRefresh={refetch} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(refetch).toHaveBeenCalled();
  });
});
