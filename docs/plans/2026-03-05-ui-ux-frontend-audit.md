# TrafficGenius — Comprehensive UI/UX & Front-End Audit

**Date:** March 5, 2026
**Scope:** Full front-end codebase — layout architecture, components, design system, UX patterns, accessibility, responsive design
**Methodology:** Analyzed against Atomic Design (Brad Frost), Vercel React Best Practices, Web Interface Guidelines, Tailwind Design System v4, WCAG 2.1, and industry SaaS dashboard benchmarks (Datadog, Vercel, Linear, Cloudflare)

---

## Executive Summary

TrafficGenius has a **solid functional foundation** — Server Components with Suspense, i18n, a collapsible sidebar, and a clean data-fetching pattern. However, several structural and UX deficiencies prevent it from reaching parity with industry-standard SaaS dashboards. The issues fall into **7 categories** ranked by impact:

| #   | Category                         | Severity   | Impact      |
| --- | -------------------------------- | ---------- | ----------- |
| 1   | Layout Architecture & Navigation | **HIGH**   | Structural  |
| 2   | Component Composition & Reuse    | **HIGH**   | Scalability |
| 3   | Design Token System & Theming    | **MEDIUM** | Consistency |
| 4   | Data Tables & Data Density       | **HIGH**   | Usability   |
| 5   | Responsive Design & Mobile UX    | **MEDIUM** | Reach       |
| 6   | Accessibility (a11y)             | **HIGH**   | Compliance  |
| 7   | Interaction Patterns & Feedback  | **MEDIUM** | Polish      |

---

## 1. Layout Architecture & Navigation

### 1.1 Missing Breadcrumb Navigation

**Files:** All `app/dashboard/*/page.tsx`
**Issue:** No breadcrumb trail exists anywhere in the dashboard. Users on deep pages like `/dashboard/cloud-armor/[policyName]` have only a back-arrow link and the sidebar to understand their location.
**SaaS Benchmark:** Datadog, Vercel, and Cloudflare all use persistent breadcrumbs below the top bar to show page hierarchy.
**Recommendation:** Create a `<Breadcrumbs />` component using `usePathname()` with a route-to-label map. Place it in `DashboardLayout` above `{children}`.

### 1.2 No Top Bar / Command Palette

**Files:** `app/dashboard/layout.tsx`, `components/dashboard/DashboardNav.tsx`
**Issue:** The desktop experience has a sidebar but **no persistent top bar**. There is no global search, no quick-action command palette (⌘K), and no user avatar/session indicator visible on desktop. The user's identity is only visible in Settings.
**SaaS Benchmark:** Every leading SaaS dashboard (Linear, Vercel, Notion) has a persistent top bar with: user avatar, global search, notifications bell, and a command palette.
**Recommendation:**

- Add a `<TopBar />` component for desktop (rendered inside `DashboardContent`) containing: breadcrumbs, global search input, notification indicator, and user avatar dropdown.
- Implement a command palette (⌘K) using `cmdk` or a `Dialog`-based approach to allow keyboard-driven navigation between pages and actions.

### 1.3 Sidebar Lacks User Context

**File:** `components/dashboard/DashboardNav.tsx`
**Issue:** The sidebar footer contains only the language switcher and collapse toggle. There is no user avatar, name, or quick-access sign-out. Users must navigate to `/dashboard/settings` to see who they are or to sign out.
**SaaS Benchmark:** Sidebar footers universally show a compact user profile block (avatar + name + dropdown with sign-out).
**Recommendation:** Add a `<SidebarUserBlock />` component in the sidebar footer that shows the session user's avatar + truncated name, with a dropdown for "Settings" and "Sign Out".

### 1.4 Missing Active Section Groupings in Sidebar

**File:** `components/dashboard/DashboardNav.tsx`
**Issue:** All 7 navigation items are in a flat list. As the app grows, this will become unwieldy. There is no visual grouping between "Analytics" items (Overview, Traffic, IVT) and "Management" items (Security Rules, Sites, Audit Log, Settings).
**Recommendation:** Add section labels (`<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">`) to visually group nav items:

