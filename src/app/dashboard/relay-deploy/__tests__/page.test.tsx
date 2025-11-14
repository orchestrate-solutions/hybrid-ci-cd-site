import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RelayDeployPage from '../page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the hook
vi.mock('../../hooks/useRelayDeploy', () => ({
  useRelayDeploy: () => ({
    currentStep: 1,
    totalSteps: 6,
    formData: {},
    setFormData: vi.fn(),
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    canProceedToNextStep: () => true,
    deploymentStatus: null,
    deploymentProgress: 0,
    startDeployment: vi.fn(),
    cancelDeployment: vi.fn(),
    resetForm: vi.fn(),
  }),
}));

describe('Relay Deploy Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and description', () => {
    render(<RelayDeployPage />);

    expect(screen.getByText(/Relay Auto-Deployment Wizard/)).toBeInTheDocument();
    expect(screen.getByText(/Guided setup for deploying relays/)).toBeInTheDocument();
  });

  it('should render wizard stepper', () => {
    render(<RelayDeployPage />);

    expect(screen.getByText(/Provider/)).toBeInTheDocument();
    expect(screen.getByText(/Infrastructure/)).toBeInTheDocument();
    expect(screen.getByText(/Review/)).toBeInTheDocument();
  });

  it('should render step 1 provider selector initially', () => {
    render(<RelayDeployPage />);

    expect(screen.getByText(/Select Cloud Provider/)).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('Azure')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();
  });

  it('should show Next button to proceed to step 2', () => {
    render(<RelayDeployPage />);

    const nextButton = screen.getByText(/Next/);
    expect(nextButton).toBeInTheDocument();
  });

  it('should disable Next button when form validation fails', () => {
    render(<RelayDeployPage />);

    const nextButton = screen.getByText(/Next/);
    expect(nextButton).toBeDisabled();
  });

  it('should enable Next button when form is valid', async () => {
    const { rerender } = render(<RelayDeployPage />);

    const awsButton = screen.getByText('AWS').closest('button');
    fireEvent.click(awsButton!);

    // Simulate state update
    await waitFor(() => {
      expect(screen.getByText(/Next/)).not.toBeDisabled();
    });
  });

  it('should show Back button except on step 1', async () => {
    const { rerender } = render(<RelayDeployPage />);

    // Step 1 - no back button
    expect(screen.queryByText(/Back/)).not.toBeInTheDocument();
  });

  it('should display progress bar', () => {
    render(<RelayDeployPage />);

    expect(screen.getByTestId('wizard-progress')).toBeInTheDocument();
  });

  it('should show step indicators with completion status', () => {
    render(<RelayDeployPage />);

    const stepIndicators = screen.getAllByTestId(/step-indicator/);
    expect(stepIndicators.length).toBeGreaterThan(0);
  });

  it('should navigate through wizard steps', async () => {
    render(<RelayDeployPage />);

    // Select provider
    const awsButton = screen.getByText('AWS').closest('button');
    fireEvent.click(awsButton!);

    // Click Next to proceed to step 2
    const nextButton = screen.getByText(/Next/);
    fireEvent.click(nextButton);

    // Verify step 2 content appears
    await waitFor(() => {
      expect(screen.getByText(/Select Infrastructure Type/)).toBeInTheDocument();
    });
  });

  it('should handle step backward navigation', async () => {
    const { rerender } = render(<RelayDeployPage />);

    // Go to step 2
    const awsButton = screen.getByText('AWS').closest('button');
    fireEvent.click(awsButton!);

    const nextButton = screen.getByText(/Next/);
    fireEvent.click(nextButton);

    await waitFor(() => {
      const backButton = screen.getByText(/Back/);
      fireEvent.click(backButton);
    });

    expect(screen.getByText(/Select Cloud Provider/)).toBeInTheDocument();
  });

  it('should collect form data across wizard steps', async () => {
    render(<RelayDeployPage />);

    // Step 1: Select provider
    const awsButton = screen.getByText('AWS').closest('button');
    fireEvent.click(awsButton!);

    const nextButton = screen.getByText(/Next/);
    fireEvent.click(nextButton);

    // Step 2: Select infrastructure
    await waitFor(() => {
      const ec2Button = screen.getByText('EC2').closest('button');
      fireEvent.click(ec2Button!);
    });

    fireEvent.click(screen.getByText(/Next/));

    // Form data should be accumulating
    expect(screen.getByTestId('form-data-summary')).toBeInTheDocument();
  });

  it('should show review step before deployment', async () => {
    render(<RelayDeployPage />);

    // Navigate through all steps to review
    for (let i = 0; i < 5; i++) {
      const nextButton = screen.queryByText(/Next/);
      if (nextButton) {
        fireEvent.click(nextButton);
      }
    }

    await waitFor(() => {
      expect(screen.getByText(/Review Configuration/)).toBeInTheDocument();
    });
  });

  it('should show deployment confirmation modal', async () => {
    render(<RelayDeployPage />);

    // Navigate to final step
    for (let i = 0; i < 5; i++) {
      const nextButton = screen.queryByText(/Next/);
      if (nextButton) {
        fireEvent.click(nextButton);
      }
    }

    await waitFor(() => {
      const deployButton = screen.getByText(/Deploy Now/);
      fireEvent.click(deployButton);

      expect(screen.getByText(/Confirm Deployment/)).toBeInTheDocument();
    });
  });

  it('should show deployment progress during deployment', async () => {
    render(<RelayDeployPage />);

    // Complete wizard and start deployment
    await waitFor(() => {
      expect(screen.getByText(/Deployment in progress/)).toBeInTheDocument();
    });
  });

  it('should show deployment status and logs', async () => {
    render(<RelayDeployPage />);

    await waitFor(() => {
      expect(screen.getByText(/Creating resources/)).toBeInTheDocument();
      expect(screen.getByText(/Configuring network/)).toBeInTheDocument();
    });
  });

  it('should show success screen on deployment completion', async () => {
    render(<RelayDeployPage />);

    await waitFor(() => {
      expect(screen.getByText(/Deployment Successful/)).toBeInTheDocument();
      expect(screen.getByText(/Relay is now active/)).toBeInTheDocument();
    });
  });

  it('should allow canceling deployment', async () => {
    render(<RelayDeployPage />);

    await waitFor(() => {
      const cancelButton = screen.getByText(/Cancel Deployment/);
      fireEvent.click(cancelButton);

      expect(screen.getByText(/Deployment cancelled/)).toBeInTheDocument();
    });
  });

  it('should show error state with retry option on failure', async () => {
    render(<RelayDeployPage />);

    // Simulate deployment failure
    await waitFor(() => {
      expect(screen.getByText(/Deployment Failed/)).toBeInTheDocument();
      expect(screen.getByText(/Retry/)).toBeInTheDocument();
    });
  });

  it('should allow restarting wizard after completion', async () => {
    render(<RelayDeployPage />);

    await waitFor(() => {
      const restartButton = screen.getByText(/Deploy Another Relay/);
      fireEvent.click(restartButton);

      expect(screen.getByText(/Select Cloud Provider/)).toBeInTheDocument();
    });
  });

  it('should display resource estimation', async () => {
    render(<RelayDeployPage />);

    // Navigate to step 5 (review)
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.queryByText(/Next/);
      if (nextButton) {
        fireEvent.click(nextButton);
      }
    }

    await waitFor(() => {
      expect(screen.getByText(/Estimated Monthly Cost/)).toBeInTheDocument();
      expect(screen.getByText(/Estimated Deployment Time/)).toBeInTheDocument();
    });
  });

  it('should handle form validation feedback', async () => {
    render(<RelayDeployPage />);

    // Try to proceed without valid data
    const nextButton = screen.getByText(/Next/);
    expect(nextButton).toBeDisabled();

    // Select provider
    const awsButton = screen.getByText('AWS').closest('button');
    fireEvent.click(awsButton!);

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('should show Terraform preview on review step', async () => {
    render(<RelayDeployPage />);

    // Navigate to review step
    for (let i = 0; i < 5; i++) {
      const nextButton = screen.queryByText(/Next/);
      if (nextButton) {
        fireEvent.click(nextButton);
      }
    }

    await waitFor(() => {
      expect(screen.getByText(/Terraform Code/)).toBeInTheDocument();
      expect(screen.getByTestId('terraform-editor')).toBeInTheDocument();
    });
  });

  it('should allow copying Terraform code', async () => {
    render(<RelayDeployPage />);

    await waitFor(() => {
      const copyButton = screen.getByText(/Copy Code/);
      fireEvent.click(copyButton);

      expect(screen.getByText(/Copied to clipboard/)).toBeInTheDocument();
    });
  });
});
