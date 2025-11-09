# Hybrid CI/CD Platform - Federated DevOps Ecosystem

A next-generation CI/CD platform built on **federated architecture**, **configuration-driven integrations**, and **community ownership**. Users build, share, and own their DevOps tool integrations, IaC templates, and custom workflows through a plugin system.

## 🎯 Platform Vision

**"We don't build tools—we connect them. The community builds the future."**

Instead of hardcoding integrations, this platform enables:
- ✅ **Configuration-based tool definitions** (YAML/JSON manifests)
- ✅ **Dynamic tool discovery and registration** (from your GitHub repos)
- ✅ **Community-driven extensibility** (no code changes required)
- ✅ **User ownership** (configs stay in your repo, you control them)
- ✅ **Recognition badges** (build reputation through contributions)
- ✅ **Plugin sandboxing** (explicit permissions, secure execution)
- ✅ **Protocol-based integration** (tool-agnostic, future-proof architecture)

**Read the full vision**: [`PLUGIN_ARCHITECTURE_VISION.md`](docs/architecture/PLUGIN_ARCHITECTURE_VISION.md)

## ✨ Features

### Core Platform
- 📖 **Documentation** - Beautiful dark-mode documentation site
- 🎨 **Component Library** - 280+ unit tests, 313 Storybook stories, production-ready
- ⚡ **Plugin System** - MVP plugin registry with configuration-driven tools
- 🔌 **Tool Registry** - Dynamic discovery, validation, and registration
- 🎯 **Dashboard** - Multi-page monitoring (agents, deployments, incidents, health)
- 🧪 **Comprehensive Testing** - 280 unit + 286 E2E tests (100% pass rate)
- 🚀 **CI/CD Pipeline** - Automated testing, building, and deployment

### Phase 18 Deliverables (In Progress)
- ✅ ESLint v9 migration (fixed configuration)
- ✅ JSON Schema for tool configurations (579 lines)
- ✅ TypeScript plugin types (372 lines)
- ✅ PluginRegistry service (497 lines)
- ✅ 3 example tool configs (GitHub Actions, Jenkins, AWS)
- ✅ GitHub Actions CI/CD pipeline (test-deploy.yml, 338 lines)
- 🔄 Storybook integration (build scripts added to package.json)

## 📦 Architecture

### Federated Model
```
┌─────────────────────────────────────┐
│   USER GITHUB REPOS (Source of Truth) │
│   - .hybrid-cicd/manifest.yaml      │
│   - config/tools/*.json             │
│   - config/schemas/*.json           │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   PLATFORM (Connection Layer)        │
│   - Tool Registry                    │
│   - Config Validation                │
│   - Event Bus                        │
│   - Dashboard                        │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   MARKETPLACE (Discovery)            │
│   - Search & Filter                  │
│   - Install by Reference             │
│   - Metrics & Stats                  │
│   - Community Ratings                │
└─────────────────────────────────────┘
```

**Key principle**: Content lives in user repos; platform indexes and connects.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run data service (provides demo/live data)
npm run data-service
```

Access the platform at [http://localhost:3000](http://localhost:3000)

### Testing
```bash
# Unit tests (280+ tests)
npm run test:unit

# E2E tests (286+ tests)
npm run test:e2e

# Watch mode
npm run test:watch

# Linting
npm run lint
```

### Building
```bash
# Production build
npm run build

# View test coverage
npm run test
```

## 🔌 Plugin System

### Creating a Tool Configuration

1. **Create config file** (`config/tools/cicd/my-tool.json`):
```json
{
  "version": "1.0.0",
  "metadata": {
    "id": "my-tool",
    "name": "My CI/CD Tool",
    "category": "ci-cd",
    "author": { "github": "your-username" }
  },
  "integration": {
    "type": "webhook",
    "webhooks": {
      "endpoint": "/api/webhooks/my-tool"
    }
  },
  "ui": {
    "card": {
      "metrics": [
        { "key": "builds_today", "label": "Builds Today" }
      ]
    }
  }
}
```

2. **Validate against schema**:
```typescript
import { validateConfig } from '@/lib/plugins/types';
const isValid = validateConfig(config);
```

3. **Register in platform**:
```typescript
import { getRegistry } from '@/lib/plugins/registry';
const registry = getRegistry();
const tool = registry.getTool('my-tool');
```

See [`schemas/tool-config.schema.json`](schemas/tool-config.schema.json) for full schema.

## 📊 Current Status

### Completed (Phases 1-17)
- ✅ 280 unit tests (100% pass rate, 2.59s execution)
- ✅ 313 Storybook stories (19 component directories)
- ✅ 286 E2E tests across 5 organized files
- ✅ 280 micro-components with tests
- ✅ 1,038+ documentation files
- ✅ Next.js 16 + TypeScript 5 + Tailwind CSS 4

### In Progress (Phase 18)
- 🔄 Plugin system foundation (tools, schemas, plugins)
- 🔄 Tool marketplace (discovery, search, ratings)
- 🔄 Community features (reputation badges, contribution tracking)

### Success Metrics
- **879 total tests** (280 unit + 313 stories + 286 E2E)
- **13,170 total LOC** (production code + tests + docs)
- **100% pass rate** (0 regressions)
- **0 critical bugs** (in testing infrastructure)

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Testing** | Vitest 1.0 + Cypress 15.5 |
| **Components** | React 19.2 + Radix UI |
| **Documentation** | CodeUChain 1.1.2 + MDX |
| **Build** | Turbopack |
| **CI/CD** | GitHub Actions |

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Homepage
│   ├── docs/[slug]/               # Dynamic doc pages
│   ├── dashboard/                 # Multi-page dashboard
│   │   ├── agents/
│   │   ├── deployments/
│   │   ├── incidents/
│   │   └── health/
│   └── api/
│       └── webhooks/              # Webhook handlers
├── components/
│   ├── micro/                     # UI building blocks (280+ tests)
│   ├── layout/                    # Page layouts
│   ├── dashboard-widgets/         # Dashboard components
│   ├── deployments/               # Feature group
│   └── agents/                    # Feature group
├── lib/
│   ├── plugins/
│   │   ├── registry.ts            # PluginRegistry service
│   │   └── types.ts               # TypeScript interfaces
│   ├── api-client.ts              # Unified API client
│   └── doc-processing.ts          # CodeUChain utilities
└── hooks/                         # Custom React hooks

schemas/
├── tool-config.schema.json        # JSON Schema for tools

config/tools/
├── cicd/
│   ├── github-actions.json        # GitHub Actions integration
│   └── jenkins.json               # Jenkins integration
└── cloud/
    └── aws.json                   # AWS integration

cypress/
├── e2e/                           # End-to-end tests
│   ├── agents.cy.ts
│   ├── health.cy.ts
│   ├── incidents-workflows.cy.ts
│   ├── ui-theme.cy.ts
│   └── marketplace-config.cy.ts
└── support/

.github/workflows/
├── test-deploy.yml                # Main CI/CD pipeline

docs/
├── architecture/                  # Architecture decisions
│   └── PLUGIN_ARCHITECTURE_VISION.md
└── [organized by topic]
```