- **Analytics:** Overview, Traffic, Bot Detection
- **Security:** Security Rules, Sites
- **System:** Audit Log, Settings

### 1.5 Footer Is Not Sticky / Is Pushed Down

**File:** `app/dashboard/layout.tsx`
**Issue:** The footer is inside `DashboardContent` which has `padding-left` transition for the sidebar. On short-content pages (e.g., empty Audit Log), the footer floats mid-page. It is not sticky to the bottom of the viewport.
**Recommendation:** Either make the footer sticky to the viewport bottom with `mt-auto` on a flex container, or move it outside the scrollable area entirely. Use a `min-h-screen flex flex-col` pattern on the content wrapper.

### 1.6 Page Padding Inconsistency

**Files:** `app/dashboard/layout.tsx` (`px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24`)
**Issue:** The `pb-24` on `<main>` is a workaround for the sticky save bar in Settings. This padding bloat affects every page, not just Settings. The value is hard-coded rather than conditionally applied.
**Recommendation:** Remove the blanket `pb-24`. Apply extra bottom padding only on pages that use the sticky save bar, or use a layout slot pattern.

---

## 2. Component Composition & Reuse

### 2.1 Violation of Atomic Design Hierarchy

**Framework:** Atomic Design (Quarks → Atoms → Molecules → Organisms → Templates → Pages)

**Current State:** The codebase has two tiers:

- `components/ui/` — Atoms (Button, Input, Badge, Card, Table, etc.)
- `components/dashboard/` — A mix of Molecules, Organisms, and even Template-level components

**Deficiencies:**

- **No Molecules layer.** Components like `KpiCard` are Molecules (icon + label + value) but live alongside Organisms like `SettingsContent` (a full page section with forms, cards, and state management).
- **OverviewKpis** is an Organism that renders Molecules, but it lives flat in `dashboard/` alongside atomic-level components like `HelpTooltip`.
- **SiteForm**, **RuleActions**, and **SettingsContent** are 200-400 line monoliths that combine form state, API calls, dialogs, and rendering. These should be decomposed.

**Recommendation:** Restructure to:

```
components/
├── ui/              # Atoms (shadcn/ui primitives) — KEEP
├── molecules/       # KpiCard, HelpTooltip, SeriesToggle, SiteSelector, LanguageSwitcher
├── organisms/       # OverviewKpis, PolicyList, IvtTable, AuditTable, TrafficStats
├── templates/       # DashboardNav, TopBar, DashboardContent
└── features/        # SettingsContent, RuleActions, SiteForm (complex stateful features)
```

### 2.2 Monolithic Form Components

**Files:** `components/dashboard/RuleActions.tsx` (~200 lines), `components/dashboard/SiteForm.tsx` (~230 lines), `components/dashboard/SettingsContent.tsx` (~370 lines)
**Issue:** These components combine:

1. State management (useState for form data, loading, status)
2. API calls (fetch with POST/PATCH/DELETE)
3. Dialog/modal management
4. Form rendering
5. Server response handling + page reload

This violates the single-responsibility principle and makes testing, reuse, and maintenance difficult.

**Recommendations:**

- Extract form logic into custom hooks: `useRuleForm()`, `useSiteForm()`, `usePreferences()`
- Extract API mutation functions into `lib/api/` or co-located service modules
- Replace `window.location.reload()` with `router.refresh()` — the current pattern causes a full page re-render and loses client state (sidebar position, scroll, etc.)
- Use React 19's `useActionState` or `useTransition` for form submission states

### 2.3 Icon Resolution via String Map

**File:** `components/dashboard/KpiCard.tsx`
**Issue:** Icons are resolved via a string-to-component `ICON_MAP` lookup. This is fragile — adding a KPI requires updating both the map and the caller. It also prevents tree-shaking.
**Recommendation:** Accept `icon` as a `LucideIcon` component type directly in the props interface, or use React.ElementType. Callers pass the component reference:

```tsx
<KpiCard icon={Activity} label="..." value="..." />
```

### 2.4 No Loading/Empty/Error State Abstractions

