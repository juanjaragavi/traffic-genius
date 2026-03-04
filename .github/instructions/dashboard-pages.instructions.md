---
description: "Use when creating or modifying dashboard pages in app/dashboard/. Covers Server Components, Suspense with skeleton fallbacks, parallel data fetching with Promise.all, and async searchParams/params in Next.js 16."
applyTo: "app/dashboard/**/*.tsx"
---

# Dashboard Page Conventions

## Server Components by Default

Dashboard pages are Server Components — fetch data server-side, not via client-side API calls.

## Page Structure

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// 1. Skeleton fallback
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-30 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// 2. Async content component — all fetches here
async function PageContent() {
  const [kpis, traffic, policies] = await Promise.all([
    getDashboardKpis(),
    getTrafficSummary(24),
    listPolicies(),
  ]);

  return (/* render with data */);
}

// 3. Page exports Suspense wrapper
export default async function Page({ searchParams }: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId } = await searchParams;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

## Key Rules

- **`Promise.all()`** for parallel data fetching — never sequential awaits
- **`searchParams` and `params` are Promises** in Next.js 16 — always `await`
- **Suspense + Skeleton** for every async page section
- **No `"use client"` in page files** — delegate interactivity to child components
- **Metadata** via `export const metadata: Metadata = { title: "..." }`