## 🔄 Data Pipeline

The platform uses a unified data pipeline:

```
Frontend API Calls
       ↓
   /api/dashboard/* routes
       ↓
   Unified API Client (src/lib/api-client.ts)
       ↓
Demo Mode: Mock Data | Live Mode: Backend Services
       ↓
   Dashboard Components (State + Real-time Updates)
```

**Running data service**:
```bash
npm run data-service
# Runs on http://localhost:8000
```

Provides:
- `/api/dashboard/agents` - Agent status
- `/api/dashboard/deployments` - Deployment data
- `/api/dashboard/jobs` - Job execution
- `/api/dashboard/health` - System health

## 📚 Documentation

- **[Plugin Architecture Vision](docs/architecture/PLUGIN_ARCHITECTURE_VISION.md)** - Complete platform vision, design decisions, roadmap
- **[Dashboard Implementation](docs/DASHBOARD_IMPLEMENTATION.md)** - Dashboard architecture and components
- **[Testing Guide](docs/testing/)** - Testing patterns and best practices
- **[Component Inventory](docs/COMPONENT_INVENTORY.md)** - All 280+ components documented

## 🧪 Testing

### Unit Tests (280+)
```bash
npm run test:unit
# Results: 280 passing (2.59s)
# Components tested: MetricCard, DeploymentRow, StatusBadge, etc.
```

### E2E Tests (286+)
```bash
npm run test:e2e
# Tests organized by workflow domain:
# - Agents (39 tests)
# - Health Monitoring (50 tests)
# - Incident Management (40 tests)
# - Workflow Orchestration (32 tests)
# - Marketplace (13 tests)
# - Settings (24 tests)
# - UI/Theme (85 tests)
```

### Storybook Stories (313+)
```bash
npm run storybook
# Browse at http://localhost:6006
# All components documented with multiple stories
```

## 🚀 Deployment

### GitHub Pages (Automatic)
1. Push to `main` branch
2. GitHub Actions workflow triggers automatically
3. Tests run, build succeeds, deploy to GitHub Pages
4. Site available at: `https://[username].github.io/[repo-name]/`

### CI/CD Pipeline (`.github/workflows/test-deploy.yml`)
- **Lint** - ESLint checks
- **Unit Tests** - Vitest runner
- **E2E Tests** - Cypress integration
- **Build** - Next.js production build
- **Storybook** - Component documentation
- **Deploy** - GitHub Pages

## 🤝 Contributing

### Add a Tool Integration

1. Create config in `config/tools/[category]/[tool-name].json`
2. Follow schema in `schemas/tool-config.schema.json`
3. Test locally: `npm run dev`
4. Create PR with description of integration
5. Once merged, tool appears in marketplace automatically

### Reporting Issues

- Use GitHub Issues to report bugs
- Include minimal reproduction (code snippet or test)
- Tag with appropriate label (bug, feature, documentation)

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm run test:unit
npm run test:e2e
npm run lint

# Commit with conventional commits
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

## 📋 Next Steps (Phase 18 Roadmap)

- [ ] **Week 1**: Fix TypeScript configuration (Next.js 15→16 params migration)
- [ ] **Week 2**: Complete Storybook deployment to GitHub Pages
- [ ] **Week 3**: Implement marketplace UI and tool discovery
- [ ] **Week 4**: Add LLM integration examples (OpenAI, Anthropic)

## 🏗️ Long-Term Vision (Phases 19-20)

- **Plugin Marketplace**: 100+ community-built tool integrations
- **Reputation System**: Badges, leaderboards, contributor recognition
- **Advanced Features**: LLM code analysis, auto-remediation, cost optimization
- **Enterprise Support**: Self-hosted deployments, compliance, audit logs
- **Global Community**: 1,000+ registered tools, production-ready patterns

## 📄 License

Apache License 2.0 - See LICENSE file

## 🙋 Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: platform@orchestrate-solutions.dev

---

**Status**: Phase 18 In Progress  
**Last Updated**: November 9, 2025  
**Maintenance Contact**: [@jwink](https://github.com/jwink)
