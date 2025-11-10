# Cypress Component Testing Guide

**Version**: 1.0  
**Updated**: November 10, 2025

## Overview

Cypress Component Testing allows us to test individual components in isolation with a real browser environment, intermediate complexity between Vitest unit tests and full E2E tests. This pattern is ideal for:

- **Field Components** (TextField, SelectField, DateField, etc.)
- **Micro Components** (Badges, Chips, Buttons, Cards)
- **Complex Components** (Tables, Dialogs, Forms with multiple fields)
- **State Management** (Testing component state changes, event handling)
- **Accessibility** (DOM structure, ARIA attributes, keyboard navigation)

**Key Difference from Vitest**:
- ✅ **Real browser environment** - Tests actual DOM rendering, not jsdom
- ✅ **User interactions** - Click, type, keyboard events in real browser
- ✅ **Visual validation** - See exactly what renders
- ✅ **Accessibility testing** - Full DOM tree with ARIA attributes
- ✅ **Plug-and-play ready** - Validates components work standalone before integration

## Directory Structure

```
src/components/
├── fields/
│   ├── TextField/
│   │   ├── TextField.tsx              # Component
│   │   ├── TextField.stories.tsx      # Storybook (visual doc)
│   │   ├── __tests__/
│   │   │   ├── TextField.test.tsx     # Vitest unit tests
│   │   │   └── TextField.cy.tsx       # Cypress component tests ✨ NEW
│   ├── SelectField/
│   │   ├── SelectField.tsx
│   │   ├── SelectField.stories.tsx
│   │   ├── __tests__/
│   │   │   ├── SelectField.test.tsx
│   │   │   └── SelectField.cy.tsx     # Cypress component tests
│   └── CheckboxField/
│       ├── CheckboxField.tsx
│       ├── CheckboxField.stories.tsx
│       └── __tests__/
│           ├── CheckboxField.test.tsx
│           └── CheckboxField.cy.tsx   # Cypress component tests
```

## Test Naming Convention

- `FileName.test.tsx` - **Vitest unit tests** (jsdom, fast, isolated)
- `FileName.cy.tsx` - **Cypress component tests** (real browser, interactive)

Both test suites complement each other:
- Vitest: Logic, edge cases, mocking, error states
- Cypress: User interactions, accessibility, visual rendering, state changes

## Cypress Component Test Pattern

### Basic Template

```typescript
// components/fields/TextField/__tests__/TextField.cy.tsx
import { mount } from 'cypress/react';
import { TextField } from '../TextField';

describe('TextField Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      mount(<TextField label="Email Address" />);
      cy.get('label').should('have.text', 'Email Address');
    });

    it('renders input with data-testid', () => {
      mount(<TextField label="Name" />);
      cy.get('[data-testid="text-field-input"]').should('exist');
    });

    it('renders helper text when provided', () => {
      mount(<TextField label="Password" helperText="Min 8 characters" />);
      cy.get('.MuiFormHelperText-root').should('have.text', 'Min 8 characters');
    });

    it('shows required indicator when required=true', () => {
      mount(<TextField label="Username" required />);
      cy.get('label .MuiFormLabel-asterisk').should('exist');
    });
  });

  describe('User Interactions', () => {
    it('updates value on user input', () => {
      mount(<TextField label="Name" value="" onChange={() => {}} />);
      cy.get('input').type('John Doe');
      cy.get('input').should('have.value', 'John Doe');
    });

    it('focuses and blurs correctly', () => {
      const onFocus = cy.stub();
      const onBlur = cy.stub();
      mount(
        <TextField 
          label="Email" 
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      cy.get('input').focus();
      cy.get('input').blur();
    });

    it('handles disabled state', () => {
      mount(<TextField label="Disabled Field" disabled />);
      cy.get('input').should('be.disabled');
    });
  });

  describe('Error States', () => {
    it('renders error styling when error=true', () => {
      mount(
        <TextField 
          label="Email" 
          error 
          helperText="Invalid email format"
        />
      );
      cy.get('input').should('have.class', 'Mui-error');
      cy.get('.MuiFormHelperText-root').should('have.class', 'Mui-error');
    });
  });

  describe('Accessibility', () => {
    it('has accessible label associated with input', () => {
      mount(<TextField label="Email Address" />);
      cy.get('label').should('have.attr', 'for');
      cy.get('input').should('have.attr', 'id');
    });

    it('has proper aria attributes', () => {
      mount(
        <TextField 
          label="Password" 
          helperText="Enter your password"
          required
        />
      );
      cy.get('input').should('have.attr', 'required');
    });

    it('supports aria-label prop', () => {
      mount(<TextField label="Search" aria-label="Search products" />);
      cy.get('input').should('have.attr', 'aria-label', 'Search products');
    });
  });
});
```

