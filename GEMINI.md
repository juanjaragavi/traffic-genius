# TrafficGenius

## Project Overview

**TrafficGenius** is a Next.js web application designed as a security overview dashboard for real-time anti-bot security analytics and traffic monitoring. It interfaces closely with Google Cloud Platform (GCP) services, specifically Cloud Armor for security policies and BigQuery for traffic analytics.

The application provides key performance indicators (KPIs) such as total requests, blocked requests, unique IPs, and Invalid Traffic (IVT) detection. It also allows for the management (CRUD operations) of GCP Cloud Armor security policies and rules directly from the dashboard.

## Key Technologies

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn/UI (implied via `lucide-react`, `framer-motion`, and `components/ui` structure)
- **Charts:** Recharts
- **Authentication:** NextAuth.js v5 (Auth.js) using Google OAuth (restricted to `@topnetworks.co` and `@topfinanzas.com` domains) and PostgreSQL via `@auth/pg-adapter`.
- **Cloud Infrastructure (GCP):**
  - `@google-cloud/bigquery`: For fetching traffic summaries and KPIs.
  - `@google-cloud/compute`: For interacting with Cloud Armor security policies.
  - `@google-cloud/logging` & `@google-cloud/error-reporting`: For observability and logging.
- **Database:** PostgreSQL (for authentication sessions and potentially other app tables, as indicated by `scripts/*.sql`).

## Directory Structure

- `app/`: Next.js App Router frontend and API routes.
  - `app/dashboard/`: Main dashboard interface.
  - `app/api/`: Backend API routes for frontend communication.
- `components/`: React components.
  - `components/ui/`: Reusable base UI components.
  - `components/charts/`: Recharts visualization components.
  - `components/dashboard/`: Specific dashboard layout components.
- `lib/`: Shared utility functions and services.
  - `lib/gcp/`: Specific GCP service integrations (BigQuery, Cloud Armor, etc.).
  - `lib/db.ts`: PostgreSQL database connection setup.
- `scripts/`: Contains SQL scripts (`001-create-auth-tables.sql`, `002-create-app-tables.sql`) for setting up the database schema.
- `auth.ts`: Configuration for NextAuth.js.
- `proxy.ts`: Next.js Middleware handling route protection and redirects based on authentication.

## Building and Running

The project relies on standard Next.js npm scripts:

- **Development Server:**
  ```bash
  npm run dev
  # Starts the local development server on port 3080.
  ```
- **Production Build:**
  ```bash
  npm run build
  # Compiles the application for production deployment.
  ```
- **Start Production Server:**
  ```bash
  npm run start
  # Starts the built Next.js application on port 3080.
  ```
- **Linting & Formatting:**
  ```bash
  npm run lint
  npm run format
  ```

## Environment Variables

Based on the codebase, the following environment variables are likely required (typically found in `.env.local` or `.env`):

- `AUTH_GOOGLE_ID`: Client ID for Google OAuth.
- `AUTH_GOOGLE_SECRET`: Client Secret for Google OAuth.
- `GCP_PROJECT_ID`: The Google Cloud Project ID used for BigQuery and Cloud Armor.
- Database connection string (likely `DATABASE_URL` or similar) for the `pg` adapter.

## Git & Deployment Scripts

Three bash scripts in `scripts/` automate all Git and deployment workflows. **Always use these scripts** instead of running raw `git` commands.

| Script | Purpose | Where to Run |
| --- | --- | --- |
| `scripts/git-workflow.sh` | Stage, commit (Conventional Commits), lint, and push | Local machine |
| `scripts/sync-branches.sh` | Synchronize `main` ↔ `dev` branches | Local machine |
| `scripts/deploy_update.sh` | Pull, build, restart PM2 on production server | Production VM |

```bash
# Commit & push with quality gates
./scripts/git-workflow.sh "feat(dashboard): add IVT trend chart"

# Sync branches (default: main → dev)
./scripts/sync-branches.sh

# Production deployment (on the server)
sudo bash ./scripts/deploy_update.sh
```

See `CLAUDE.md` for full usage, options, and examples.

## Development Conventions

- **Authentication:** Routes under `/dashboard` are protected by the middleware (`proxy.ts`), which checks for NextAuth.js session cookies. Users without access are redirected to `/login`.
- **GCP Integration:** Interactions with GCP services are abstracted into the `lib/gcp/` directory, maintaining a clean separation between UI components, API routes, and cloud logic.
