# Config Marketplace Implementation

## Overview

The Config Marketplace is a community-driven discovery platform for DevOps configurations, built with Next.js 16, TypeScript, and CodeUChain patterns. Users can browse, search, filter, and install configurations organized by category and type.

## Architecture

### Key Components

#### 1. **Types** (`src/lib/types/marketplace.ts`)
- `ConfigRecord` - Complete config metadata + GitHub metrics
- `ConfigPreview` - Lightweight version for marketplace display
- `MarketplaceFilters` - Search/filter parameters
- `ConfigCategory` - 16 tool categories from DEVOPS taxonomy
- Reputation types: `ReputationTier`, `Badge`, `ContributionType`

#### 2. **CodeUChain Pipeline** (`src/lib/chains/configDiscoveryChain.ts`)
Uses immutable context pattern for deterministic data transformation:

```
Raw Config (YAML) 
  ↓ ParseConfigLink (YAML → JSON)
  ↓ ValidateConfigLink (Schema validation)
  ↓ EnrichMetricsLink (Add GitHub metrics)
  ↓ BuildRecordLink (Create ConfigRecord)
  ↓ CreatePreviewLink (Marketplace preview)
```

**Benefits:**
- Immutable context ensures deterministic transformations
- Each link has single responsibility (parse, validate, enrich, build, preview)
- Error handling at each step with clear messages
- Reusable for batch processing

#### 3. **Data Service** (`src/lib/services/marketplaceService.ts`)
- `MarketplaceService` - Singleton managing config discovery, caching, filtering
- Implements demo data with realistic 16+ configs
- Methods:
  - `getConfigs(filters?)` - Get all or filtered configs
  - `searchConfigs(query)` - Full-text search
  - `getTrending()` - Trending configs
  - `getFeatured()` - Featured configs
  - `getCategoryCounts()` - Category distribution
  - `getStats()` - Marketplace statistics

#### 4. **Micro-Components** (`src/components/marketplace/`)
Single-responsibility, heavily-tested UI blocks:

- **ConfigCard** - Display single config with metrics, author, quality score
- **SearchInput** - Search field with clear button
- **CategoryButton** - Toggle category filter
- **SortDropdown** - Sort options (trending, downloads, quality, etc.)
- **ConfigTypeFilter** - Type selection (tool, schema, iac, llm, automation)
- **QualityBadge** - Color-coded quality indicator
- **StatCard** - Display marketplace statistics
- **EmptyState** - Show when no configs found
- **LoadingCard** - Skeleton loader

#### 5. **Page Component** (`src/app/dashboard/marketplace/page.tsx`)
- Full-featured marketplace UI
- Real-time filtering and searching
- Category browsing with counts
- Sorting options
- Statistics display
- Responsive grid layout

#### 6. **Custom Hook** (`src/hooks/useMarketplace.ts`)
Reusable state management:
```typescript
const {
  configs,        // All configs
  filteredConfigs, // After filters applied
  filters,        // Current filter state
  loading,        // Loading state
  error,          // Error state
  stats,          // Marketplace statistics
  setSearchQuery,
  setSelectedCategory,
  setSelectedTypes,
  setSortBy,
  clearFilters,
  refreshData,
} = useMarketplace();
```

## Usage

### Using the Marketplace Page

```bash
# Navigate to /dashboard/marketplace
# Browse, search, filter configs
# Click config card to view details
```

### Using the useMarketplace Hook

```typescript
'use client';

import { useMarketplace } from '@/hooks/useMarketplace';

export function MyComponent() {
  const { filteredConfigs, filters, setSearchQuery, setSelectedCategory } = useMarketplace();

  return (
    <div>
      <input
        value={filters.searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search configs..."
      />
      {filteredConfigs.map((config) => (
        <ConfigCard key={config.id} config={config} />
      ))}
    </div>
  );
}
```

### Using the ConfigDiscoveryChain

```typescript
import { configDiscoveryChain } from '@/lib/chains/configDiscoveryChain';

// Process single config
const result = await configDiscoveryChain.process({
  id: 'github-actions-1',
  yaml_content: '...',
  source_repo: 'user/repo',
  source_path: 'tools/github-actions.yaml',
  github_metrics: { stars: 100, forks: 20 },
  author_info: { github_username: 'user', name: 'John' },
});

console.log(result.preview); // Marketplace-ready data

// Batch process multiple configs
const batch = await configDiscoveryChain.processBatch(configs);
console.log(batch.successful, batch.failed, batch.total);
```

## Key Features

### 1. **Federated Content Model**
- Configs reference GitHub repos (not replicated)
- Marketplace indexes metadata only
- GitHub as source of truth for metrics

### 2. **Smart Filtering**
- Category-based browsing (16 categories)
- Type selection (tool, schema, iac, llm, automation)
- Full-text search across name, description, tags, author
- Quality score filtering (0-100)
- Star/fork filtering

### 3. **Sorting Options**
- **Trending** - Downloads + stars weighted
- **Most Downloaded** - Installation count
- **Most Starred** - GitHub stars
- **Highest Quality** - Quality score
- **Recently Updated** - Last modified date