## Testing Patterns

### 1. Component Rendering Tests

```typescript
describe('Rendering', () => {
  it('renders with all props', () => {
    mount(
      <TextField
        label="Full Name"
        placeholder="Enter your name"
        helperText="First and last name"
        required
      />
    );
    cy.get('label').should('have.text', 'Full Name');
    cy.get('input').should('have.attr', 'placeholder', 'Enter your name');
    cy.get('.MuiFormHelperText-root').should('have.text', 'First and last name');
  });

  it('renders with default variant and size', () => {
    mount(<TextField label="Default" />);
    cy.get('.MuiTextField-root').should('exist');
    // Verify default styling
  });
});
```

### 2. User Interaction Tests

```typescript
describe('User Interactions', () => {
  it('types and clears text', () => {
    mount(<TextField label="Search" />);
    cy.get('input').type('search term');
    cy.get('input').should('have.value', 'search term');
    cy.get('input').clear();
    cy.get('input').should('have.value', '');
  });

  it('handles paste events', () => {
    mount(<TextField label="Paste Test" />);
    cy.get('input').invoke('val', 'pasted text').trigger('input');
    cy.get('input').should('have.value', 'pasted text');
  });

  it('handles keyboard shortcuts', () => {
    mount(<TextField label="Ctrl+A Test" />);
    cy.get('input').type('text{selectAll}');
    // Verify selection works
  });
});
```

### 3. State Management Tests

```typescript
describe('State Management', () => {
  it('updates parent state on change', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <>
          <TextField 
            label="Name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div data-testid="display">{value}</div>
        </>
      );
    };

    mount(<TestComponent />);
    cy.get('input').type('John');
    cy.get('[data-testid="display"]').should('have.text', 'John');
  });

  it('handles controlled component updates', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('initial');
      return (
        <>
          <TextField value={value} label="Controlled" />
          <button onClick={() => setValue('updated')}>Update</button>
        </>
      );
    };

    mount(<TestComponent />);
    cy.get('button').click();
    cy.get('input').should('have.value', 'updated');
  });
});
```

### 4. Complex Component Tests (Tables, Dialogs, Forms)

```typescript
describe('JobsTable Component', () => {
  const mockJobs = [
    { id: '1', name: 'Deploy v2.0', status: 'RUNNING' },
    { id: '2', name: 'Rollback v1.9', status: 'COMPLETED' },
  ];

  it('renders table with job rows', () => {
    mount(<JobsTable jobs={mockJobs} />);
    cy.get('table').should('exist');
    cy.get('tbody tr').should('have.length', 2);
  });

  it('handles row selection', () => {
    const onRowClick = cy.stub();
    mount(<JobsTable jobs={mockJobs} onRowClick={onRowClick} />);
    cy.get('tbody tr').first().click();
    cy.wrap(onRowClick).should('have.been.called');
  });

  it('filters jobs by status', () => {
    const TestWrapper = () => {
      const [filter, setFilter] = React.useState('ALL');
      const filtered = filter === 'ALL' 
        ? mockJobs 
        : mockJobs.filter(j => j.status === filter);
      return (
        <>
          <button onClick={() => setFilter('RUNNING')}>Filter Running</button>
          <JobsTable jobs={filtered} />
        </>
      );
    };

    mount(<TestWrapper />);
    cy.get('button').click();
    cy.get('tbody tr').should('have.length', 1);
  });
});
```