**Files:** Multiple table and card components
**Issue:** Empty states are ad-hoc inline strings in each component (`"No rules configured in this policy"`, `"No sites registered yet"`, etc.). There is no shared `<EmptyState />` component with an icon, message, and optional CTA.
**Recommendation:** Create an `<EmptyState icon={...} title="..." description="..." action={<Button>...</Button>} />` Molecule used by all list/table components.

### 2.5 Redundant Skeleton Definitions

**Files:** Every `app/dashboard/*/page.tsx`
**Issue:** Each page defines its own inline `*Skeleton()` function. These are nearly identical (grid of `<Skeleton>` blocks with slightly different heights).
**Recommendation:** Create shared skeleton presets: `<PageSkeleton variant="kpi-grid" />`, `<PageSkeleton variant="table" />`, `<PageSkeleton variant="chart" />`. Import and compose them per page.

---

## 3. Design Token System & Theming

### 3.1 No Dark Mode Support

**File:** `app/globals.css`
**Issue:** All design tokens are light-mode only. There are no `@media (prefers-color-scheme: dark)` or class-based dark variants. The `SettingsContent` has a `darkMode` toggle in preferences, but it does nothing — no dark theme tokens exist.
**SaaS Benchmark:** Dark mode is table-stakes for developer-facing SaaS tools (Datadog, Vercel, Linear all ship dark mode).
**Recommendation:**

1. Define dark token overrides in `globals.css` using Tailwind v4's `@custom-variant`:

   ```css
   @custom-variant dark (&:where(.dark, .dark *));
   ```

2. Add dark-aware `--color-background`, `--color-foreground`, `--color-card`, etc.
3. Wire the `darkMode` preference toggle to add/remove `.dark` class on `<html>`.

### 3.2 Hardcoded Colors Outside Token System

**Files:** Multiple chart and component files
**Issue:** Numerous hardcoded hex colors bypass the design token system:

- `TrafficChart.tsx`: `#2563eb`, `#ef4444`, `#22c55e`, `#f1f5f9` hardcoded in gradients and strokes
- `IvtPieChart.tsx`: `COLORS` map with raw hex values
- `CountryChart.tsx`: Same hardcoded hex values
- `IvtTable.tsx`: Inline `style={{ backgroundColor: ... }}` with hardcoded `#ef4444`, `#f59e0b`, `#22c55e`
- `KpiCard.tsx`: `iconColor` props compared with string `.includes("cyan")` pattern — brittle

**Impact:** Color changes require hunting through 10+ files. Dark mode is impossible without a centralized system.
**Recommendation:**

1. Define chart palette tokens in `globals.css`: `--color-chart-primary`, `--color-chart-danger`, `--color-chart-success`, etc.
2. Create a `lib/chart-theme.ts` that exports colors from CSS custom properties via `getComputedStyle()`.
3. Replace all hardcoded hex references with token references.

### 3.3 Inconsistent Semantic Color Usage

**Files:** Multiple components
**Issue:**

- `--color-error` is defined as `#ef4444` but `Button` uses `bg-error` while `Badge` uses `bg-red-100 text-red-700`.
- `TrafficKpis` uses `text-red-600` and `text-amber-600` directly instead of semantic tokens.
- Threat-level badge classes (`.badge-critical`, `.badge-high`, etc.) are defined in CSS but never used in components — components use `Badge` with variant props instead.
  **Recommendation:** Remove dead CSS classes. Unify on semantic token usage: `text-error`, `bg-error/10`, etc.

### 3.4 Missing Animation/Transition Tokens

**File:** `app/globals.css`
**Issue:** No standardized animation duration or easing tokens. Components use a mix of `duration-200`, `duration-300`, `ease-in-out` — inconsistent transition timings across sidebar, tooltips, and dialogs.
**SaaS Benchmark:** The Tailwind Design System skill recommends defining `--animate-*` tokens.
**Recommendation:** Add to `@theme inline`:

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

### 3.5 No Spacing Scale Documentation

