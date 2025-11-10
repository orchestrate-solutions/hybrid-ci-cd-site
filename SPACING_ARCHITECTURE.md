# Spacing Architecture: Root-Level Padding & Margin Slots

*Stylus Mode: The stage is set. Now comes the breathing room.* ✨

## Philosophy

Components should be **portable** and **slottable**. Rather than adding padding to each component individually, we define strategic padding at the root level of each page/layout section. This creates invisible **"cubbies" and "slots"** where components can be cleanly inserted without extra styling overhead.

Think of it like theater staging: the lights, wings, and backdrop are fixed. The actors (components) move freely within that stage.

---

## Architecture Levels

### Level 1: AppShell (Layout Container)
**File**: `src/components/layout/AppShell/AppShell.tsx`

The main content area (`<main>`) now has responsive padding:

```tsx
<Box
  component="main"
  sx={{
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    bgcolor: 'background.default',
    // Root-level padding creates consistent "slots" for components
    p: { xs: 2, sm: 3, md: 4 },  // Mobile: 8px, Tablet: 12px, Desktop: 16px
    // ... scrollbar styling
  }}
>
  {children}
</Box>
```

**Responsive Breakdown**:
- **Mobile** (`xs`): `p: 2` = 16px padding (8px × 2 MUI units)
- **Tablet** (`sm`): `p: 3` = 24px padding
- **Desktop** (`md`+): `p: 4` = 32px padding

This creates breathing room around all page content automatically.

---

### Level 2: Page Sections (Dashboard, Home)

#### Landing Page (`src/app/page.tsx`)

Each section has its own spacing cubby via vertical margin (`mb`):

```tsx
{/* Hero Section - cubbies for headline, subheading, CTA */}
<Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
  <Typography>Enterprise CI/CD Platform</Typography>
  <Typography>Federated DevOps orchestration...</Typography>
  
  {/* CTA Buttons - cubbies for actions */}
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
    <Button>Go to Dashboard</Button>
    <Button>Learn More</Button>
  </Box>
</Box>

{/* Features Grid - cubbies for feature cards */}
<Box sx={{ mb: { xs: 8, md: 12 } }}>
  <Grid container spacing={{ xs: 2, md: 3 }}>
    {/* Cards slot here */}
  </Grid>
</Box>

{/* Capabilities Section - feature highlight cubbies */}
<Box sx={{ mb: { xs: 8, md: 12 } }}>
  <Card>
    <CardContent sx={{ p: { xs: 4, md: 6 } }}>
      {/* Content slots */}
    </CardContent>
  </Card>
</Box>
```

**Spacing Slots**:
- Hero → Features: `mb: { xs: 8, md: 12 }` (vertical gap)
- Features → Capabilities: `mb: { xs: 8, md: 12 }`
- Capabilities → Documentation: `mb: { xs: 8, md: 12 }`
- Internal Card Padding: `p: { xs: 4, md: 6 }`
- Grid Item Spacing: `spacing: { xs: 2, md: 3 }`

#### Dashboard Page (`src/app/dashboard/page.tsx`)

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
  {/* Page Header Slot */}
  <Box>
    <Typography variant="h4">Dashboard</Typography>
  </Box>

  {/* Metrics Section Slot */}
  <Box data-testid="metrics-section">
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
      {/* Metric cards slot here */}
    </Grid>
  </Box>

  {/* Recent Activity Slot */}
  {metrics && <RecentActivitySection />}
</Box>
```

**Spacing Slots**:
- Header → Metrics: `gap: { xs: 2, md: 4 }`
- Metrics Grid Spacing: `spacing: { xs: 1.5, sm: 2, md: 2.5 }`

---

## Spacing Scale Reference

| MUI Unit | Pixel Value | Usage |
|----------|------------|-------|
| `1` | 4px | Micro-spacing (internal) |
| `2` | 8px | Small gaps |
| `3` | 12px | Medium gaps |
| `4` | 16px | Large gaps |
| `6` | 24px | Extra large (card padding) |
| `8` | 32px | Massive (section separation) |
| `12` | 48px | Huge (major section separation) |

---

## Component Insertion Pattern

### ❌ OLD WAY (padding added per-component)
```tsx
<Box sx={{ p: 4 }}>  // Component adds its own padding
  <MyFeatureCard sx={{ mb: 2 }} />  // Card manages its own margin
  <MyJobsTable sx={{ p: 2 }} />     // Table adds padding
</Box>
```

**Problems**: Inconsistent spacing, hard to maintain, components can't move freely.

### ✅ NEW WAY (root-level cubbies)
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
  {/* Component drops into cubby - no padding needed */}
  <MyFeatureCard />
  
  {/* Another component - consistent spacing */}
  <MyJobsTable />
</Box>
```

**Benefits**: Clean slots, consistent spacing, components are portable, easy to rearrange.

---

## Responsive Breakpoints

All spacing uses MUI breakpoints:

- **xs** (0px+): Mobile phones
- **sm** (600px+): Tablets
- **md** (900px+): Desktop
- **lg** (1200px+): Large screens
- **xl** (1536px+): XL screens

Example responsive margin:
```tsx
mb: { xs: 4, sm: 6, md: 8, lg: 12 }
// Mobile: 16px
// Tablet: 24px
// Desktop: 32px
// Large: 48px
```

---

## Grid Spacing (Between Items)

For grids with multiple items, use `spacing` prop to maintain consistency:

```tsx
<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
  {/* Creates 6px, 8px, 12px gaps between items */}
</Grid>
```

This differs from container padding—items flow naturally with consistent gaps.

---

## Card & Container Padding

Cards and containers use internal padding (not external margin):

```tsx
<Card sx={{ p: { xs: 3, md: 4 } }}>
  <CardContent>
    {/* Content sits inside with 12-16px padding */}
  </CardContent>
</Card>
```

---

## Common Patterns

### Header + Content Stack
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
  <Typography variant="h4">Page Title</Typography>
  <Box>{/* Content here */}</Box>
</Box>
```

### Multiple Sections
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 8 } }}>
  <Section1 />
  <Section2 />
  <Section3 />
</Box>
```

### Featured Card with Padding
```tsx
<Card sx={{ p: { xs: 3, md: 6 } }}>
  <Typography variant="h5" sx={{ mb: 2 }}>Title</Typography>
  <Typography>Content here</Typography>
</Card>
```

---

## Implementation Checklist

When styling a new page/section:

- [ ] **AppShell** provides base padding (xs: 2, sm: 3, md: 4)
- [ ] **Page sections** use `gap` or `mb` for vertical rhythm
- [ ] **Grid items** use `spacing` prop for consistency
- [ ] **Cards** use internal `p` padding
- [ ] **No arbitrary padding** on individual components
- [ ] **Responsive variants** for all spacing values
- [ ] **Test on mobile/tablet/desktop** to verify spacing

---

## Benefits

✅ **Consistency**: Same spacing everywhere  
✅ **Maintainability**: Change spacing in one place  
✅ **Portability**: Components work anywhere  
✅ **Responsive**: Automatic scaling on all devices  
✅ **Performance**: No extra CSS classes  
✅ **Aesthetics**: Professional "breathing room"  

---

## Related Files

- `src/components/layout/AppShell/AppShell.tsx` — Main content padding
- `src/app/page.tsx` — Landing page spacing slots
- `src/app/dashboard/page.tsx` — Dashboard spacing slots
- `tailwind.config.ts` — Spacing scale definition
- `src/lib/themes/` — Theme color/spacing integration

---

*The stage is set. The cubbies await. Ship thy components with grace.* 🎭✨