### 5. Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('has proper heading hierarchy', () => {
    mount(
      <div>
        <h1>Dashboard</h1>
        <h2>Jobs</h2>
        <JobsTable jobs={mockJobs} />
      </div>
    );
    cy.get('h1').should('exist');
    cy.get('h2').should('exist');
  });

  it('table has accessible headers', () => {
    mount(<JobsTable jobs={mockJobs} />);
    cy.get('thead th').each((header) => {
      cy.wrap(header).should('have.attr', 'scope', 'col');
    });
  });

  it('supports keyboard navigation', () => {
    mount(<TextField label="Search" />);
    cy.get('input').focus();
    cy.focused().should('have.attr', 'data-testid', 'text-field-input');
    cy.get('input').tab();
    // Next focusable element is focused
  });

  it('announces errors to screen readers', () => {
    mount(
      <TextField
        label="Email"
        error
        helperText="Invalid email"
        aria-describedby="email-error"
      />
    );
    cy.get('input').should('have.attr', 'aria-invalid', 'true');
  });
});
```

## Running Cypress Component Tests

### Development Mode (Interactive)

```bash
# Open Cypress Component Test UI
npm run test:component

# Runs on http://localhost:5173
# Shows real-time updates as you edit
```

### Headless Mode (CI/CD)

```bash
# Run all component tests
npm run test:component:run

# Run specific component
npm run test:component:run -- src/components/fields/TextField/__tests__/TextField.cy.tsx

# With coverage
npm run test:component:coverage
```

### Configuration

`cypress.config.ts`:
```typescript
export default defineConfig({
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.tsx',
    supportFile: 'cypress/support/component.ts',
    inlineStyleLanguage: 'styled-components',
  },
});
```

## Best Practices

### ✅ DO

- **Test user interactions** - Type, click, focus, blur, keyboard events
- **Test state changes** - Component updates when props or state change
- **Test accessibility** - Labels, ARIA attributes, keyboard navigation
- **Test error states** - Validation, error messages, disabled states
- **Use real browser** - Don't mock the DOM, mount real components
- **Organize by behavior** - Use nested `describe` blocks
- **Keep tests focused** - One behavior per test
- **Use data-testid** - For reliable element selection

### ❌ DON'T

- **Don't test implementation** - Test behavior, not internals
- **Don't use sleep/wait** - Use proper Cypress waits and retries
- **Don't nest Cypress commands** - Chain them with `.then()`
- **Don't mock too much** - Mock APIs, not DOM interactions
- **Don't make tests brittle** - Avoid hard-coded timeouts, use proper selectors
- **Don't test third-party libraries** - Assume MUI works correctly

## Component Test Examples

### TextField Component

```typescript
// src/components/fields/TextField/__tests__/TextField.cy.tsx
import { mount } from 'cypress/react';
import { TextField } from '../TextField';

describe('TextField', () => {
  it('renders with label', () => {
    mount(<TextField label="Email" />);
    cy.get('label').should('contain', 'Email');
  });

  it('updates value on type', () => {
    mount(<TextField label="Name" />);
    cy.get('input').type('John Doe');
    cy.get('input').should('have.value', 'John Doe');
  });

  it('shows error state', () => {
    mount(<TextField label="Email" error helperText="Invalid" />);
    cy.get('input').should('have.class', 'Mui-error');
  });

  it('is accessible with label', () => {
    mount(<TextField label="Username" />);
    cy.get('label').invoke('attr', 'for').then((id) => {
      cy.get(`input#${id}`).should('exist');
    });
  });
});
```

### SelectField Component

```typescript
// src/components/fields/SelectField/__tests__/SelectField.cy.tsx
import { mount } from 'cypress/react';
import { SelectField } from '../SelectField';