**Issue:** The design system uses Tailwind's default spacing scale but with no documented conventions. Gap values range from `gap-1` to `gap-6` with no pattern. Card padding is inconsistently `p-5` (KpiCard, PolicyList, Sites) vs `p-6` (Card default).
**Recommendation:** Establish a spacing convention (e.g., compact = `p-4`, default = `p-5`, spacious = `p-6`) and document it.

---

## 4. Data Tables & Data Density

### 4.1 No Pagination

**Files:** `components/dashboard/IvtTable.tsx`, `components/dashboard/AuditTable.tsx`
**Issue:** Tables show all records (up to `limit: 50` or `limit: 100`) with no pagination controls. The `total` count is displayed in headers but there's no way to page through results.
**SaaS Benchmark:** All SaaS dashboards paginate data tables with page size selector, page navigation, and total count.
**Recommendation:** Create a `<Pagination />` component with page selector and wire it through `searchParams` for server-side pagination.

### 4.2 No Sorting

**Files:** All table components
**Issue:** No column is sortable. All tables render data in whatever order the server provides.
**Recommendation:** Add `sortable` capability to `TableHead` with click-to-sort and chevron indicators. Server-side sorting via `searchParams` is preferred for non-trivial datasets.

### 4.3 No Filtering/Search Within Tables

**Files:** `components/dashboard/IvtTable.tsx`, `components/dashboard/AuditTable.tsx`
**Issue:** No way to filter by type, search by IP, or filter audit log by action type. Users must visually scan all rows.
**Recommendation:** Add filter controls above tables: a search input + dropdown filters for categorical columns (IVT type, action, country).

### 4.4 No Row Detail / Click-to-Expand

**Files:** IVT Table, Audit Table
**Issue:** Rows are static. Clicking on an IVT record doesn't show the full user agent, request path, or rule details. Audit log details are truncated to 80 characters with no way to see the full JSON.
**Recommendation:** Add click-to-expand (accordion row) or slide-over detail panels for table rows.

### 4.5 Fixed Table Heights

**Files:** Chart containers use fixed heights (`h-75`, `h-65`, `h-100`)
**Issue:** These Tailwind arbitrary height values create rigid containers that don't adapt to data volume or viewport size. On smaller screens, these can be too tall; on ultrawide monitors, they waste space.
**Recommendation:** Use `min-h-` + `max-h-` constraints with responsive modifiers instead of fixed heights.

---

## 5. Responsive Design & Mobile UX

### 5.1 Mobile Tables Are Unusable

**Files:** All `Table`-based components
**Issue:** Tables use `overflow-auto` which forces horizontal scrolling on mobile. With 6 columns on the IVT table (timestamp, IP, country, type, confidence, action), users must scroll right to see critical data.
**SaaS Benchmark:** Mobile-optimized dashboards use card-based layouts on small screens instead of tables.
**Recommendation:** Implement responsive table strategy:

- `sm:` and below: render records as stacked cards
- `md:` and above: render as traditional table
  Use a `<ResponsiveTable>` wrapper that switches rendering mode.

### 5.2 Chart Readability on Mobile

**Files:** Chart components
**Issue:** The pie chart with `innerRadius={60} outerRadius={100}` has fixed pixel dimensions that don't scale well on small screens. The label function renders `name (XX%)` which overlaps on mobile.
**Recommendation:** Use responsive radius values. Suppress labels on mobile and rely on the legend. Consider using a horizontal bar chart as the mobile alternative for pie data.

### 5.3 SiteSelector Dropdown Position

**File:** `components/dashboard/SiteSelector.tsx`
**Issue:** The dropdown uses `absolute top-full left-0` positioning. On mobile, if the selector is near the right edge, the 16rem-wide dropdown could overflow the viewport.
**Recommendation:** Add viewport-aware positioning or use a bottom-sheet pattern on mobile.

### 5.4 No Touch Gesture Support

**Issue:** The sidebar mobile drawer has no swipe-to-close. The fullscreen chart overlay has no pinch-to-zoom. These are expected gesture patterns on touch devices.
**Recommendation:** Add `framer-motion` drag handlers for swipe-to-close on the mobile drawer.

---

## 6. Accessibility (a11y)

