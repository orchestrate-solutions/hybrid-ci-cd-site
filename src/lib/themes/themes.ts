/**
 * Theme System for Hybrid CI/CD Platform
 * 
 * Supports 4 built-in themes with extensibility for custom themes.
 * All themes are themeable for future customization.
 */

export type ThemeName = 'light' | 'dark' | 'solarized-light' | 'solarized-dark';

export interface ThemeColors {
  // Backgrounds
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  // Text
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Brand
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  // UI elements
  ui: {
    border: string;
    divider: string;
    shadow: string;
    focus: string;
  };
}

export interface Theme {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
  isDark: boolean;
  metadata: {
    author: string;
    version: string;
    description: string;
  };
}

// Light Theme
export const lightTheme = Object.freeze({
  name: 'light',
  label: 'Light',
  isDark: false,
  metadata: {
    author: 'orchestrate-solutions',
    version: '1.0.0',
    description: 'Clean, bright light theme for daytime use',
  },
  colors: Object.freeze({
    bg: Object.freeze({
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#EEEEEE',
      overlay: 'rgba(0, 0, 0, 0.1)',
    }),
    text: Object.freeze({
      primary: '#212121',
      secondary: '#757575',
      tertiary: '#BDBDBD',
      inverse: '#FFFFFF',
    }),
    semantic: Object.freeze({
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      info: '#2196F3',
    }),
    brand: Object.freeze({
      primary: '#1976D2',
      secondary: '#00897B',
      accent: '#FF6F00',
    }),
    ui: Object.freeze({
      border: '#E0E0E0',
      divider: '#BDBDBD',
      shadow: 'rgba(0, 0, 0, 0.12)',
      focus: '#1976D2',
    }),
  }),
} as const satisfies Theme);

// Dark Theme
export const darkTheme = Object.freeze({
  name: 'dark',
  label: 'Dark',
  isDark: true,
  metadata: {
    author: 'orchestrate-solutions',
    version: '1.0.0',
    description: 'Dark theme for reduced eye strain in low-light environments',
  },
  colors: Object.freeze({
    bg: Object.freeze({
      primary: '#121212',
      secondary: '#1E1E1E',
      tertiary: '#2C2C2C',
      overlay: 'rgba(255, 255, 255, 0.1)',
    }),
    text: Object.freeze({
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      tertiary: '#808080',
      inverse: '#121212',
    }),
    semantic: Object.freeze({
      success: '#66BB6A',
      warning: '#FFA726',
      error: '#EF5350',
      info: '#42A5F5',
    }),
    brand: Object.freeze({
      primary: '#42A5F5',
      secondary: '#26C6DA',
      accent: '#FFB74D',
    }),
    ui: Object.freeze({
      border: '#404040',
      divider: '#616161',
      shadow: 'rgba(0, 0, 0, 0.5)',
      focus: '#42A5F5',
    }),
  }),
} as const satisfies Theme);

// Solarized Light Theme
export const solarizedLightTheme = Object.freeze({
  name: 'solarized-light',
  label: 'Solarized Light',
  isDark: false,
  metadata: {
    author: 'orchestrate-solutions',
    version: '1.0.0',
    description: 'Precision colors for machines and people (light variant)',
  },
  colors: Object.freeze({
    bg: Object.freeze({
      primary: '#FDF6E3',
      secondary: '#EEE8D5',
      tertiary: '#D6D0C4',
      overlay: 'rgba(0, 43, 54, 0.1)',
    }),
    text: Object.freeze({
      primary: '#002B36',
      secondary: '#586E75',
      tertiary: '#93A1A1',
      inverse: '#FDF6E3',
    }),
    semantic: Object.freeze({
      success: '#859900',
      warning: '#B58900',
      error: '#DC322F',
      info: '#268BD2',
    }),
    brand: Object.freeze({
      primary: '#268BD2',
      secondary: '#2AA198',
      accent: '#D33682',
    }),
    ui: Object.freeze({
      border: '#D6D0C4',
      divider: '#93A1A1',
      shadow: 'rgba(0, 43, 54, 0.12)',
      focus: '#268BD2',
    }),
  }),
} as const satisfies Theme);

// Solarized Dark Theme
export const solarizedDarkTheme = Object.freeze({
  name: 'solarized-dark',
  label: 'Solarized Dark',
  isDark: true,
  metadata: {
    author: 'orchestrate-solutions',
    version: '1.0.0',
    description: 'Precision colors for machines and people (dark variant)',
  },
  colors: Object.freeze({
    bg: Object.freeze({
      primary: '#002B36',
      secondary: '#073642',
      tertiary: '#586E75',
      overlay: 'rgba(253, 246, 227, 0.1)',
    }),
    text: Object.freeze({
      primary: '#FDF6E3',
      secondary: '#93A1A1',
      tertiary: '#586E75',
      inverse: '#002B36',
    }),
    semantic: Object.freeze({
      success: '#859900',
      warning: '#B58900',
      error: '#DC322F',
      info: '#268BD2',
    }),
    brand: Object.freeze({
      primary: '#268BD2',
      secondary: '#2AA198',
      accent: '#D33682',
    }),
    ui: Object.freeze({
      border: '#073642',
      divider: '#586E75',
      shadow: 'rgba(0, 0, 0, 0.5)',
      focus: '#268BD2',
    }),
  }),
} as const satisfies Theme);

// Theme registry (frozen to prevent modification)
export const THEME_REGISTRY = Object.freeze({
  light: lightTheme,
  dark: darkTheme,
  'solarized-light': solarizedLightTheme,
  'solarized-dark': solarizedDarkTheme,
}) as const satisfies Record<ThemeName, Theme>;

export const DEFAULT_THEME = lightTheme;

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return THEME_REGISTRY[name] || DEFAULT_THEME;
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEME_REGISTRY);
}

/**
 * Convert theme colors to CSS variables
 */
export function themeToCSSVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};

  // Backgrounds
  variables['--bg-primary'] = theme.colors.bg.primary;
  variables['--bg-secondary'] = theme.colors.bg.secondary;
  variables['--bg-tertiary'] = theme.colors.bg.tertiary;
  variables['--bg-overlay'] = theme.colors.bg.overlay;

  // Text
  variables['--text-primary'] = theme.colors.text.primary;
  variables['--text-secondary'] = theme.colors.text.secondary;
  variables['--text-tertiary'] = theme.colors.text.tertiary;
  variables['--text-inverse'] = theme.colors.text.inverse;

  // Semantic
  variables['--semantic-success'] = theme.colors.semantic.success;
  variables['--semantic-warning'] = theme.colors.semantic.warning;
  variables['--semantic-error'] = theme.colors.semantic.error;
  variables['--semantic-info'] = theme.colors.semantic.info;

  // Brand
  variables['--brand-primary'] = theme.colors.brand.primary;
  variables['--brand-secondary'] = theme.colors.brand.secondary;
  variables['--brand-accent'] = theme.colors.brand.accent;

  // UI
  variables['--ui-border'] = theme.colors.ui.border;
  variables['--ui-divider'] = theme.colors.ui.divider;
  variables['--ui-shadow'] = theme.colors.ui.shadow;
  variables['--ui-focus'] = theme.colors.ui.focus;

  return variables;
}
