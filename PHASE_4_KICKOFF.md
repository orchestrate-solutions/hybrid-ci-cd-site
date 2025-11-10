# Phase 4 Kickoff: Dashboard Pages + Integration

## Objective
Build dashboard pages that integrate component library + CodeUChain chains + backend API.

## Quick Checklist

### Page Structure
- [ ] Create `/src/app/dashboard/layout.tsx` (uses AppShell + Header + Sidebar)
- [ ] Create `/src/app/dashboard/page.tsx` (dashboard overview)
- [ ] Create `/src/app/dashboard/jobs/page.tsx` (uses JobsChain)
- [ ] Create `/src/app/dashboard/deployments/page.tsx` (uses DeploymentsChain)
- [ ] Create `/src/app/dashboard/agents/page.tsx` (uses AgentsChain)

### API Client Layer
- [ ] Create `lib/api/client.ts` (base HTTP client)
- [ ] Create `lib/api/jobs.ts` (jobsApi.list(), .get(), .create())
- [ ] Create `lib/api/deployments.ts` (deploymentsApi.list(), .get(), .create())
- [ ] Create `lib/api/agents.ts` (agentsApi.list(), .get())

### Mock Data
- [ ] Setup mock API responses (use existing data-service.py or create fixtures)
- [ ] Mock job list, deployment list, agents list

### E2E Tests
- [ ] Update cypress/e2e/chains.cy.ts to test actual pages
- [ ] Add tests for jobs page workflows
- [ ] Add tests for deployments page workflows
- [ ] Add tests for agents page workflows

### Testing
- [ ] Run Vitest: `npm run test:unit`
- [ ] Run Cypress: `npm run test:e2e`
- [ ] Target: >90% test pass rate

## Phase 4 Success Criteria

✅ All 5 dashboard pages render without errors
✅ JobsChain, DeploymentsChain, AgentsChain integrate with pages
✅ API clients work with mock backend
✅ 130+ Cypress E2E tests passing
✅ All components working (fields, display, layout)
✅ Responsive design on mobile/tablet/desktop

## Timeline

**Estimated**: 1-2 hours for complete Phase 4

**Sequence**:
1. Create page structure (30 min)
2. Build API client layer (20 min)
3. Integrate chains with pages (30 min)
4. Run tests + fix failures (30 min)
5. Commit + push (10 min)

## Next Command

When ready to start Phase 4:

```bash
# Fresh branch off main
git checkout main
git pull origin main
git checkout -b feat/dashboard-pages
```

Then we build the pages layer!
