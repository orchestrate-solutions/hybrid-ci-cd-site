import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeploymentConfirmationModal } from '../DeploymentConfirmationModal';

describe('DeploymentConfirmationModal Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const mockDeploymentConfig = {
    provider: 'aws',
    region: 'us-east-1',
    infrastructure_type: 'ec2',
    instance_type: 't3.medium',
    instance_count: 2,
    auto_scaling_min: 1,
    auto_scaling_max: 5,
  };

  const mockEstimates = {
    estimated_cost_monthly: 85.5,
    estimated_deployment_time_minutes: 15,
    resource_count: 12,
  };

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render modal with deployment summary', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Confirm Deployment/i)).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('t3.medium')).toBeInTheDocument();
  });

  it('should display resource estimates', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/\$85.50/)).toBeInTheDocument();
    expect(screen.getByText(/15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/12 resources/)).toBeInTheDocument();
  });

  it('should show resource breakdown', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/EC2 Instances/)).toBeInTheDocument();
    expect(screen.getByText(/Security Groups/)).toBeInTheDocument();
    expect(screen.getByText(/Network Interfaces/)).toBeInTheDocument();
  });

  it('should display configuration summary in table', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cells = screen.getAllByRole('cell');
    expect(cells.some((cell) => cell.textContent === 'AWS')).toBe(true);
    expect(cells.some((cell) => cell.textContent === 'us-east-1')).toBe(true);
  });

  it('should call onConfirm when Deploy button clicked', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText(/Deploy Now/);
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when Cancel button clicked', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/Cancel/);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <DeploymentConfirmationModal
        isOpen={false}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should show warning for high estimated cost', () => {
    const highCostEstimates = { ...mockEstimates, estimated_cost_monthly: 500 };

    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={highCostEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/High monthly cost/i)).toBeInTheDocument();
  });

  it('should show security group details', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Ingress Rules/)).toBeInTheDocument();
    expect(screen.getByText(/Port 22/)).toBeInTheDocument();
    expect(screen.getByText(/Port 443/)).toBeInTheDocument();
  });

  it('should display scaling configuration', () => {
    render(
      <DeploymentConfirmationModal
        isOpen={true}
        config={mockDeploymentConfig}
        estimates={mockEstimates}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Auto Scaling/)).toBeInTheDocument();
    expect(screen.getByText(/Min: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 5/)).toBeInTheDocument();
  });
});
