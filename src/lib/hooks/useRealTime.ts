/**
 * useRealTime Hook
 * 
 * Manages real-time polling based on user preferences
 * Supports three modes: 'live' (fast), 'efficient' (moderate), 'off' (manual)
 */

import { useEffect, useRef } from 'react';
import { useUserPreferences } from './useUserPreferences';

interface UseRealTimeOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  manualInterval?: number; // Override interval for testing
}

/**
 * Calculate effective polling interval based on mode
 */
function getInterval(mode: 'off' | 'efficient' | 'live', override?: number): number | null {
  if (override) return override;
  
  switch (mode) {
    case 'off':
      return null; // No polling
    case 'efficient':
      return 30000; // 30 seconds
    case 'live':
      return 10000; // 10 seconds
    default:
      return null;
  }
}

/**
 * Hook to set up polling with user preference control
 * 
 * Usage:
 * ```tsx
 * const { refreshing, lastRefresh } = useRealTime({
 *   onRefresh: async () => {
 *     const data = await jobsApi.list();
 *     setJobs(data);
 *   },
 * });
 * ```
 */
export function useRealTime(options: UseRealTimeOptions) {
  const { onRefresh, enabled = true, manualInterval } = options;
  const { preferences } = useUserPreferences();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Get effective interval
    const interval = getInterval(preferences.realTimeMode, manualInterval);

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If no interval, don't set up polling
    if (!interval) return;

    // Set up polling
    timerRef.current = setInterval(async () => {
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          await onRefresh();
        } catch (error) {
          console.error('Real-time refresh failed:', error);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [preferences.realTimeMode, enabled, onRefresh, manualInterval]);

  return {
    mode: preferences.realTimeMode,
    isEnabled: enabled && getInterval(preferences.realTimeMode, manualInterval) !== null,
  };
}
