# TrafficGenius

**Anti-Bot Security Dashboard** for [TopNetworks, Inc.](https://topnetworks.co)

Centralized security analytics, IVT (Invalid Traffic) detection, and Google Cloud Armor rule management. Built for the TopNetworks security operations team.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-Private-red)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Dashboard Pages](#dashboard-pages)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [GCP Integration](#gcp-integration)
- [Authentication](#authentication)
- [Styling & Brand](#styling--brand)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

- **Security Overview Dashboard** — Real-time KPI cards showing total requests, block rates, unique IPs, active policies, and top attack vectors
- **Traffic Analysis** — Hourly trend charts, country breakdown tables, and blocked/allowed traffic visualization
- **IVT Detection** — BigQuery-powered Invalid Traffic classification (GIVT, SIVT, suspicious, clean) with confidence scores
- **Cloud Armor Management** — Full CRUD for Google Cloud Armor security policies and rules (allow, deny, rate-limit, throttle)
- **Audit Trail** — Every Cloud Armor mutation is logged with user, action, resource, details, and IP address
- **User Settings** — Timezone preferences, refresh intervals, alert configuration, and sign-out
- **Domain-Restricted Auth** — Google OAuth limited to `@topnetworks.co` and `@topfinanzas.com` email domains

---

## Tech Stack

| Layer     | Technology                                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React Server Components)                                                                                          |
| Language  | [TypeScript 5.9](https://www.typescriptlang.org/) (strict mode)                                                                                                  |
| UI        | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/) |
| Charts    | [Recharts 3](https://recharts.org/)                                                                                                                              |
| Icons     | [Lucide React](https://lucide.dev/)                                                                                                                              |
| Auth      | [NextAuth.js v5](https://authjs.dev/) (beta.30) + Google OAuth                                                                                                   |
| Database  | PostgreSQL via [`pg`](https://node-postgres.com/) (Cloud SQL)                                                                                                    |
| Analytics | [BigQuery](https://cloud.google.com/bigquery) (`@google-cloud/bigquery`)                                                                                         |
| Security  | [Cloud Armor](https://cloud.google.com/armor) (`@google-cloud/compute`)                                                                                          |
| Logging   | [Pino 10](https://getpino.io/) + [Cloud Logging](https://cloud.google.com/logging) + [Cloud Error Reporting](https://cloud.google.com/error-reporting)           |
| Font      | [Poppins](https://fonts.google.com/specimen/Poppins) (weights 300–700)                                                                                           |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** (local or Cloud SQL via proxy)
- **GCP Service Account** with BigQuery, Compute, Logging, and Error Reporting permissions

### Installation

```bash
# Clone the repository
git clone https://github.com/juanjaragavi/traffic-genius.git
cd traffic-genius

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in all the required credentials (see Environment Variables below)

# Initialize the database
psql -d traffic_genius -f scripts/001-create-auth-tables.sql
psql -d traffic_genius -f scripts/002-create-app-tables.sql

# Start development server
npm run dev
```

The app runs at <http://localhost:3080>.

---

## Environment Variables

Create a `.env.local` file from `.env.example`. All required variables:

| Group           | Variable                         | Description                                                  |
| --------------- | -------------------------------- | ------------------------------------------------------------ |
| **Auth**        | `AUTH_SECRET`                    | NextAuth.js secret (generate with `openssl rand -base64 32`) |
|                 | `AUTH_GOOGLE_ID`                 | Google OAuth client ID                                       |
|                 | `AUTH_GOOGLE_SECRET`             | Google OAuth client secret                                   |
|                 | `AUTH_URL`                       | App URL for NextAuth callbacks (`http://localhost:3080`)     |
| **Database**    | `DATABASE_URL`                   | PostgreSQL connection string                                 |
| **GCP**         | `GCP_PROJECT_ID`                 | Google Cloud project ID                                      |
|                 | `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON key                         |
| **BigQuery**    | `BIGQUERY_DATASET`               | BigQuery dataset name (`traffic_security_logs`)              |
|                 | `BIGQUERY_TABLE`                 | BigQuery table name (`ivt_classifications`)                  |
| **Cloud Armor** | `CLOUD_ARMOR_REGION`             | GCP region for Cloud Armor policies                          |
| **App**         | `NEXT_PUBLIC_APP_URL`            | Public-facing app URL                                        |
|                 | `NEXT_PUBLIC_ENABLE_LOGGING`     | Enable logs in production (`true`/`false`)                   |

---

## Project Structure

```
traffic-genius/
├── app/
│   ├── (auth)/login/              # Google OAuth sign-in page
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth route handler
│   │   ├── cloud-armor/           # POST: create rule
│   │   │   └── [policyName]/rules/# PATCH/DELETE: update/remove rules
│   │   ├── dashboard/             # GET: kpis/, traffic/, ivt/
│   │   └── audit-log/             # GET: fetch audit entries
│   ├── dashboard/
│   │   ├── page.tsx               # Security overview (KPIs + charts)
│   │   ├── traffic/               # Traffic analysis + country breakdown
│   │   ├── ivt/                   # IVT detection records + pie chart
│   │   ├── cloud-armor/           # Policy list → [policyName] detail
│   │   ├── audit-log/             # Rule change history
│   │   └── settings/              # User preferences + sign-out
│   ├── globals.css                # Tailwind @theme inline + custom classes
│   ├── layout.tsx                 # Root layout (Poppins font, Providers)
│   └── page.tsx                   # Redirects to /dashboard
├── components/
│   ├── Providers.tsx              # NextAuth SessionProvider wrapper
│   ├── charts/                    # Recharts: TrafficChart, IvtPieChart, CountryChart
│   ├── dashboard/                 # DashboardNav, KpiCard, RuleActions, SettingsContent
│   └── ui/                        # shadcn/ui primitives (button, card, dialog, table, etc.)
├── lib/
│   ├── db.ts                      # PostgreSQL Pool (raw SQL, no ORM)
│   ├── logger.ts                  # Pino structured logger (no console.log!)
│   ├── types.ts                   # All shared TypeScript interfaces
│   ├── audit-log.ts               # Audit trail service (create + query)
│   ├── utils.ts                   # cn(), formatNumber(), formatPercent(), formatDate()
│   └── gcp/
│       ├── bigquery.ts            # IVT queries, traffic summaries, KPI aggregation
│       ├── cloud-armor.ts         # Security policy/rule CRUD via Compute API
│       ├── cloud-logging.ts       # Cloud Armor access log retrieval
│       └── error-reporting.ts     # GCP Error Reporting integration
├── scripts/
│   ├── 001-create-auth-tables.sql # NextAuth schema (users, accounts, sessions)
│   └── 002-create-app-tables.sql  # App tables (audit_logs, dashboard_preferences)
├── auth.ts                        # NextAuth v5 config (Google OAuth, domain restriction)
├── proxy.ts                       # Middleware: route protection via session cookie
├── next.config.ts                 # Image remote patterns (GCS, Google avatars)
├── tsconfig.json                  # TypeScript strict config with @/* path alias
└── package.json                   # Scripts, dependencies
```

---

## Architecture

```
Browser → proxy.ts (session cookie check)
  │
  ├── Protected Dashboard Pages (Server Components)
  │   └── Direct calls to lib/gcp/*.ts → BigQuery / Cloud Armor API
  │
  ├── API Routes (app/api/cloud-armor/)
  │   └── Write operations only → lib/gcp/cloud-armor.ts + lib/audit-log.ts
  │
  └── Client Components ("use client")
      └── Interactive UI: charts (Recharts), forms (RuleActions), navigation
```

### Key Architectural Decisions

- **Server Components by default** — Dashboard pages (`app/dashboard/*.tsx`) fetch data directly from GCP services server-side using `async` functions. No client-side data fetching for reads.
- **API routes for writes only** — `POST /api/cloud-armor`, `PATCH/DELETE /api/cloud-armor/[policyName]/rules` handle mutations and always write an audit log entry.
- **GCP lazy singletons** — Every `lib/gcp/*.ts` file uses the pattern `let _client = null; function getClient()` to create GCP clients on first use.
- **Raw SQL, no ORM** — PostgreSQL access through `pg` Pool with parameterized queries. See `lib/db.ts` for `query<T>()` and `getClient()`.
- **Structured logging** — Pino logger with scoped namespaces. `console.log()` is **never** used. See `lib/logger.ts`.
- **Suspense + Skeleton fallbacks** — Every dashboard page wraps its async data component in `<Suspense fallback={<Skeleton />}>`.

### Data Sources

| Source                | Library                         | Purpose                                         |
| --------------------- | ------------------------------- | ----------------------------------------------- |
| BigQuery              | `@google-cloud/bigquery`        | IVT records, traffic analytics, KPI aggregation |
| Cloud Armor           | `@google-cloud/compute`         | Security policy and rule CRUD                   |
| Cloud Logging         | `@google-cloud/logging`         | Access log retrieval for Cloud Armor events     |
| Cloud Error Reporting | `@google-cloud/error-reporting` | Production error tracking                       |
| PostgreSQL            | `pg`                            | Auth sessions, audit logs, user preferences     |

---

## Dashboard Pages

| Route                           | Page              | Data Source            | Description                                                    |
| ------------------------------- | ----------------- | ---------------------- | -------------------------------------------------------------- |
| `/dashboard`                    | Security Overview | BigQuery + Cloud Armor | 8 KPI cards, traffic trend chart, IVT pie chart, country chart |
| `/dashboard/traffic`            | Traffic Analysis  | BigQuery               | Hourly trends, country breakdown table, stats cards            |
| `/dashboard/ivt`                | IVT Detection     | BigQuery               | Classified IVT records table, type distribution pie chart      |
| `/dashboard/cloud-armor`        | Policies List     | Cloud Armor API        | All policies with rule counts and type badges                  |
| `/dashboard/cloud-armor/[name]` | Policy Detail     | Cloud Armor API        | Rules table with add/edit/delete/toggle actions                |
| `/dashboard/audit-log`          | Audit Log         | PostgreSQL             | History of all Cloud Armor rule changes                        |
| `/dashboard/settings`           | Settings          | NextAuth session       | User profile, preferences, sign-out                            |

---

## API Routes

| Method   | Route                                            | Purpose                              | Auth Required |
| -------- | ------------------------------------------------ | ------------------------------------ | :-----------: |
| GET/POST | `/api/auth/[...nextauth]`                        | NextAuth handlers                    |       —       |
| POST     | `/api/cloud-armor`                               | Create a new security rule           |      ✅       |
| PATCH    | `/api/cloud-armor/[policyName]/rules`            | Update an existing rule              |      ✅       |
| DELETE   | `/api/cloud-armor/[policyName]/rules?priority=N` | Remove a rule by priority            |      ✅       |
| GET      | `/api/dashboard/kpis`                            | Dashboard KPIs (24h)                 |      ✅       |
| GET      | `/api/dashboard/traffic`                         | Traffic summary (hourly + countries) |      ✅       |
| GET      | `/api/dashboard/ivt`                             | IVT classification data              |      ✅       |
| GET      | `/api/audit-log`                                 | Audit log entries                    |      ✅       |

> **Note:** Most read operations happen server-side in page components (not through these API routes). The API routes primarily serve write operations and optional client-side data fetching.

---

## Database Schema

### Auth Tables — `scripts/001-create-auth-tables.sql`

Standard [NextAuth.js PostgreSQL schema](https://authjs.dev/getting-started/adapters/pg):

- `users` — id, name, email, emailVerified, image
- `accounts` — OAuth provider accounts linked to users
- `sessions` — Database-backed sessions (30-day max age)
- `verification_token` — Email verification tokens

### App Tables — `scripts/002-create-app-tables.sql`

- **`audit_logs`** — user_id, action (`CREATE`/`UPDATE`/`DELETE`/`TOGGLE`), resource, details (JSONB), ip_address, created_at
- **`dashboard_preferences`** — user_id (unique), preferences (JSONB), updated_at

### BigQuery Table

- **Dataset:** `traffic_security_logs`
- **Table:** `ivt_classifications`
- **Key fields:** `timestamp`, `source_ip`, `country_code`, `ivt_type` (GIVT/SIVT/suspicious/clean), `confidence_score`, `user_agent`, `request_path`, `rule_matched`, `action_taken`

---

## GCP Integration

TrafficGenius integrates with four GCP services:

### BigQuery (`lib/gcp/bigquery.ts`)

Queries the `ivt_classifications` table for:

- `getDashboardKpis()` — 24h aggregate KPIs (requests, blocks, unique IPs, top attack vector)
- `getTrafficSummary(hoursAgo)` — Hourly trends, country breakdown, IVT type distribution
- `getIvtRecords(options)` — Paginated IVT records with type/country filters

### Cloud Armor (`lib/gcp/cloud-armor.ts`)

CRUD operations on security policies and rules:

- `listPolicies()` / `getPolicy(name)` — Read policies and their rules
- `addRule(policy, rule)` — Create new rule (allow, deny, rate-limit, throttle, redirect)
- `patchRule(policy, priority, updates)` — Update existing rule
- `removeRule(policy, priority)` — Delete rule by priority

### Cloud Logging (`lib/gcp/cloud-logging.ts`)

- `getArmorLogs(options)` — Fetch recent HTTP load balancer logs with Cloud Armor enforcement details

### Error Reporting (`lib/gcp/error-reporting.ts`)

- `reportError(err)` — Send errors to GCP Error Reporting (production only)

---

## Authentication

- **Provider:** Google OAuth only (via NextAuth.js v5)
- **Domain restriction:** `@topnetworks.co` and `@topfinanzas.com` — enforced in `auth.ts` `signIn` callback
- **Session strategy:** Database sessions stored in PostgreSQL (30-day max age)
- **Custom login page:** `/login` with branded UI
- **Route protection:** `proxy.ts` middleware checks session cookies and redirects unauthenticated users
- **Configuration:** `auth.ts` exports `{ handlers, auth, signIn, signOut }`

---

## Styling & Brand

### Design System

- **CSS Framework:** Tailwind CSS 4 with `@theme inline` custom properties in `globals.css`
- **Component Library:** shadcn/ui primitives in `components/ui/`
- **Class Merging:** `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge)
- **Font:** Poppins (Google Fonts, weights 300–700, CSS variable `--font-poppins`)
- **Glass Morphism:** `.card-glass` utility class for frosted-glass card effects

### Brand Colors

| Token        | Hex       | Usage                                 |
| ------------ | --------- | ------------------------------------- |
| `brand-blue` | `#2563eb` | Primary actions, links, active states |
| `brand-cyan` | `#0891b2` | Secondary accents, chart colors       |
| `brand-lime` | `#84cc16` | Success states, positive metrics      |

**Gradient:** blue → cyan → lime (used in page backgrounds and headers)

### Assets

| Asset   | URL                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------ |
| Favicon | `https://storage.googleapis.com/media-topfinanzas-com/favicon.png`                               |
| Logo    | `https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp` |

---

## Scripts

### npm Scripts

```bash
npm run dev          # Start dev server on http://localhost:3080
npm run build        # Production build
npm run start        # Start production server on port 3080
npm run lint         # Run ESLint + Prettier check
npm run format       # Auto-fix formatting with Prettier
npm run format:check # Check formatting without fixing
```

### Git & Deployment Scripts

Three bash scripts in `scripts/` automate all Git and deployment workflows. **Always use these scripts** instead of running raw `git` commands.

| Script | Purpose | Where to Run |
| --- | --- | --- |
| `scripts/git-workflow.sh` | Stage, commit (Conventional Commits), lint, and push | Local machine |
| `scripts/sync-branches.sh` | Synchronize `main` ↔ `dev` branches | Local machine |
| `scripts/deploy_update.sh` | Pull, build, restart PM2 on production server | Production VM |

#### `git-workflow.sh` — Commit & Push

Automates the full commit-to-push cycle with quality gates (TypeScript, ESLint, Prettier).

```bash
# Basic commit + push
./scripts/git-workflow.sh "feat(dashboard): add IVT trend chart"

# With full build verification before push
./scripts/git-workflow.sh --verify-build "fix(api): handle null Cloud Armor response"

# Dry run (everything except final push)
./scripts/git-workflow.sh --dry-run "chore(deps): update @google-cloud/bigquery"

# Push to a specific branch
./scripts/git-workflow.sh --branch dev "feat(cloud-armor): rule toggle endpoint"
```

**Options:** `--branch <name>`, `--force` (non-protected only), `--verify-build`, `--skip-format`, `--dry-run`.

The script writes the commit message to `lib/commit-message.txt` and uses `git commit -F` to apply it. Protected branches (`main`, `production`) block force-push.

#### `sync-branches.sh` — Branch Synchronization

Keeps `main` and `dev` in sync with fast-forward merges.

```bash
# Default: merge main → dev
./scripts/sync-branches.sh

# Release: merge dev → main
./scripts/sync-branches.sh --direction dev-to-main

# Preview without changes
./scripts/sync-branches.sh --dry-run

# Merge locally, push later
./scripts/sync-branches.sh --no-push
```

**Options:** `--direction <main-to-dev|dev-to-main>`, `--dry-run`, `--no-push`.

#### `deploy_update.sh` — Production Deployment

Runs **on the server** (GCP Compute Engine VM). Commits local changes (using `lib/commit-message.txt` with `git commit -F`), pushes, pulls, installs deps, rebuilds, and restarts PM2.

```bash
# Full deployment
sudo bash ./scripts/deploy_update.sh

# Pull only, skip rebuild
sudo bash ./scripts/deploy_update.sh --skip-build

# Deploy from dev branch
sudo bash ./scripts/deploy_update.sh --branch dev
```

**Options:** `--branch <name>`, `--skip-build`.

The script waits up to 300 seconds for a coding agent to populate `lib/commit-message.txt` before committing. The file is auto-cleaned after commit.

> **Important:** `lib/commit-message.txt` is in `.gitignore` — it is a transient file, never tracked.

---

## Deployment

### Self-Hosted (GCP Compute Engine)

For automated production deployments, use `scripts/deploy_update.sh` on the server (see **Git & Deployment Scripts** above).

```bash
# Automated deployment (recommended)
sudo bash ./scripts/deploy_update.sh

# Manual production deployment
npm install
npm run build
pm2 start npm --name traffic-genius -- start
```

### Infrastructure

- **Port:** 3080 (dev and production)
- **Process Manager:** PM2 (recommended for production)
- **Reverse Proxy:** Nginx or Apache
- **SSL:** Let's Encrypt via Certbot
- **Target Platforms:** GCP Compute Engine or Vercel

### Image Domains

Configured in `next.config.ts`:

- `storage.googleapis.com/media-topfinanzas-com/**` — CDN assets
- `lh3.googleusercontent.com` — Google profile avatars

---

## Contributing

### Coding Standards

- **TypeScript strict mode** — No `any` without justification
- **Centralized types** — All shared interfaces in `lib/types.ts`
- **Structured logging** — Use `createScopedLogger()` from `lib/logger.ts`, **never** `console.log()`
- **Path alias** — `@/*` maps to the project root
- **Component naming** — PascalCase files (`KpiCard.tsx`, `DashboardNav.tsx`)
- **Import order** — React/Next.js → third-party → local

### API Route Pattern

Every API route must:

1. Check authentication via `await auth()` from `@/auth`
2. Validate request body/params
3. Perform the operation via `lib/gcp/*.ts`
4. Log mutations to `audit_logs` via `createAuditLog()`
5. Return appropriate status codes

### Adding a New Dashboard Page

1. Create `app/dashboard/your-page/page.tsx` as a **Server Component**
2. Fetch data directly from `lib/gcp/*.ts` functions in an async component
3. Wrap the async component in `<Suspense fallback={<YourSkeleton />}>`
4. Add the route to `navItems` in `components/dashboard/DashboardNav.tsx`

---

## License

**Private** — © TopNetworks, Inc. All rights reserved.