### 4. **Statistics**
- Total configs in marketplace
- Total downloads across all configs
- Community members count
- Featured/trending configs
- Distribution by category

### 5. **Author Reputation**
- Reputation tier (Contributor, Builder, Expert, Legend)
- Badges displayed on cards
- Avatar and name
- Link to profile (future)

### 6. **Performance**
- In-memory caching (5-minute TTL)
- Lazy loading with skeleton cards
- Debounced search
- Client-side filtering for instant feedback

## Data Model

### ConfigRecord (Full)
```typescript
{
  id: string;
  name: string;
  description: string;
  category: ConfigCategory;
  type: ContributionType;
  tags: string[];
  source: ConfigSource; // GitHub repo reference
  author: ConfigAuthor;
  metrics: ConfigMetrics; // GitHub + platform metrics
  sharing: 'public' | 'unlisted' | 'private';
  license: LicenseType;
  allow_forks: boolean;
  attribution_required: boolean;
  lineage: ContributionLineage;
  quality_score: number; // 0-100
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### ConfigPreview (Marketplace Display)
```typescript
{
  id: string;
  name: string;
  description: string;
  category: ConfigCategory;
  type: ContributionType;
  tags: string[];
  author: { name, github_username, avatar_url, reputation_tier };
  metrics: { stars, forks, downloads };
  is_trending: boolean;
  is_featured: boolean;
  quality_score: number;
}
```

## Testing

### Run Tests
```bash
npm run test:unit src/components/marketplace
npm run test:watch
```

### ConfigCard Tests
- ✓ Renders all config metadata
- ✓ Handles click events
- ✓ Applies highlight styles
- ✓ Shows quality indicators
- ✓ Handles edge cases (no tags, zero metrics)
- ✓ Accessibility (button role, contrast)

## Future Enhancements

### Phase 2
- [ ] Config detail page (/dashboard/marketplace/[id])
- [ ] Detailed GitHub metrics (commit history, contributors)
- [ ] User ratings and reviews
- [ ] "Install" workflow (create reference in user workspace)
- [ ] Lineage visualization (fork trees)

### Phase 3
- [ ] Config comparison tool (side-by-side)
- [ ] Advanced search (Elasticsearch)
- [ ] Related configs suggestions
- [ ] Saved favorites
- [ ] Watch for updates

### Phase 4
- [ ] Author reputation profiles
- [ ] Contribution showcase
- [ ] Badge system
- [ ] Leaderboards
- [ ] Admin dashboard

## Integration Points

### GitHub API
- Repository discovery (search `.hybrid-cicd/manifest.yaml`)
- Metrics aggregation (stars, forks, watchers)
- Author information (avatars, profiles)

### OAuth2
- GitHub login (primary)
- Scope: `read:repo`, `read:user`

### Event System
- `config.discovered` - New config indexed
- `config.installed` - User installed config
- `config.updated` - Config version changed
- `config.starred` - User starred config

## Performance Considerations

### Caching Strategy
- In-memory cache with 5-minute TTL
- Future: Redis for distributed caching
- Stale-while-revalidate pattern

### Pagination
- Future: Implement cursor-based pagination
- Currently loads all configs (limit: ~1000)

### Search
- Client-side filtering for instant feedback
- Future: Elasticsearch for large datasets

### API Calls
- Batch GitHub API calls with rate limiting
- Future: GraphQL for efficient data fetching

## Security

### Input Validation
- ConfigRecord validated against JSON Schema
- YAML parsing with error handling
- XSS protection via React

### Permission System
- Configs have explicit sharing controls
- Private configs never indexed
- Attribution always preserved

### Sandboxing
- Configs are data (YAML/JSON), not executable
- Future: Plugin system with Web Worker sandboxing

## Troubleshooting

### Issue: No configs showing
- Check marketplace data service is initialized
- Verify mock data is loading
- Check browser console for errors

### Issue: Filters not working
- Ensure filter values match ConfigCategory enum
- Check debouncing on search input
- Verify state updates with React DevTools

### Issue: Poor performance
- Monitor cache hit rate
- Consider implementing pagination
- Profile component render times

## Documentation References

- [PLUGIN_ARCHITECTURE_VISION.md](../../architecture/PLUGIN_ARCHITECTURE_VISION.md) - Overall vision
- [COMMUNITY_MANIFESTO.md](../../architecture/COMMUNITY_MANIFESTO.md) - Community philosophy
- [DEVOPS_WEBHOOKS_AND_TOOLS.md](../../cicd/DEVOPS_WEBHOOKS_AND_TOOLS.md) - Tool taxonomy

## Related Files

- `/src/lib/types/marketplace.ts` - Type definitions
- `/src/lib/chains/configDiscoveryChain.ts` - CodeUChain pipeline
- `/src/lib/services/marketplaceService.ts` - Data service
- `/src/components/marketplace/` - UI components
- `/src/hooks/useMarketplace.ts` - Custom hook
- `/src/app/dashboard/marketplace/page.tsx` - Page component

---

**Status**: MVP Complete - Phase 1 Ready for Testing
**Next**: Config detail page, GitHub integration, user installation flow
