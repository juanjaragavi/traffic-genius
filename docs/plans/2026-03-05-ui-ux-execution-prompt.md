# Agent Execution Prompt — TrafficGenius UI/UX Modernization

> Copy-paste this entire document as the first message in a new Claude Code session
> opened in `/Users/macbookpro/GitHub/traffic-genius`.

---

Use `superpowers:executing-plans` to implement the plan at:

```
docs/plans/2026-03-05-ui-ux-frontend-plan.md
```

Execute **Phase 1 first** (Tasks 1–7), then pause for review before continuing.

---

## Project Context

**Project:** TrafficGenius — internal anti-bot security dashboard for TopNetworks, Inc.
**Working directory:** `/Users/macbookpro/GitHub/traffic-genius`
**Dev server:** `npm run dev` → `http://localhost:3080`

### Tech Stack

| Layer             | Details                                                             |
| ----------------- | ------------------------------------------------------------------- |
| Framework         | Next.js 16.1.6, App Router, TypeScript 5.9 strict                   |
| UI                | React 19, Tailwind CSS 4, shadcn/ui primitives in `components/ui/`  |
| Interactivity     | `framer-motion` 12 (already installed), Lucide React icons          |
| Charts            | Recharts 3 (already installed, client-only)                         |
| Auth              | NextAuth v5 beta.30, Google OAuth, `useSession()` for client access |
| i18n              | Custom `useTranslation()` / `t()` from `lib/i18n.ts`                |
| Logging           | Pino via `lib/logger.ts` — **NEVER use `console.log()`**            |
| No test framework | Verification: `npx tsc --noEmit` + `npm run lint` + `npm run build` |

### Verification commands (run after EVERY task)

```bash
npx tsc --noEmit   # must pass with 0 errors
npm run lint       # ESLint + Prettier — fix any formatting issues with: npm run format
```

Run `npm run build` only at phase boundaries or when the plan explicitly requests it.

### Commit discipline

Use `scripts/git-workflow.sh` for all commits:

```bash
./scripts/git-workflow.sh "feat(component): description of change"
```

Or use plain `git` with a Conventional Commits message. Do **not** use `--no-verify`.

---

## Critical Rules — Never Violate These

1. **NEVER** use `console.log()`, `console.warn()`, or `console.error()`. Import and use `logger` from `@/lib/logger` or `createScopedLogger`.
2. **NEVER** use `window.location.reload()` — use `useRouter().refresh()`.
3. **NEVER** use `window.confirm()` — use the `ConfirmDialog` component (Task 7 creates it).
4. **NEVER** hard-code hex colors in components — use design tokens or `lib/chart-theme.ts`.
5. **Always read a file before editing it.** Line numbers in the plan are approximate — the actual file may differ. Use `Read` to confirm before applying edits.
6. **TypeScript strict mode is ON.** No `any` types, no ignoring type errors.
7. **Do not amend published commits.** Create new commits for fixes.
8. **Do not implement on `main` without explicit user approval.**

---

## Recently Modified Files — Read Before Editing

The following files have been updated since the plan was written. Their current state differs from what was described at plan creation time. **Always read them first** before applying any plan edits:

### `components/dashboard/SiteSelector.tsx`

Now imports `useTranslation` from `@/lib/i18n` and uses `t("siteSelector.allSites")`, `t("siteSelector.showAggregated")`, `t("siteSelector.noSites")` in the JSX. The plan's Task 3 code snippets show hardcoded strings — **replace those strings with the existing `t()` calls** when applying the ARIA changes. Do not regress the i18n work.

### `components/dashboard/SiteForm.tsx`

Now imports `useTranslation` and uses `t()` throughout all button labels, field labels, and dialog titles. The plan's Task 1 and Task 6 code snippets show hardcoded English strings — **preserve all `t()` calls** when adding `router.refresh()` and toast notifications. Do not replace `t()` calls with hardcoded strings.

---

## Project Structure Quick Reference

```
app/
├── (auth)/login/           # Google OAuth sign-in page
├── api/                    # API routes (cloud-armor, dashboard, audit-log, sites)
├── dashboard/
│   ├── layout.tsx          # ← DashboardNav + DashboardContent wrapper
│   ├── page.tsx            # Overview / KPI dashboard
│   ├── traffic/page.tsx
│   ├── ivt/page.tsx
│   ├── cloud-armor/[policyName]/page.tsx
│   ├── sites/page.tsx
│   ├── audit-log/page.tsx
│   └── settings/page.tsx
└── globals.css             # Tailwind @theme tokens + utility classes

components/
├── ui/                     # shadcn/ui atoms (button, card, dialog, input, etc.)
├── dashboard/              # Feature components (DashboardNav, KpiCard, tables...)
└── charts/                 # TrafficChart, IvtPieChart, CountryChart, ChartActions

lib/
├── i18n.ts                 # useTranslation() / t() — used across all components
├── sidebar-context.tsx     # SidebarProvider + useSidebar()
├── logger.ts               # Pino logger — use this, NEVER console.*
├── chart-theme.ts          # (created in Task 13) chart color tokens
└── gcp/                    # BigQuery, Cloud Armor, Cloud Logging services
```

---

## Phase Execution Order

Execute phases strictly in order. Do not skip ahead.

| Phase | Tasks | Focus                                                                                                              |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| **1** | 1–7   | Critical UX: router.refresh, Dialog ARIA, SiteSelector keyboard, contrast, skip link, sonner toasts, ConfirmDialog |
| **2** | 8–12  | Navigation: sidebar groups + localStorage, user profile block, Breadcrumbs, sticky footer                          |
| **3** | 13–15 | Design system: chart tokens, animation tokens, dark mode                                                           |
| **4** | 16–20 | Data: EmptyState, PageSkeleton, pagination, sorting, filters, auto-refresh                                         |
| **5** | 21–25 | Architecture: dynamic chart imports, error boundaries, icon ARIA, swipe drawer                                     |

**Default batch size: 3 tasks.** After each batch, stop and report output + verification results. Wait for feedback before the next batch.

---

## Key Dependency Notes

- `sonner` is **not yet installed** — Task 6 installs it (`npm install sonner`).
- `@radix-ui/react-dialog` is **not yet installed** — Task 2 installs it.
- `framer-motion` **is already installed** — use it directly in Task 25.
- `@radix-ui/react-select` is **not in the plan** — do not install it; use the existing `<Select>` from `components/ui/select.tsx`.

---

## Final Completion Check

After all 25 tasks pass verification, run:

```bash
# Scan for any remaining prohibited patterns
grep -rn "window\.location\.reload\|window\.confirm\|console\.log\|console\.warn\|console\.error" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"
```

Expected output: **no matches**.

Then use `superpowers:finishing-a-development-branch` to wrap up.
