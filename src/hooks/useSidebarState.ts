/**
 * useSidebarState Hook
 * Manages sidebar visibility and state
 */

import { useState, useCallback } from 'react';

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const close = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  return {
    isCollapsed,
    isLoading,
    setIsLoading,
    toggleCollapsed,
    open,
    close,
  };
}
