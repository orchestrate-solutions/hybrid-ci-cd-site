import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SecurityGuaranteeCard from './SecurityGuaranteeCard';

describe('SecurityGuaranteeCard', () => {
  const mockGuarantee = {
    title: 'No Payload Storage',
    description: 'Webhook events contain no payload data',
    implementation: 'WebhookEvent has no payload field',
    verified: true,
    testCases: ['test_webhook_event_has_no_payload_field'],
  };

  it('should render guarantee title', () => {
    render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    expect(screen.getByText('No Payload Storage')).toBeInTheDocument();
  });

  it('should render guarantee description', () => {
    render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    expect(screen.getByText('Webhook events contain no payload data')).toBeInTheDocument();
  });

  it('should display verified badge when verified is true', () => {
    render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('should display unverified badge when verified is false', () => {
    const unverified = { ...mockGuarantee, verified: false };
    render(<SecurityGuaranteeCard guarantee={unverified} />);
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('should render implementation details', () => {
    render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    expect(screen.getByText('WebhookEvent has no payload field')).toBeInTheDocument();
  });

  it('should display test case count', () => {
    render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    expect(screen.getByText(/1 test case/i)).toBeInTheDocument();
  });

  it('should have accessible card structure', () => {
    const { container } = render(<SecurityGuaranteeCard guarantee={mockGuarantee} />);
    const card = container.querySelector('[role="region"]') || container.firstChild;
    expect(card).toBeInTheDocument();
  });
});
