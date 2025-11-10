import { defineConfig } from 'cypress';
import { loadEnv } from 'vite';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'vite',
      viteConfig: {
        resolve: {
          alias: {
            '@': new URL('./src', import.meta.url).pathname,
          },
        },
      },
    },
    specPattern: ['src/components/fields/**/*.cy.{js,jsx,ts,tsx}'],
    supportFile: 'cypress/support/component.tsx',
    indexHtmlFile: 'cypress/support/component-index.html',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});