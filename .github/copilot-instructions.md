# TrafficGenius — Copilot Instructions

## Project Overview

Anti-bot security dashboard for TopNetworks, Inc. — IVT (Invalid Traffic) detection, Google Cloud Armor rule management, and security analytics. Internal tool restricted to `@topnetworks.co` and `@topfinanzas.com` domains.

**Stack:** Next.js 16 (App Router, RSC), TypeScript strict, Tailwind CSS 4, shadcn/ui, NextAuth v5, PostgreSQL (`pg`), BigQuery, Cloud Armor, Pino logger.

## Architecture & Data Flow

```
Browser → proxy.ts (auth guard) → App Router
  ├── Server Components (dashboard pages) → lib/gcp/*.ts → BigQuery / Cloud Armor API
  ├── API Routes (app/api/*) → lib/gcp/*.ts + lib/audit-log.ts → PostgreSQL + GCP
  └── Client Components ("use client") → charts, forms, nav interactions
```

- **Dashboard pages are Server Components** that call `lib/gcp/bigquery.ts` and `lib/gcp/cloud-armor.ts` directly via `async` functions — not client-side fetches. See `app/dashboard/page.tsx` for the pattern: `Promise.all([getDashboardKpis(), getTrafficSummary(24), listPolicies()])`.
- **API routes** (`app/api/cloud-armor/`) are only for write operations (POST/PATCH/DELETE). Every mutation logs to `audit_logs` via `createAuditLog()`.
- **GCP clients** use lazy singleton pattern (`let _client = null; function getClient()`) in every `lib/gcp/*.ts` file.
- **Database:** Raw SQL via `pg` Pool — no ORM. Use `query<T>()` and `getClient()` from `lib/db.ts`.

## Critical Conventions

### Logging — No console.log

```typescript
// WRONG: console.log(), console.error()
// RIGHT:
import { createScopedLogger } from "@/lib/logger";
const log = createScopedLogger("MyModule");
log.info({ userId }, "Action completed");
log.error({ err }, "Something failed");
```

### Types — Centralized in lib/types.ts

All shared interfaces (`SecurityPolicy`, `SecurityRule`, `IvtRecord`, `DashboardKpis`, `AuditLogEntry`, etc.) live in `lib/types.ts`. Import with `import type { ... } from "@/lib/types"`.

### API Route Auth Pattern

Every API route must check session first:

```typescript
const session = await auth(); // from "@/auth"
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Route params in Next.js 16 are async: `{ params }: { params: Promise<{ policyName: string }> }` — always `await params`.

### Styling

- Use `cn()` from `lib/utils.ts` for conditional classes (clsx + tailwind-merge).
- Brand tokens: `text-brand-blue`, `text-brand-cyan`, `text-brand-lime`, `bg-brand-*`.
- Glass cards: `card-glass` class (defined in `globals.css`).
- Colors defined via `@theme inline` in `globals.css`, not `tailwind.config`.

### Component Organization

| Directory               | Purpose                                                     | Client/Server  |
| ----------------------- | ----------------------------------------------------------- | -------------- |
| `components/ui/`        | shadcn/ui primitives                                        | Varies         |
| `components/dashboard/` | Domain components (KpiCard, DashboardNav, RuleActions)      | `"use client"` |
| `components/charts/`    | Recharts wrappers (TrafficChart, IvtPieChart, CountryChart) | `"use client"` |

### Suspense Pattern for Data Loading

Dashboard pages wrap async data-fetching components in `<Suspense fallback={<Skeleton />}>`:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AsyncContent /> {/* Server Component with await */}
    </Suspense>
  );
}
```

## Commands

```bash
npm run dev          # localhost:3080
npm run build        # Production build
npm run lint         # ESLint + Prettier check
npm run format       # Auto-fix formatting
```

## Git & Deployment Scripts

Three bash scripts in `scripts/` automate all Git and deployment workflows. **Always use these scripts** instead of running raw `git` commands.

| Script                     | Purpose                                              | Where to Run  |
| -------------------------- | ---------------------------------------------------- | ------------- |
| `scripts/git-workflow.sh`  | Stage, commit (Conventional Commits), lint, and push | Local machine |
| `scripts/sync-branches.sh` | Synchronize `main` ↔ `dev` branches                  | Local machine |
| `scripts/deploy_update.sh` | Pull, build, restart PM2 on production server        | Production VM |

### `git-workflow.sh` — Commit & Push

```bash
./scripts/git-workflow.sh "feat(dashboard): add IVT trend chart"
./scripts/git-workflow.sh --verify-build "fix(api): handle null response"
./scripts/git-workflow.sh --branch dev "feat(cloud-armor): rule toggle"
./scripts/git-workflow.sh --dry-run "chore(deps): update bigquery"
```

**Options:** `--branch <name>`, `--force` (non-protected only), `--verify-build`, `--skip-format`, `--dry-run`.

Uses `lib/commit-message.txt` with `git commit -F`. Protected branches (`main`, `production`) block force-push.

### `sync-branches.sh` — Branch Synchronization

```bash
./scripts/sync-branches.sh                          # main → dev (default)
./scripts/sync-branches.sh --direction dev-to-main  # release
./scripts/sync-branches.sh --dry-run                # preview
```

**Options:** `--direction <main-to-dev|dev-to-main>`, `--dry-run`, `--no-push`.

### `deploy_update.sh` — Production Deployment

Runs **on the server** (GCP Compute Engine VM). Stashes local changes, pulls latest, builds, and restarts PM2.

```bash
sudo bash ./scripts/deploy_update.sh                 # Full deployment
sudo bash ./scripts/deploy_update.sh --skip-build    # Pull only
sudo bash ./scripts/deploy_update.sh --branch dev    # Deploy from dev
```

**Options:** `--branch <name>`, `--skip-build`.

## Key Files

- `auth.ts` — NextAuth config (Google OAuth, domain restriction, DB sessions)
- `proxy.ts` — Route protection middleware (session cookie check)
- `lib/gcp/bigquery.ts` — All BigQuery queries (IVT records, traffic summaries, KPIs)
- `lib/gcp/cloud-armor.ts` — Cloud Armor CRUD (listPolicies, addRule, patchRule, removeRule)
- `lib/audit-log.ts` — Audit trail for all Cloud Armor mutations
- `lib/types.ts` — All TypeScript interfaces
- `globals.css` — Tailwind theme with `@theme inline` brand tokens
