import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography, Grid, Paper } from '@mui/material';
import { THEME_REGISTRY, type ThemeName } from './themes';

interface ColorSwatchProps {
  colorName: string;
  colorValue: string;
  isDark?: boolean;
}

/**
 * Color Swatch Component - displays a color with its hex value
 */
function ColorSwatch({ colorName, colorValue, isDark = false }: ColorSwatchProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(colorValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      onClick={handleCopy}
      sx={{
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: colorValue,
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {copied && (
          <Typography
            variant="caption"
            sx={{
              color: isDark ? '#FFF' : '#000',
              fontWeight: 600,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            Copied!
          </Typography>
        )}
      </Box>
      <Box sx={{ p: 1, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' }}>
        <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
          {colorName}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {colorValue}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Theme Color Section - displays a category of colors
 */
function ColorSection({
  title,
  colors,
  isDark,
}: {
  title: string;
  colors: Record<string, string>;
  isDark: boolean;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
          color: isDark ? '#FDF6E3' : '#002B36',
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(colors).map(([name, value]) => (
          <Grid item xs={6} sm={4} md={3} key={name}>
            <ColorSwatch colorName={name} colorValue={value} isDark={isDark} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Full Theme Display - shows all colors for a theme
 */
function ThemeDisplay({ themeName }: { themeName: ThemeName }) {
  const theme = THEME_REGISTRY[themeName];

  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: theme.colors.bg.primary,
        color: theme.colors.text.primary,
        minHeight: '100vh',
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              color: theme.colors.brand.primary,
            }}
          >
            {theme.label}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.colors.text.secondary }}>
            {theme.metadata.description}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.colors.text.tertiary }}>
            v{theme.metadata.version} • {theme.isDark ? 'Dark mode' : 'Light mode'}
          </Typography>
        </Box>

        {/* Backgrounds */}
        <ColorSection
          title="Backgrounds"
          colors={theme.colors.bg}
          isDark={theme.isDark}
        />

        {/* Text Colors */}
        <ColorSection
          title="Text Colors"
          colors={theme.colors.text}
          isDark={theme.isDark}
        />

        {/* Semantic Colors */}
        <ColorSection
          title="Semantic Colors"
          colors={theme.colors.semantic}
          isDark={theme.isDark}
        />

        {/* Brand Colors */}
        <ColorSection
          title="Brand Colors"
          colors={theme.colors.brand}
          isDark={theme.isDark}
        />

        {/* UI Elements */}
        <ColorSection
          title="UI Elements"
          colors={theme.colors.ui}
          isDark={theme.isDark}
        />
      </Box>
    </Box>
  );
}

// Storybook Meta
const meta = {
  title: 'Design System/Theme Colors',
  component: ThemeDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete color palette for all 4 themes. Click any color swatch to copy its hex value.',
      },
    },
  },
} satisfies Meta<typeof ThemeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Light Theme
export const LightTheme: Story = {
  args: {
    themeName: 'light',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

// Dark Theme
export const DarkTheme: Story = {
  args: {
    themeName: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Solarized Light Theme
export const SolarizedLight: Story = {
  args: {
    themeName: 'solarized-light',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

// Solarized Dark Theme
export const SolarizedDark: Story = {
  args: {
    themeName: 'solarized-dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/**
 * Color Comparison - All 4 themes side-by-side
 */
export const ColorComparison: Story = {
  render: () => (
    <Stack spacing={4}>
      {Object.entries(THEME_REGISTRY).map(([key, theme]) => (
        <Paper
          key={key}
          sx={{
            p: 3,
            backgroundColor: theme.colors.bg.primary,
            color: theme.colors.text.primary,
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            {theme.label}
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(theme.colors.semantic).map(([name, value]) => (
              <Grid item xs={6} sm={3} key={name}>
                <ColorSwatch colorName={name} colorValue={value} isDark={theme.isDark} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Stack>
  ),
};

/**
 * Brand Colors - Focus on brand identity
 */
export const BrandColors: Story = {
  render: () => (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
        Brand Colors Across All Themes
      </Typography>
      <Grid container spacing={4}>
        {Object.entries(THEME_REGISTRY).map(([key, theme]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: theme.colors.bg.secondary,
                color: theme.colors.text.primary,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {theme.label}
              </Typography>
              <Stack spacing={1.5}>
                {Object.entries(theme.colors.brand).map(([name, value]) => (
                  <Box key={name}>
                    <Box
                      sx={{
                        height: '40px',
                        backgroundColor: value,
                        borderRadius: '4px',
                        mb: 0.5,
                      }}
                    />
                    <Typography variant="caption">
                      {name}: <code>{value}</code>
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  ),
};

/**
 * Semantic Colors - Status and feedback
 */
export const SemanticColors: Story = {
  render: () => (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
        Semantic Colors - Success, Warning, Error, Info
      </Typography>
      <Grid container spacing={3}>
        {Object.entries(THEME_REGISTRY).map(([key, theme]) => (
          <Grid item xs={12} key={key}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: theme.colors.bg.secondary,
                color: theme.colors.text.primary,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {theme.label}
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(theme.colors.semantic).map(([name, value]) => (
                  <Grid item xs={6} sm={3} key={name}>
                    <Box>
                      <Box
                        sx={{
                          height: '60px',
                          backgroundColor: value,
                          borderRadius: '8px',
                          mb: 1,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {name}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  ),
};
