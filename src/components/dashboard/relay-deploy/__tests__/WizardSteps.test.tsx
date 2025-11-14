import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardSteps } from '../WizardSteps';
import { InfrastructureSelector } from '../InfrastructureSelector';

describe('WizardSteps Component', () => {
  const mockOnStepChange = vi.fn();
  const mockOnDataChange = vi.fn();

  beforeEach(() => {
    mockOnStepChange.mockClear();
    mockOnDataChange.mockClear();
  });

  it('should render all step indicators', () => {
    render(
      <WizardSteps
        currentStep={1}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={[
          'Provider',
          'Infrastructure',
          'Region',
          'Sizing',
          'Network',
          'Review',
        ]}
      />
    );

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('should highlight current step', () => {
    const { rerender } = render(
      <WizardSteps
        currentStep={1}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={['Provider', 'Infrastructure', 'Region', 'Sizing', 'Network', 'Review']}
      />
    );

    let stepIndicators = screen.getAllByRole('button');
    expect(stepIndicators[0]).toHaveClass('active');

    rerender(
      <WizardSteps
        currentStep={3}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={['Provider', 'Infrastructure', 'Region', 'Sizing', 'Network', 'Review']}
      />
    );

    stepIndicators = screen.getAllByRole('button');
    expect(stepIndicators[2]).toHaveClass('active');
  });

  it('should allow clicking completed steps', () => {
    render(
      <WizardSteps
        currentStep={3}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={['Provider', 'Infrastructure', 'Region', 'Sizing', 'Network', 'Review']}
      />
    );

    const firstStepButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstStepButton);

    expect(mockOnStepChange).toHaveBeenCalledWith(1);
  });

  it('should disable future steps', () => {
    render(
      <WizardSteps
        currentStep={2}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={['Provider', 'Infrastructure', 'Region', 'Sizing', 'Network', 'Review']}
      />
    );

    const stepButtons = screen.getAllByRole('button');
    expect(stepButtons[3]).toBeDisabled();
    expect(stepButtons[4]).toBeDisabled();
    expect(stepButtons[5]).toBeDisabled();
  });

  it('should render step content', () => {
    const stepContent = <div>Step 1 Content</div>;

    render(
      <WizardSteps
        currentStep={1}
        totalSteps={6}
        onStepChange={mockOnStepChange}
        steps={['Provider', 'Infrastructure', 'Region', 'Sizing', 'Network', 'Review']}
        children={stepContent}
      />
    );

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
  });
});

describe('InfrastructureSelector Component', () => {
  const mockOnSelect = vi.fn();
  const infrastructureTypes = [
    {
      id: 'ec2',
      label: 'EC2',
      description: 'Elastic Compute Cloud - Virtual servers',
      icon: '🖥️',
    },
    {
      id: 'lambda',
      label: 'Lambda',
      description: 'Serverless compute',
      icon: '⚡',
    },
    {
      id: 'ecs',
      label: 'ECS',
      description: 'Container orchestration',
      icon: '🐳',
    },
  ];

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render all infrastructure options', () => {
    render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    expect(screen.getByText('EC2')).toBeInTheDocument();
    expect(screen.getByText('Lambda')).toBeInTheDocument();
    expect(screen.getByText('ECS')).toBeInTheDocument();
  });

  it('should display infrastructure descriptions', () => {
    render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    expect(screen.getByText('Elastic Compute Cloud - Virtual servers')).toBeInTheDocument();
    expect(screen.getByText('Serverless compute')).toBeInTheDocument();
  });

  it('should highlight selected infrastructure', () => {
    const { rerender } = render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    let cards = screen.getAllByRole('button');
    expect(cards[0]).not.toHaveClass('selected');

    rerender(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected="ec2"
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    cards = screen.getAllByRole('button');
    expect(cards[0]).toHaveClass('selected');
  });

  it('should call onSelect when option clicked', () => {
    render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
      />
    );

    const ec2Button = screen.getByText('EC2').closest('button');
    fireEvent.click(ec2Button!);

    expect(mockOnSelect).toHaveBeenCalledWith('ec2');
  });

  it('should disable all options when disabled prop is true', () => {
    render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should show loading state', () => {
    render(
      <InfrastructureSelector
        options={infrastructureTypes}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <InfrastructureSelector
        options={[]}
        selected={null}
        onSelect={mockOnSelect}
        disabled={false}
        error="Failed to load infrastructure types"
      />
    );

    expect(screen.getByText('Failed to load infrastructure types')).toBeInTheDocument();
  });
});
