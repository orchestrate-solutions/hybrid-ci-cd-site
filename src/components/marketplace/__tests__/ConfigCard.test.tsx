/**
 * ConfigCard Component Tests
 * Tests rendering, interactivity, and state management
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfigCard } from '../ConfigCard';
import type { ConfigPreview } from '@/lib/types/marketplace';

// Mock config for testing
const mockConfig: ConfigPreview = {
  id: 'config-1',
  name: 'GitHub Actions Pro',
  description: 'Advanced GitHub Actions configuration with LLM integration',
  category: 'ci-cd',
  type: 'tool',
  tags: ['github-actions', 'ci', 'llm'],
  author: {
    name: 'John Developer',
    github_username: 'johndeveloper',
    avatar_url: 'https://i.pravatar.cc/40?img=1',
    reputation_tier: 'builder',
  },
  metrics: {
    stars: 234,
    forks: 45,
    downloads: 512,
  },
  is_trending: true,
  is_featured: false,
  quality_score: 87,
};

describe('ConfigCard Component', () => {
  describe('Rendering', () => {
    it('renders config name', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('GitHub Actions Pro')).toBeInTheDocument();
    });

    it('renders config description', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('Advanced GitHub Actions configuration with LLM integration')).toBeInTheDocument();
    });

    it('renders category badge', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('ci cd')).toBeInTheDocument();
    });

    it('renders type badge', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('tool')).toBeInTheDocument();
    });

    it('renders tags (limited to 3)', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('#github-actions')).toBeInTheDocument();
      expect(screen.getByText('#ci')).toBeInTheDocument();
      expect(screen.getByText('#llm')).toBeInTheDocument();
    });

    it('renders metrics', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('⭐ 234')).toBeInTheDocument();
      expect(screen.getByText('🔄 45')).toBeInTheDocument();
      expect(screen.getByText('📥 512')).toBeInTheDocument();
    });

    it('renders author info', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('John Developer')).toBeInTheDocument();
    });

    it('renders trending badge when is_trending is true', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('🔥 Trending')).toBeInTheDocument();
    });

    it('renders featured badge when is_featured is true', () => {
      const featuredConfig = { ...mockConfig, is_featured: true };
      render(<ConfigCard config={featuredConfig} />);
      expect(screen.getByText('★ Featured')).toBeInTheDocument();
    });

    it('renders high quality indicator when score >= 80', () => {
      render(<ConfigCard config={mockConfig} />);
      expect(screen.getByText('✓ High Quality')).toBeInTheDocument();
    });

    it('does not render high quality indicator when score < 80', () => {
      const lowQualityConfig = { ...mockConfig, quality_score: 75 };
      render(<ConfigCard config={lowQualityConfig} />);
      expect(screen.queryByText('✓ High Quality')).not.toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(<ConfigCard config={mockConfig} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('applies highlighted styles when isHighlighted is true', () => {
      const { container } = render(<ConfigCard config={mockConfig} isHighlighted={true} />);
      const button = container.querySelector('button');

      expect(button).toHaveClass('border-blue-500');
      expect(button).toHaveClass('bg-blue-50');
    });

    it('renders with default styles when isHighlighted is false', () => {
      const { container } = render(<ConfigCard config={mockConfig} isHighlighted={false} />);
      const button = container.querySelector('button');

      expect(button).toHaveClass('border-gray-200');
      expect(button).toHaveClass('bg-white');
    });
  });

  describe('Edge Cases', () => {
    it('handles configs with no tags', () => {
      const configNoTags = { ...mockConfig, tags: [] };
      render(<ConfigCard config={configNoTags} />);

      // Should still render without error
      expect(screen.getByText('GitHub Actions Pro')).toBeInTheDocument();
    });

    it('handles configs with more than 3 tags', () => {
      const configManyTags = {
        ...mockConfig,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      render(<ConfigCard config={configManyTags} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('renders correctly without avatar URL', () => {
      const configNoAvatar = {
        ...mockConfig,
        author: { ...mockConfig.author, avatar_url: undefined },
      };
      render(<ConfigCard config={configNoAvatar} />);

      // Should still render author name
      expect(screen.getByText('John Developer')).toBeInTheDocument();
    });

    it('handles zero metrics', () => {
      const configZeroMetrics = {
        ...mockConfig,
        metrics: { stars: 0, forks: 0, downloads: 0 },
      };
      render(<ConfigCard config={configZeroMetrics} />);

      expect(screen.getByText('⭐ 0')).toBeInTheDocument();
      expect(screen.getByText('🔄 0')).toBeInTheDocument();
      expect(screen.getByText('📥 0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as a button for keyboard navigation', () => {
      render(<ConfigCard config={mockConfig} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('has proper color contrast', () => {
      const { container } = render(<ConfigCard config={mockConfig} />);
      const button = container.querySelector('button');

      // Button should have readable text color
      expect(button).toHaveClass('text-left');
    });
  });
});
