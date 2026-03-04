# CLAUDE.MD - TrafficGenius

## Project Identity

**TrafficGenius** is an anti-bot security dashboard for **TopNetworks, Inc.** It provides centralized security analytics, IVT (Invalid Traffic) detection, and Google Cloud Armor rule management.

- **Repository:** `traffic-genius`
- **Port:** 3080 (dev and production)
- **Domain:** Internal tool (TopNetworks employees only)
- **Status:** Active development (v0.1.0)

---

## Tech Stack

| Layer     | Technology                                                 |
| --------- | ---------------------------------------------------------- |
| Framework | Next.js 16.1.6 (App Router, Server Components)             |
| Language  | TypeScript 5.9.3 (strict mode)                             |
| UI        | React 19.2.3, Tailwind CSS 4.2.1, shadcn/ui, Framer Motion |
| Charts    | Recharts 3.7.0                                             |
| Icons     | Lucide React                                               |
| Auth      | NextAuth.js v5 (beta.30) + Google OAuth                    |
| Database  | PostgreSQL via `pg` (Cloud SQL)                            |
| Analytics | BigQuery (`@google-cloud/bigquery`)                        |
| Security  | Cloud Armor (`@google-cloud/compute`)                      |
| Logging   | Pino 10.3.1 + Cloud Logging, Cloud Error Reporting         |
| Font      | Poppins (Google Fonts, weights 300-700)                    |

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # Fill in credentials
npm run dev                   # http://localhost:3080
```

### Scripts

```bash
npm run dev          # Dev server on port 3080
npm run build        # Production build
npm run start        # Production server on port 3080
npm run lint         # ESLint + Prettier check
npm run format       # Prettier auto-fix
npm run format:check # Prettier check only
```

---

## Project Structure

```
app/
├── (auth)/login/           # Google OAuth sign-in page
├── api/
│   ├── auth/[...nextauth]/ # NextAuth handler
│   ├── cloud-armor/        # Cloud Armor CRUD endpoints
│   ├── dashboard/          # Data endpoints (ivt/, kpis/, traffic/)
│   └── audit-log/          # Audit log endpoint
├── dashboard/              # Protected pages
│   ├── page.tsx            # Overview/KPI dashboard
│   ├── traffic/            # Traffic analysis
│   ├── ivt/                # IVT detection
│   ├── cloud-armor/        # Security policy management
│   ├── audit-log/          # Audit log viewer
│   └── settings/           # User preferences
├── globals.css             # Tailwind theme + custom styles
├── layout.tsx              # Root layout (Poppins, Providers)
└── page.tsx                # Redirects to /dashboard

components/
├── Providers.tsx           # NextAuth SessionProvider
├── charts/                 # TrafficChart, IvtPieChart, CountryChart
├── dashboard/              # DashboardNav, KpiCard, RuleActions, SettingsContent
└── ui/                     # shadcn/ui primitives (button, card, dialog, table, etc.)

lib/
├── db.ts                   # PostgreSQL connection pool
├── logger.ts               # Pino logger (dev/prod aware)
├── types.ts                # All TypeScript interfaces
├── audit-log.ts            # Audit logging service
├── utils.ts                # cn(), formatters
└── gcp/                    # GCP service layer
    ├── bigquery.ts         # IVT analytics queries
    ├── cloud-armor.ts      # Cloud Armor policy CRUD
    ├── cloud-logging.ts    # Access log retrieval
    └── error-reporting.ts  # Error tracking

scripts/
├── 001-create-auth-tables.sql  # NextAuth schema (users, accounts, sessions)
└── 002-create-app-tables.sql   # App tables (audit_logs, dashboard_preferences)
```

---

## Architecture Decisions

### Authentication

- **Google OAuth** only, restricted to `@topnetworks.co` and `@topfinanzas.com` domains
- Database session strategy (PostgreSQL), 30-day max age
- Custom sign-in page at `/login`
- Configuration in `auth.ts`

### Data Sources

- **BigQuery** (`traffic_security_logs.ivt_classifications`) — IVT records, traffic analytics, KPI aggregation
- **PostgreSQL** (Cloud SQL) — Auth sessions, audit logs, user preferences
- **Cloud Armor API** — Security policy and rule CRUD operations
- **Cloud Logging** — Access log retrieval for Cloud Armor events

### Server vs Client Components

- **Server Components** by default — dashboard pages fetch data server-side
- **`"use client"`** for interactive UI: charts, forms, navigation toggles
- React Suspense with skeleton fallbacks for loading states

---

## Environment Variables

See `.env.example` for the full template. Required groups:

| Group       | Variables                                                         |
| ----------- | ----------------------------------------------------------------- |
| Auth        | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL` |
| Database    | `DATABASE_URL` (postgresql connection string)                     |
| GCP         | `GCP_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`                |
| BigQuery    | `BIGQUERY_DATASET`, `BIGQUERY_TABLE`                              |
| Cloud Armor | `CLOUD_ARMOR_REGION`                                              |
| App         | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ENABLE_LOGGING`               |

---

## Coding Standards

### Logging

**NEVER** use `console.log()`, `console.warn()`, or `console.error()`.

```typescript
// Always use the structured logger
import { logger } from "@/lib/logger";
import { createScopedLogger } from "@/lib/logger";

