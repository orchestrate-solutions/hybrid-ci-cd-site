# Site Rebuild Plan: From Static to Component-Driven

**Status**: Ready to implement  
**Branch**: feat/microcomponents-with-themes  
**Date**: 2025-11-10

---

## Overview

**Goal**: Replace static site implementation with dynamic, component-driven dashboard using built components, hooks, and API clients.

**Current State**:
- ✅ Landing page (static HTML)
- ✅ Docs pages (pre-rendered markdown)
- ✅ Dashboard pages exist but disconnected (no layout, no navigation)
- ✅ All components, hooks, API clients ready

**Target State**:
- ✅ Landing page (entry point with feature overview, dashboard link)
- ✅ Connected dashboard layout (Header + Sidebar + responsive mobile)
- ✅ Navigation between Jobs, Agents, Deployments pages
- ✅ Mobile-first responsive design (Storybook patterns)
- ✅ Static export working (GitHub Pages compatible)

---

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| **Entry point** | `/` = Landing page | Users see marketing first, then navigate to dashboard |
| **Dashboard layout** | Header + Sidebar (AppShell) | All dashboard pages share same nav structure |
| **Mobile support** | Sidebar drawer + hamburger | Responsive per Storybook intent |
| **Auth** | Open (no auth for now) | Local testing only; migrate later |
| **Backend URL** | `http://localhost:8000` | Local dev, env var configurable |
| **Static export** | Next.js `output: 'export'` | GitHub Pages compatible |

---

## 6-Step Implementation Plan

### Step 1: Fix Sidebar Responsive Behavior
**File**: `src/components/layout/Sidebar.tsx`  
**Task**: Make sidebar responsive (hide on mobile, show on tablet+)

Changes:
- Add `hidden md:flex` to sidebar container
- Implement drawer mode for `<md` screens (hamburger toggle)
- Responsive breakpoint: `md` (768px)
- Toggle state managed by Header component

**Acceptance**: Sidebar hidden on mobile, visible on desktop, drawer accessible via header menu

---

### Step 2: Create Dashboard Layout Wrapper
**File**: `src/app/dashboard/layout.tsx` (NEW)  
**Task**: Wrap all dashboard pages in AppShell + Header + Sidebar

Template:
```typescript
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <AppShell header={<Header />} sidebar={<Sidebar />}>
      {children}
    </AppShell>
  );
}
```

**Impact**: Auto-applies to `/dashboard`, `/dashboard/jobs`, `/dashboard/agents`, `/dashboard/deployments`

**Acceptance**: Dashboard pages render with header + sidebar wrapper

---

### Step 3: Update Home Page Landing
**File**: `src/app/page.tsx`  
**Task**: Replace static content with feature showcase + dashboard link

Changes:
- Create hero section with value proposition
- Add prominent "Go to Dashboard" CTA button → `/dashboard`
- Show quick features (Jobs, Agents, Deployments highlights)
- Keep links to docs as secondary navigation
- Responsive design (mobile-first)

**Acceptance**: Home page shows feature overview, CTA button navigates to `/dashboard`

---

### Step 4: Add Navigation to Sidebar
**File**: `src/components/layout/Sidebar.tsx` or create `src/lib/navigation.ts`  
**Task**: Define sidebar navigation items with routing

Navigation items:
- Dashboard `/dashboard`
- Jobs `/dashboard/jobs`
- Agents `/dashboard/agents`
- Deployments `/dashboard/deployments`
- Docs `/docs`

Features:
- Active state highlighting
- Icons for each item
- Collapsible sections (optional)

**Acceptance**: Sidebar shows all nav items, active item highlighted, navigation works

---

### Step 5: Set API Environment Variable
**File**: `.env.local` (NEW or UPDATE)  
**Task**: Configure API base URL

Content:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Verification**:
- Check `src/lib/api/jobs.ts` uses `process.env.NEXT_PUBLIC_API_URL`
- Confirm fallback works: `|| 'http://localhost:8000'`

**Acceptance**: API clients connect to backend at configured URL

---

### Step 6: Test Static Export & Responsive Design
**File**: Various (test only)  
**Task**: Verify build and responsiveness

Tests:
```bash
# Build static export
npm run build

# Verify all routes generate
# Check dist/ or .next/ for static output
ls -la .next/standalone/ # or out/ directory

# Test mobile responsiveness
# Chrome DevTools or Storybook patterns
```

**Mobile testing checklist**:
- [ ] Sidebar hidden on iPhone (375px)
- [ ] Hamburger menu appears on mobile
- [ ] Header responsive on small screens
- [ ] Navigation drawer opens/closes
- [ ] Dashboard pages render correctly on mobile
- [ ] API calls work (check Network tab)

**Desktop testing checklist**:
- [ ] Sidebar visible (w-64)
- [ ] Navigation items clickable
- [ ] Active route highlighted
- [ ] Dashboard pages load and display data
- [ ] API calls succeed (check Console)

**Acceptance**: Static export builds without errors, mobile/desktop responsive, API calls work

---

## Implementation Order

1. **Step 1** (Sidebar responsive) — Foundation
2. **Step 2** (Dashboard layout) — Core wrapper
3. **Step 4** (Sidebar navigation) — Can be done with Step 2
4. **Step 5** (API env var) — Quick setup
5. **Step 3** (Home page) — After layout ready for testing
6. **Step 6** (Testing) — Final validation

**Quick parallel work**: Steps 1 + 2 can be done together; Step 4 can follow immediately.

---

## File Modifications Summary

| File | Type | Change |
|------|------|--------|
| `src/components/layout/Sidebar.tsx` | Modify | Add responsive classes, drawer logic |
| `src/app/dashboard/layout.tsx` | Create | New layout wrapper for dashboard pages |
| `src/app/page.tsx` | Modify | Replace with feature showcase + CTA |
| `src/components/layout/Header.tsx` | Modify | Add hamburger toggle for mobile sidebar |
| `.env.local` | Create/Update | Set `NEXT_PUBLIC_API_URL` |

**Total changes**: ~5 files, mostly composition work

---

## Success Criteria

- [x] Landing page accessible at `/`
- [x] Dashboard accessible at `/dashboard`
- [x] Navigation between dashboard pages works
- [x] Sidebar hidden on mobile, visible on desktop
- [x] Hamburger menu works on mobile
- [x] API calls to backend succeed
- [x] Static export builds without errors
- [x] All pages responsive (desktop + mobile)
- [x] No console errors or warnings

---

## Known Blockers

None. All components, hooks, and API clients ready. This is pure composition/layout work.

---

## Technology Stack (Confirmed Ready)

- **Layout**: AppShell, Header, Sidebar components (ready)
- **Forms**: 9 field components (ready)
- **State**: useJobs, useAgents, useDeployments, useDashboard hooks (ready)
- **API**: jobs.ts, agents.ts, deployments.ts clients (ready)
- **Styling**: Tailwind CSS 4 + Emotion (ready)
- **Responsiveness**: MUI X breakpoints + Tailwind (ready)
- **Icons**: MUI Icons (ready)

---

## Deployment Checklist

After implementation:
- [ ] All tests pass (Vitest, Cypress)
- [ ] Static export builds
- [ ] Mobile responsive verified
- [ ] API calls working
- [ ] Git history clean
- [ ] Ready for PR to `main`

---

## Next Phase (Post-Merge)

1. Deploy to GitHub Pages
2. Add real authentication
3. Add form submission handlers
4. Add real-time updates (WebSocket)
5. Performance tuning (Lighthouse)
6. Analytics integration

---

**Ready to begin Step 1?** ✅