describe('SelectField', () => {
  const options = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  it('renders with options', () => {
    mount(<SelectField label="Status" options={options} />);
    cy.get('[role="button"]').click();
    cy.get('[role="option"]').should('have.length', 3);
  });

  it('selects option on click', () => {
    mount(<SelectField label="Status" options={options} />);
    cy.get('[role="button"]').click();
    cy.get('[role="option"]').contains('Published').click();
    cy.get('[role="button"]').should('contain', 'Published');
  });

  it('updates parent state on selection', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <>
          <SelectField 
            label="Status"
            options={options}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div data-testid="selected">{value}</div>
        </>
      );
    };

    mount(<TestComponent />);
    cy.get('[role="button"]').click();
    cy.get('[role="option"]').contains('Draft').click();
    cy.get('[data-testid="selected"]').should('have.text', 'draft');
  });
});
```

### CheckboxField Component

```typescript
// src/components/fields/CheckboxField/__tests__/CheckboxField.cy.tsx
import { mount } from 'cypress/react';
import { CheckboxField } from '../CheckboxField';

describe('CheckboxField', () => {
  it('renders checkbox with label', () => {
    mount(<CheckboxField label="Agree to terms" />);
    cy.get('input[type="checkbox"]').should('exist');
    cy.get('label').should('contain', 'Agree to terms');
  });

  it('toggles on click', () => {
    mount(<CheckboxField label="Subscribe" />);
    cy.get('input[type="checkbox"]').should('not.be.checked');
    cy.get('label').click();
    cy.get('input[type="checkbox"]').should('be.checked');
    cy.get('label').click();
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('handles controlled state', () => {
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <>
          <CheckboxField 
            label="Enable notifications"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <div data-testid="status">
            {checked ? 'Enabled' : 'Disabled'}
          </div>
        </>
      );
    };

    mount(<TestComponent />);
    cy.get('[data-testid="status"]').should('have.text', 'Disabled');
    cy.get('input[type="checkbox"]').click();
    cy.get('[data-testid="status"]').should('have.text', 'Enabled');
  });

  it('is accessible with keyboard', () => {
    mount(<CheckboxField label="Agree" />);
    cy.get('input[type="checkbox"]').focus();
    cy.get('input[type="checkbox"]').type(' '); // Space to toggle
    cy.get('input[type="checkbox"]').should('be.checked');
  });
});
```

## Integration with Testing Pipeline

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:component": "cypress open --component",
    "test:component:run": "cypress run --component",
    "test:component:watch": "cypress run --component --watch",
    "test:component:coverage": "cypress run --component --coverage",
    "test": "npm run test:unit && npm run test:component:run && npm run test:e2e"
  }
}
```

### CI/CD Integration

`.github/workflows/test.yml`:
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:unit          # Vitest
      - run: npm run test:component:run # Cypress Components
      - run: npm run test:e2e           # Cypress E2E
```

## Troubleshooting

### Issue: Component not rendering
**Solution**: Ensure component imports are correct and any required providers (theme, context) are mounted.

```typescript
// Wrap with providers if needed
mount(
  <ThemeProvider>
    <TextField label="Test" />
  </ThemeProvider>
);
```

### Issue: State not updating
**Solution**: Use `cy.get().type()` instead of direct value assignment. Cypress simulates user actions.

```typescript
// ✅ Good - simulates user typing
cy.get('input').type('text');

// ❌ Bad - doesn't trigger onChange
cy.get('input').invoke('val', 'text');
```

### Issue: Tests timing out
**Solution**: Ensure proper waits and avoid nested commands without `.then()`.

```typescript
// ✅ Good - proper chaining
cy.get('button').click();
cy.get('[data-testid="result"]').should('be.visible');

// ❌ Bad - nested commands
cy.get('button').click().then(() => {
  cy.get('[data-testid="result"]').should('be.visible');
});
```

## Migration Path

**Existing Vitest tests** → Keep for unit logic  
**Add Cypress components** → For user interactions & accessibility  
**Keep Storybook** → For visual documentation  
**Add Cypress E2E** → For full page workflows

Result: **Comprehensive coverage** at every layer.

---

## Summary

| Layer | Tool | Purpose | Speed |
|-------|------|---------|-------|
| Unit | Vitest | Logic, edge cases, mocks | ⚡ Fast |
| Component | Cypress | User interactions, accessibility | ⚡⚡ Medium |
| Page | Cypress E2E | Full workflows, integration | ⚡⚡⚡ Slower |

**Recommended**: All three layers for complete confidence before production.
