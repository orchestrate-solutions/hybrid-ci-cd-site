/**
 * ESLint rule to prevent hardcoded hex colors in sx props
 * Enforces use of theme tokens (color: 'success.main') instead of hardcoded values (#4caf50)
 *
 * Valid:
 * - sx={{ color: 'success.main' }}
 * - sx={{ backgroundColor: theme.palette.error.main }}
 * - sx={{ color: 'text.primary' }}
 * - sx={{ borderColor: 'divider' }}
 *
 * Invalid:
 * - sx={{ color: '#4caf50' }}
 * - sx={{ backgroundColor: '#ff9800' }}
 * - sx={{ borderColor: '#f44336' }}
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent hardcoded hex colors in sx props - use theme tokens instead',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      hardcodedColor:
        'Hardcoded color {{ color }} found in sx prop. Use theme tokens instead: sx={{ {{ property }}: "{{ suggestion }}" }}. Learn more: https://mui.com/material-ui/customization/palette/',
    },
  },

  create(context) {
    const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    const rgbColorRegex = /^rgb(a)?\(/;

    // Map common hardcoded colors to theme tokens
    const colorSuggestions = {
      '#4caf50': 'success.main',
      '#81c784': 'success.light',
      '#2e7d32': 'success.dark',
      '#f44336': 'error.main',
      '#ef5350': 'error.light',
      '#c62828': 'error.dark',
      '#ff9800': 'warning.main',
      '#ffb74d': 'warning.light',
      '#e65100': 'warning.dark',
      '#2196f3': 'info.main',
      '#64b5f6': 'info.light',
      '#1565c0': 'info.dark',
      '#9e9e9e': 'text.disabled',
      '#757575': 'text.secondary',
      '#212121': 'text.primary',
      '#f5f5f5': 'background.paper',
      '#ffffff': 'background.default',
      '#000000': 'text.primary',
    };

    return {
      JSXAttribute(node) {
        // Only check sx props
        if (node.name.name !== 'sx') return;

        // Skip if sx prop is a reference (like sx={theme.spacing(2)})
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;

        const expression = node.value.expression;

        // Handle ObjectExpression (sx={{ color: '#fff' }})
        if (expression.type === 'ObjectExpression') {
          expression.properties.forEach((prop) => {
            if (prop.type === 'Property' && prop.value.type === 'Literal') {
              const value = prop.value.value;
              const propertyName = prop.key.name;

              // Check if it's a color-related property with hardcoded value
              if (
                typeof value === 'string' &&
                (propertyName.includes('color') ||
                  propertyName.includes('Color') ||
                  propertyName === 'bg' ||
                  propertyName === 'backgroundColor' ||
                  propertyName === 'borderColor')
              ) {
                if (hexColorRegex.test(value) || rgbColorRegex.test(value)) {
                  const suggestion = colorSuggestions[value.toLowerCase()] || 'theme.palette.<category>.main';

                  context.report({
                    node: prop.value,
                    messageId: 'hardcodedColor',
                    data: {
                      color: value,
                      property: propertyName,
                      suggestion,
                    },
                  });
                }
              }
            }
          });
        }
      },
    };
  },
};
