import type { Preview } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '@/lib/themes/ThemeProvider';
import { MuiThemeProvider } from '@/components/MuiThemeProvider';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ThemeProvider initialTheme="dark">
        <MuiThemeProvider>
          <Story />
        </MuiThemeProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