logger.info({ userId }, "User authenticated");

const log = createScopedLogger("cloud-armor");
log.error({ policyName, error }, "Failed to update policy");
```

Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Auto-disabled in production unless `NEXT_PUBLIC_ENABLE_LOGGING=true`.

### TypeScript

- Strict mode enabled — no `any` without justification
- All shared interfaces in `lib/types.ts`
- Path alias: `@/*` maps to project root

### Imports

```typescript
// 1. React / Next.js
import { useState } from "react";
import Link from "next/link";

// 2. Third-party
import { Button } from "@/components/ui/button";

// 3. Local
import { cn } from "@/lib/utils";
import type { SecurityRule } from "@/lib/types";
```

### Styling

- Tailwind CSS utility-first, mobile-first
- Use `cn()` from `lib/utils.ts` for class merging (clsx + tailwind-merge)
- Brand colors defined as CSS custom properties in `globals.css`
- Glass morphism cards via `.card-glass` utility

### Components

- File naming: PascalCase for components (`KpiCard.tsx`, `DashboardNav.tsx`)
- shadcn/ui primitives in `components/ui/`
- Dashboard-specific components in `components/dashboard/`
- Chart components in `components/charts/`

---

## Brand Identity

### Colors

| Token      | Hex                  | Usage                            |
| ---------- | -------------------- | -------------------------------- |
| brand-blue | `#2563eb`            | Primary actions, links           |
| brand-cyan | `#0891b2`            | Secondary accents, chart colors  |
| brand-lime | `#84cc16`            | Success states, positive metrics |
| Gradient   | blue -> cyan -> lime | Background gradients, headers    |

### Typography

- **Font:** Poppins (Google Fonts)
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- **CSS variable:** `--font-poppins`

### Assets

- **Favicon:** `https://storage.googleapis.com/media-topfinanzas-com/favicon.png`
- **Logo:** `https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp`
- **Image CDN:** `storage.googleapis.com/media-topfinanzas-com/`

---

## API Routes

| Method   | Route                           | Purpose                                   |
| -------- | ------------------------------- | ----------------------------------------- |
| GET/POST | `/api/auth/[...nextauth]`       | NextAuth handlers                         |
| POST     | `/api/cloud-armor`              | Create security rule                      |
| GET      | `/api/cloud-armor/[policyName]` | Get policy rules                          |
| GET      | `/api/dashboard/kpis`           | Dashboard KPIs (24h)                      |
| GET      | `/api/dashboard/traffic`        | Traffic summary (hourly trend, countries) |
| GET      | `/api/dashboard/ivt`            | IVT classification data                   |
| GET      | `/api/audit-log`                | Fetch audit log entries                   |

Most read operations use server-side data fetching in page components rather than client-side API calls.

---

## Database Schema

### Auth Tables (`001-create-auth-tables.sql`)

Standard NextAuth schema: `users`, `accounts`, `sessions`, `verification_token`.

### App Tables (`002-create-app-tables.sql`)

- **`audit_logs`** — user_id, action (CREATE/UPDATE/DELETE/TOGGLE), resource, details (JSONB), ip_address, created_at
- **`dashboard_preferences`** — user_id (unique), preferences (JSONB), updated_at

### BigQuery Table

- **Dataset:** `traffic_security_logs`
- **Table:** `ivt_classifications`
- **Key fields:** timestamp, source_ip, country_code, ivt_type (GIVT/SIVT/suspicious/clean), confidence_score, user_agent, request_path, rule_matched, action_taken

---

## Image Configuration

Remote patterns in `next.config.ts`:

- `storage.googleapis.com/media-topfinanzas-com/**` — CDN assets
- `lh3.googleusercontent.com` — Google profile avatars

---

## Deployment

- **Target:** GCP Compute Engine or Vercel
- **Process manager:** PM2 (production)
- **Reverse proxy:** Nginx or Apache
- **SSL:** Let's Encrypt (Certbot)
- **Port:** 3080

```bash
# Production deployment (self-hosted)
npm install
npm run build
pm2 start npm --name traffic-genius -- start
```
