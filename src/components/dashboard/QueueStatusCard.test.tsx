import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueueStatusCard } from './QueueStatusCard';
import { Timeline, CheckCircle, AlertCircle } from '@mui/icons-material';

describe('QueueStatusCard', () => {
  it('should render title and value', () => {
    render(
      <QueueStatusCard
        title="Queued"
        value={42}
        icon={<Timeline />}
      />
    );
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <QueueStatusCard
        title="Queued"
        value={42}
        icon={<Timeline />}
        loading
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state with message', () => {
    render(
      <QueueStatusCard
        title="Queued"
        value={0}
        icon={<AlertCircle />}
        error="Failed to load"
      />
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should apply success color variant', () => {
    const { container } = render(
      <QueueStatusCard
        title="Completed"
        value={100}
        icon={<CheckCircle />}
        color="success"
      />
    );
    expect(container.querySelector('[class*="success"]')).toBeInTheDocument();
  });

  it('should display trend when provided', () => {
    render(
      <QueueStatusCard
        title="Queued"
        value={42}
        icon={<Timeline />}
        trend={+5}
      />
    );
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
  });
});
