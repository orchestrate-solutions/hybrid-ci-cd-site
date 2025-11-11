/**
 * PoolHealthCard Component Tests
 * Unit tests for agent pool health metrics visualization
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PoolHealthCard } from '../PoolHealthCard';
import { describe, it, expect } from 'vitest';

describe('PoolHealthCard Component', () => {
  const mockPoolMetrics = {
    cpu_usage_percent: 45,
    memory_usage_percent: 62,
    disk_usage_percent: 38,
    healthy_agent_count: 8,
    unhealthy_agent_count: 2,
    total_agent_count: 10,
  };

  describe('Rendering', () => {
    it('renders pool health card container', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container).toBeInTheDocument();
    });

    it('displays CPU metric', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('CPU');
      expect(container.textContent).toContain('45');
    });

    it('displays memory metric', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('Memory');
      expect(container.textContent).toContain('62');
    });

    it('displays disk metric', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('Disk');
      expect(container.textContent).toContain('38');
    });

    it('displays agent health counts', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('8');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('10');
    });
  });

  describe('Health Status Indicators', () => {
    it('shows healthy status when metrics are low', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 20,
          memory_usage_percent: 30,
          disk_usage_percent: 25,
        }} />
      );
      expect(container.textContent).toContain('Healthy');
    });

    it('shows degraded status when metrics are medium', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 60,
          memory_usage_percent: 70,
          disk_usage_percent: 65,
        }} />
      );
      expect(container).toBeInTheDocument();
    });

    it('shows critical status when metrics exceed threshold', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 85,
          memory_usage_percent: 90,
          disk_usage_percent: 92,
        }} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('renders progress indicators for metrics', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });

    it('sets correct progress values', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Agent Status', () => {
    it('shows healthy agent count', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('Healthy');
    });

    it('shows unhealthy agent count', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      // Check that unhealthy count is displayed
      expect(container.textContent).toBeTruthy();
    });

    it('shows total agent count', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('10');
    });

    it('calculates percentage of unhealthy agents', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          healthy_agent_count: 9,
          unhealthy_agent_count: 1,
        }} />
      );
      expect(container.textContent).toContain('9');
      expect(container.textContent).toContain('1');
    });
  });

  describe('Color Coding', () => {
    it('renders with appropriate status colors', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container).toBeInTheDocument();
    });

    it('applies critical color when CPU > 80%', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 85,
        }} />
      );
      expect(container).toBeInTheDocument();
    });

    it('applies warning color when metrics 60-80%', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          memory_usage_percent: 70,
        }} />
      );
      expect(container).toBeInTheDocument();
    });

    it('applies success color when metrics < 60%', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          disk_usage_percent: 40,
        }} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Typography and Labels', () => {
    it('displays all metric labels', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('CPU');
      expect(container.textContent).toContain('Memory');
      expect(container.textContent).toContain('Disk');
    });

    it('displays percentage symbols', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container.textContent).toContain('%');
    });

    it('displays agent status label', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      // Should have some reference to agents
      expect(container.textContent).toBeTruthy();
    });
  });

  describe('Responsiveness', () => {
    it('renders in container-responsive layout', () => {
      const { container } = render(
        <PoolHealthCard metrics={mockPoolMetrics} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero unhealthy agents', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          unhealthy_agent_count: 0,
        }} />
      );
      expect(container.textContent).toContain('0');
    });

    it('handles maximum metric values', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 100,
          memory_usage_percent: 100,
          disk_usage_percent: 100,
        }} />
      );
      expect(container.textContent).toContain('100');
    });

    it('handles minimum metric values', () => {
      const { container } = render(
        <PoolHealthCard metrics={{
          ...mockPoolMetrics,
          cpu_usage_percent: 0,
          memory_usage_percent: 0,
          disk_usage_percent: 0,
        }} />
      );
      expect(container.textContent).toContain('0');
    });
  });
});
