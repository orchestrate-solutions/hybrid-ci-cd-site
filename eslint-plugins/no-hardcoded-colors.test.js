/**
 * Tests for no-hardcoded-colors ESLint rule
 * Verifies that hardcoded hex colors are caught and theme tokens are suggested
 */

const rule = require('./no-hardcoded-colors');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('no-hardcoded-colors', rule, {
  valid: [
    // Theme tokens are valid
    {
      code: "<Box sx={{ color: 'success.main' }} />",
    },
    {
      code: "<Box sx={{ backgroundColor: 'error.light' }} />",
    },
    {
      code: "<Box sx={{ borderColor: 'text.disabled' }} />",
    },
    {
      code: "<Box sx={{ color: 'info.main', backgroundColor: 'background.paper' }} />",
    },
    // References to theme are valid (not literal strings)
    {
      code: "<Box sx={{ color: theme.palette.success.main }} />",
    },
    {
      code: "<Box sx={{ backgroundColor: palette.error.light }} />",
    },
    // Other properties are not checked
    {
      code: "<Box border='2px solid #ccc' />",
    },
    // Non-color sx props
    {
      code: "<Box sx={{ padding: '16px', margin: '8px' }} />",
    },
  ],

  invalid: [
    // Hardcoded hex colors should error
    {
      code: "<Box sx={{ color: '#4caf50' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
          data: {
            color: '#4caf50',
            property: 'color',
            suggestion: 'success.main',
          },
        },
      ],
    },
    {
      code: "<Box sx={{ backgroundColor: '#f44336' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
          data: {
            color: '#f44336',
            property: 'backgroundColor',
            suggestion: 'error.main',
          },
        },
      ],
    },
    {
      code: "<Box sx={{ borderColor: '#9e9e9e' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
          data: {
            color: '#9e9e9e',
            property: 'borderColor',
            suggestion: 'text.disabled',
          },
        },
      ],
    },
    // Multiple hardcoded colors
    {
      code: "<Box sx={{ color: '#fff', backgroundColor: '#000' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
          data: {
            color: '#fff',
            property: 'color',
            suggestion: 'background.default',
          },
        },
        {
          messageId: 'hardcodedColor',
          data: {
            color: '#000',
            property: 'backgroundColor',
            suggestion: 'text.primary',
          },
        },
      ],
    },
    // RGB colors should error
    {
      code: "<Box sx={{ color: 'rgb(255, 0, 0)' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
        },
      ],
    },
    // RGBA colors should error
    {
      code: "<Box sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }} />",
      errors: [
        {
          messageId: 'hardcodedColor',
        },
      ],
    },
  ],
});

console.log('✓ All ESLint rule tests passed!');
