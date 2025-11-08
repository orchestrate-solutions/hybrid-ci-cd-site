/**
 * useMarketplace - Custom hook for marketplace state management
 * Handles filtering, searching, and data fetching
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { marketplaceService } from '@/lib/services/marketplaceService';
import type { ConfigPreview, ConfigCategory, MarketplaceFilters, MarketplaceStats } from '@/lib/types/marketplace';

interface UseMarketplaceState {
  configs: ConfigPreview[];
  loading: boolean;
  error: string | null;
  stats: MarketplaceStats | null;
  categoryCounts: Record<ConfigCategory, number>;
}

interface UseMarketplaceFilters {
  searchQuery: string;
  selectedCategory: ConfigCategory | null;
  selectedTypes: string[];
  sortBy: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality';
}

interface UseMarketplaceReturn extends UseMarketplaceState {
  filters: UseMarketplaceFilters;
  filteredConfigs: ConfigPreview[];
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ConfigCategory | null) => void;
  setSelectedTypes: (types: string[]) => void;
  setSortBy: (sortBy: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality') => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

export function useMarketplace(): UseMarketplaceReturn {
  // Data state
  const [state, setState] = useState<UseMarketplaceState>({
    configs: [],
    loading: true,
    error: null,
    stats: null,
    categoryCounts: {} as any,
  });

  // Filter state
  const [filters, setFilters] = useState<UseMarketplaceFilters>({
    searchQuery: '',
    selectedCategory: null,
    selectedTypes: [],
    sortBy: 'trending',
  });

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [configs, stats, counts] = await Promise.all([
        marketplaceService.getConfigs(),
        marketplaceService.getStats(),
        marketplaceService.getCategoryCounts(),
      ]);

      setState({
        configs,
        stats,
        categoryCounts: counts,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace data';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  // Filter and sort configs
  const filteredConfigs = useMemo(() => {
    let results = state.configs;

    // Apply category filter
    if (filters.selectedCategory) {
      results = results.filter((c) => c.category === filters.selectedCategory);
    }

    // Apply type filter
    if (filters.selectedTypes.length > 0) {
      results = results.filter((c) => filters.selectedTypes.includes(c.type));
    }

    // Apply search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q)) ||
          c.author.name.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const sorted = [...results];
    switch (filters.sortBy) {
      case 'trending':
        return sorted.sort((a, b) => {
          const aScore = a.metrics.downloads + a.metrics.stars * 10;
          const bScore = b.metrics.downloads + b.metrics.stars * 10;
          return bScore - aScore;
        });
      case 'downloads':
        return sorted.sort((a, b) => b.metrics.downloads - a.metrics.downloads);
      case 'stars':
        return sorted.sort((a, b) => b.metrics.stars - a.metrics.stars);
      case 'quality':
        return sorted.sort((a, b) => b.quality_score - a.quality_score);
      case 'recently-updated':
        return sorted; // Would sort by date in real implementation
      default:
        return sorted;
    }
  }, [state.configs, filters]);

  // Filter setters
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSelectedCategory = useCallback((category: ConfigCategory | null) => {
    setFilters((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  const setSelectedTypes = useCallback((types: string[]) => {
    setFilters((prev) => ({ ...prev, selectedTypes: types }));
  }, []);

  const setSortBy = useCallback((sortBy: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality') => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategory: null,
      selectedTypes: [],
      sortBy: 'trending',
    });
  }, []);

  return {
    ...state,
    filters,
    filteredConfigs,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTypes,
    setSortBy,
    clearFilters,
    refreshData,
  };
}