### 6.1 Custom Dropdown Lacks ARIA

**File:** `components/dashboard/SiteSelector.tsx`
**Issue:** The custom dropdown is built with raw `<div>` and `<button>` elements and lacks:

- `role="listbox"` on the dropdown container
- `role="option"` on each option
- `aria-expanded` on the trigger
- `aria-activedescendant` for keyboard selection
- **No keyboard navigation** (arrow keys don't work inside the dropdown)

This is a critical a11y violation per WCAG 2.1 SC 4.1.2.
**Recommendation:** Either replace with Radix UI `Select` / `Popover` (which handle ARIA natively), or add full keyboard navigation + ARIA roles manually.

### 6.2 Custom Dialog Missing Focus Trap

**File:** `components/ui/dialog.tsx`
**Issue:** The custom Dialog implementation has no focus trap. When a dialog is open, Tab key can cycle focus to elements behind the overlay. There is no `aria-modal="true"` attribute, and `role="dialog"` is missing.
**Recommendation:** Use `@radix-ui/react-dialog` or implement a focus trap with `react-focus-lock`. Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to `DialogTitle`.

### 6.3 Tooltip Not Screen-Reader Accessible

**File:** `components/dashboard/HelpTooltip.tsx`
**Issue:** The tooltip uses visibility toggling but doesn't use `aria-describedby` or `role="tooltip"`. Screen readers cannot discover or read the tooltip content. The trigger `<button>` has `aria-label="Help"` but doesn't indicate what it's help _for_.
**Recommendation:** Use `id` + `aria-describedby` pattern, or replace with Radix `Tooltip` which handles this natively.

### 6.4 Color Contrast Issues on Muted Text

**Files:** Multiple components using `text-gray-400`, `text-gray-300`
**Issue:** `text-gray-400` (#9ca3af) on white background has a contrast ratio of ~2.9:1, which fails WCAG AA (4.5:1 minimum for normal text). Used extensively for:

- Footer version text (`text-gray-300` — even worse at ~2.1:1)
- Table secondary text
- Help tooltip trigger color
- KPI description text

**Recommendation:** Minimum body text color should be `text-gray-500` (#6b7280 — 4.6:1 ratio). For decorative/non-essential text, `text-gray-400` is acceptable only at `text-xs` with AA Large Text exception.

### 6.5 No Skip Navigation Link

**File:** `app/dashboard/layout.tsx`
**Issue:** No "Skip to main content" link for keyboard users to bypass the sidebar navigation.
**Recommendation:** Add a visually hidden skip link as the first focusable element: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`, and add `id="main-content"` to `<main>`.

### 6.6 Missing `aria-label` on Icon-Only Buttons

**Files:** `RuleActions.tsx`, `SiteActions.tsx`, `SiteForm.tsx`
**Issue:** The edit button (`<Pencil>` icon only) uses `title="Edit rule"` but no `aria-label`. The `title` attribute is not reliably announced by screen readers.
**Recommendation:** Add `aria-label` on all icon-only buttons.

### 6.7 Heading Hierarchy Violations

**Files:** Multiple dashboard pages
**Issue:** Pages jump from `<h2>` (PageHeader) directly to card-level text with no heading. The `CardTitle` renders a `<div>` instead of an `<h3>` or `<h4>`, which breaks heading hierarchy for screen readers.
**Recommendation:** Override `CardTitle` to render `<h3>` by default with an `as` prop for flexibility.

---

## 7. Interaction Patterns & Feedback

### 7.1 `window.location.reload()` as State Update

**Files:** `RuleActions.tsx`, `SiteForm.tsx`, `SiteActions.tsx`
**Issue:** After successful mutations, these components call `window.location.reload()` instead of `router.refresh()`. This causes:

- Full page reload, losing sidebar state, scroll position, and any client state
- Flash of loading (skeleton → content)
- Poor perceived performance
  **Recommendation:** Replace all `window.location.reload()` with `useRouter().refresh()` which re-fetches server data without losing client state. For optimistic updates, use React's `useOptimistic` or update local state immediately.

### 7.2 No Toast/Notification System

**Files:** All mutation components
**Issue:** No success/error notifications after mutations. The user sees the dialog close on success and a page reload. On failure, nothing visible happens (errors are silently caught). The only feedback is the Settings page's save bar.
**Recommendation:** Implement a toast notification system (e.g., `sonner` or a custom solution) for global success/error feedback. Example: "Rule created successfully", "Failed to delete site".

### 7.3 Confirm Dialogs Use `window.confirm()`

**Files:** `RuleActions.tsx` (`confirm("Are you sure...")`), `SiteActions.tsx` (same)
**Issue:** Native `confirm()` dialogs are:

- Unstyled and inconsistent with the design system
- Blocking/synchronous (freezes the UI thread)
- Not customizable (no icon, no description, no brand alignment)
  **Recommendation:** Replace with a custom `<ConfirmDialog />` component using the existing Dialog primitive. Add an icon, description, and branded action buttons.

### 7.4 No Real-Time Data Updates

**Issue:** Dashboard data is fetched once on page load with no auto-refresh mechanism. The Settings page has a `refreshInterval` preference but it's not wired to anything.
**Recommendation:** Implement periodic refresh using `router.refresh()` at the interval specified in user preferences. Show a "Last updated: X minutes ago" indicator on dashboard pages.

### 7.5 No Transition Animations Between Pages

**Issue:** Page transitions are instant with no animation. Navigating between dashboard sections feels abrupt.
**SaaS Benchmark:** Linear and Vercel use subtle fade/slide transitions between views.
**Recommendation:** Add a `<PageTransition>` wrapper using `framer-motion`'s `AnimatePresence` or CSS `@starting-style` for enter animations on route changes.

### 7.6 Chart Fullscreen Missing Keyboard Close

**File:** `components/charts/ChartActions.tsx`
**Issue:** The fullscreen overlay doesn't close on `Escape` key press. Only the close button works.
**Recommendation:** Add `useEffect` with `keydown` listener for Escape, matching the pattern already used in `DashboardNav` for the mobile drawer.

---

## 8. Additional Architecture Recommendations

### 8.1 Replace Custom Select with Radix/shadcn Select

**Files:** `components/ui/select.tsx` (custom), `SiteForm.tsx` (raw `<select>` elements)
**Issue:** The codebase has a custom `<Select>` component but `SiteForm.tsx` bypasses it entirely, using raw `<select>` with inline Tailwind classes. Two selection patterns exist.
**Recommendation:** Upgrade to Radix `@radix-ui/react-select` wrapped in the shadcn pattern. Replace all raw `<select>` elements.

### 8.2 Missing `next/dynamic` for Heavy Components

**Files:** Chart components import full Recharts library
**Issue:** All three chart components (`TrafficChart`, `IvtPieChart`, `CountryChart`) are eagerly loaded. Recharts is a significant bundle (~60KB gzipped). Pages that don't display charts (Settings, Sites) still load these if they share a common layout.
**Impact:** Per the Vercel React Best Practices skill, rule `bundle-dynamic-imports` recommends using `next/dynamic` for heavy components.
**Recommendation:** Dynamically import chart components:

```tsx
const TrafficChart = dynamic(() => import("@/components/charts/TrafficChart"), {
  loading: () => <Skeleton className="h-75 rounded-xl" />,
  ssr: false,
});
```

### 8.3 No Error Boundaries Per Section

**File:** `app/dashboard/error.tsx`
**Issue:** A single error boundary catches errors for ALL dashboard pages. If a BigQuery query fails on the Overview page, the entire page shows the error state — including sections that were fine.
**Recommendation:** Add granular `<ErrorBoundary>` wrappers per data section (KPIs, charts, tables) so that a chart failure doesn't take down the KPI cards.

### 8.4 Sidebar State Not Persisted

**File:** `lib/sidebar-context.tsx`
**Issue:** Sidebar collapsed state is stored in React state only. On page refresh, the sidebar resets to expanded. Users who prefer collapsed view must re-collapse on every session.
**Recommendation:** Persist `collapsed` to `localStorage` (same pattern as the i18n locale persistence).

---

## Priority Implementation Roadmap

### Phase 1 — Critical UX Issues (1-2 weeks)

1. Replace `window.location.reload()` with `router.refresh()` in all mutation components
2. Add focus trap + ARIA roles to Dialog component
3. Add ARIA attributes to SiteSelector dropdown
4. Fix color contrast violations (minimum `text-gray-500`)
5. Add skip navigation link
6. Add toast notification system
7. Replace `window.confirm()` with custom ConfirmDialog

### Phase 2 — Layout & Navigation Modernization (2-3 weeks)

1. Build `<TopBar />` with user context, search, and breadcrumbs
2. Add breadcrumb navigation component
3. Add sidebar section groupings
4. Add user profile block to sidebar footer
5. Fix footer sticky positioning
6. Persist sidebar collapse state to localStorage

### Phase 3 — Design System Hardening (1-2 weeks)

1. Define dark mode tokens and wire preference toggle
2. Centralize chart colors into design tokens
3. Add animation/transition tokens
4. Remove dead CSS classes (`.badge-critical`, etc.)
5. Document spacing conventions

### Phase 4 — Data Experience Upgrade (2-3 weeks)

1. Implement paginated, sorted, filterable data tables
2. Add row detail expansion / click-through
3. Create shared `<EmptyState />` and skeleton presets
4. Add responsive card-based table rendering for mobile
5. Wire auto-refresh preference to page data

### Phase 5 — Component Architecture (1-2 weeks)

1. Decompose monolithic form components into hooks + UI
2. Restructure component directory (molecules/organisms/features)
3. Dynamic import chart components with `next/dynamic`
4. Add granular error boundaries per data section

---

## File-Level Issue Index

| File                                        | Issues                       |
| ------------------------------------------- | ---------------------------- |
| `app/dashboard/layout.tsx`                  | 1.5, 1.6, 6.5                |
| `components/dashboard/DashboardNav.tsx`     | 1.3, 1.4                     |
| `components/dashboard/DashboardContent.tsx` | 1.2                          |
| `components/dashboard/KpiCard.tsx`          | 2.3, 3.2                     |
| `components/dashboard/OverviewKpis.tsx`     | 2.1                          |
| `components/dashboard/RuleActions.tsx`      | 2.2, 7.1, 7.3, 6.6           |
| `components/dashboard/SiteForm.tsx`         | 2.2, 7.1, 8.1                |
| `components/dashboard/SiteActions.tsx`      | 7.1, 7.3, 6.6                |
| `components/dashboard/SettingsContent.tsx`  | 2.2, 3.1                     |
| `components/dashboard/SiteSelector.tsx`     | 5.3, 6.1                     |
| `components/dashboard/HelpTooltip.tsx`      | 6.3                          |
| `components/dashboard/IvtTable.tsx`         | 3.2, 4.1, 4.2, 4.3, 4.4, 5.1 |
| `components/dashboard/AuditTable.tsx`       | 4.1, 4.2, 4.3, 4.4, 5.1      |
| `components/dashboard/PolicyList.tsx`       | — (well-structured)          |
| `components/dashboard/TrafficStats.tsx`     | 3.3                          |
| `components/charts/TrafficChart.tsx`        | 3.2, 7.6, 8.2                |
| `components/charts/IvtPieChart.tsx`         | 3.2, 5.2, 8.2                |
| `components/charts/CountryChart.tsx`        | 3.2, 8.2                     |
| `components/charts/ChartActions.tsx`        | 7.6                          |
| `components/ui/dialog.tsx`                  | 6.2                          |
| `components/ui/card.tsx`                    | 6.7                          |
| `components/ui/select.tsx`                  | 8.1                          |
| `app/globals.css`                           | 3.1, 3.3, 3.4                |
| `lib/sidebar-context.tsx`                   | 8.4                          |
| All `app/dashboard/*/page.tsx`              | 1.1, 2.5, 7.5                |

---

_This audit provides the analytical foundation for a phased UI/UX modernization effort. Each finding includes the affected file(s), the specific deficiency, the industry benchmark it fails against, and an actionable recommendation._
