/**
 * useUserPreferences Hook
 * 
 * Manages user preferences (real-time mode, theme, etc.)
 * Stored in localStorage (MVP) - can upgrade to database in v2
 */

import { useState, useEffect, useCallback } from 'react';

export type RealTimeMode = 'off' | 'efficient' | 'live';

export interface UserPreferences {
  realTimeMode: RealTimeMode;
  theme: 'light' | 'dark' | 'auto';
  demoMode: boolean; // Show mock data instead of calling backend
}

const STORAGE_KEY = 'hybrid-prefs';

const DEFAULT_PREFERENCES: UserPreferences = {
  realTimeMode: 'efficient',
  theme: 'auto',
  demoMode: false,
};

/**
 * Parse stored preferences, with fallback to defaults
 */
function parsePreferences(stored: string | null): UserPreferences {
  if (!stored) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(stored);
    return {
      realTimeMode: (['off', 'efficient', 'live'].includes(parsed.realTimeMode)
        ? parsed.realTimeMode
        : DEFAULT_PREFERENCES.realTimeMode) as RealTimeMode,
      theme: (['light', 'dark', 'auto'].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_PREFERENCES.theme) as 'light' | 'dark' | 'auto',
      demoMode: typeof parsed.demoMode === 'boolean' ? parsed.demoMode : DEFAULT_PREFERENCES.demoMode,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Hook to read and update user preferences
 * Returns [preferences, updatePreferences]
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = parsePreferences(stored);
      setPreferences(parsed);
      setIsHydrated(true);
    }
  }, []);

  // Update preferences and persist
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  return {
    preferences,
    updatePreferences,
    isHydrated,
  };
}
