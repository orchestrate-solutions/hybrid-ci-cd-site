/**
 * Theme Context for React
 * 
 * Provides theme state management with localStorage persistence.
 * Integrates with CodeUChain for state transformation.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeName, getTheme, DEFAULT_THEME, themeToCSSVariables } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app-theme-preference';
const SYSTEM_PREF_MEDIA = '(prefers-color-scheme: dark)';

/**
 * Get system theme preference
 */
function getSystemThemePreference(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME.name;
  return window.matchMedia(SYSTEM_PREF_MEDIA).matches ? 'dark' : 'light';
}

/**
 * Get theme from localStorage or system preference
 */
function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME.name;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored as ThemeName;
  }

  return getSystemThemePreference();
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeName;
}

/**
 * Theme Provider Component
 * 
 * Wraps app to provide theme context and apply CSS variables.
 * Persists theme preference to localStorage.
 */
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(
    initialTheme || DEFAULT_THEME.name
  );
  const [mounted, setMounted] = useState(false);

  const theme = getTheme(themeName);

  // Hydrate from storage on mount
  useEffect(() => {
    const stored = getInitialTheme();
    setThemeName(stored);
    setMounted(true);
  }, []);

  // Apply CSS variables to document root
  useEffect(() => {
    if (!mounted) return;

    const cssVars = themeToCSSVariables(theme);
    const root = document.documentElement;

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Add theme-aware class for additional styling
    root.classList.remove('light', 'dark', 'solarized-light', 'solarized-dark');
    root.classList.add(themeName);

    if (theme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [theme, themeName, mounted]);

  const handleSetTheme = async (name: ThemeName): Promise<void> => {
    setThemeName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, name);
    }

    // Dispatch custom event for theme change (useful for tracking, analytics)
    window.dispatchEvent(
      new CustomEvent('theme-changed', {
        detail: { theme: name, isDark: getTheme(name).isDark },
      })
    );
  };

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme: handleSetTheme,
    isDark: theme.isDark,
  };

  // Don't render until hydrated to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // During SSR or before hydration, return default theme
    // This prevents hydration mismatches
    const defaultTheme = getTheme(DEFAULT_THEME.name);
    return {
      theme: defaultTheme,
      themeName: DEFAULT_THEME.name,
      setTheme: async () => {}, // No-op during SSR
      isDark: defaultTheme.isDark,
    };
  }
  return context;
}
