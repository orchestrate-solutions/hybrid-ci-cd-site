/**
 * ThemeSwitcher Component
 *
 * A button that cycles through available themes using the custom theme system.
 * Integrates with ThemeProvider to switch between light/dark/solarized themes.
 */

'use client';

import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import { Brightness4, Brightness7, WbSunny, NightsStay } from '@mui/icons-material';
import { useTheme } from '@/lib/themes/ThemeProvider';
import { getAllThemes, ThemeName } from '@/lib/themes/themes';

interface ThemeSwitcherProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

/**
 * ThemeSwitcher Component
 *
 * Cycles through available themes: light → dark → solarized-light → solarized-dark → light
 */
export function ThemeSwitcher({
  size = 'medium',
  showTooltip = true,
  className
}: ThemeSwitcherProps) {
  // Prevent SSR issues by not rendering until client-side
  if (typeof window === 'undefined') {
    return null;
  }

  const { themeName, setTheme, isDark } = useTheme();
  const muiTheme = useMuiTheme();

  // Get all available themes for cycling
  const allThemes = getAllThemes();
  const currentIndex = allThemes.findIndex(t => t.name === themeName);

  // Cycle to next theme
  const handleThemeToggle = async () => {
    const nextIndex = (currentIndex + 1) % allThemes.length;
    const nextTheme = allThemes[nextIndex];
    await setTheme(nextTheme.name);
  };

  // Get appropriate icon based on current theme
  const getThemeIcon = () => {
    switch (themeName) {
      case 'light':
        return <Brightness7 fontSize={size} />;
      case 'dark':
        return <Brightness4 fontSize={size} />;
      case 'solarized-light':
        return <WbSunny fontSize={size} />;
      case 'solarized-dark':
        return <NightsStay fontSize={size} />;
      default:
        return <Brightness4 fontSize={size} />;
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    const nextIndex = (currentIndex + 1) % allThemes.length;
    const nextTheme = allThemes[nextIndex];
    return `Switch to ${nextTheme.label} theme`;
  };

  const button = (
    <IconButton
      onClick={handleThemeToggle}
      size={size}
      className={className}
      sx={{
        color: 'text.primary',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        transition: muiTheme.transitions.create(['background-color', 'color'], {
          duration: muiTheme.transitions.duration.shortest,
        }),
      }}
      aria-label={`Switch theme (current: ${themeName})`}
    >
      {getThemeIcon()}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={getTooltipText()} arrow placement="bottom">
        {button}
      </Tooltip>
    );
  }

  return button;
}