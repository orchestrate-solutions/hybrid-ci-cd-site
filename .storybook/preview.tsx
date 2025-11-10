import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-primary text-text-primary min-h-screen">
        <Story />
      </div>
    ),
  ],
};

export default preview;
