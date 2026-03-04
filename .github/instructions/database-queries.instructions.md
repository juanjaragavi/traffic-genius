---
description: "Use when writing database queries, SQL statements, or working with lib/db.ts and lib/audit-log.ts. Covers parameterized queries, pg Pool usage, BigQuery query patterns, and type-safe results."
applyTo: "lib/*.ts"
---

# Database & Query Conventions

## PostgreSQL — Always Parameterized

Use `query<T>()` from `lib/db.ts` with positional `$1, $2` params:

```typescript
import { query } from "@/lib/db";

const rows = await query<AuditLogEntry>(
  `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
  [userId, limit],
);
```

**Never** interpolate user input into SQL strings.

## Dynamic WHERE Clauses

Build incrementally with a parameter index counter:

```typescript
let whereClause = "WHERE 1=1";
const params: unknown[] = [];
let paramIdx = 1;

if (action) {
  whereClause += ` AND al.action = $${paramIdx++}`;
  params.push(action);
}
```

## No ORM

Raw SQL via `pg` Pool only. No Prisma, Drizzle, or Knex.

## Type-Safe Results

Always provide a generic type to `query<T>()`:

```typescript
import type { AuditLogEntry } from "@/lib/types";
const rows = await query<AuditLogEntry>(`SELECT ...`, params);
```

## Graceful Failures in Services

Service functions (audit-log, sites) should catch errors and log — not throw:

```typescript
export async function createAuditLog(entry: { ... }): Promise<void> {
  try {
    await query(`INSERT INTO audit_logs ...`, [params]);
  } catch (err) {
    log.error({ err }, "Failed to create audit log");
  }
}
```

## Import Convention

```typescript
import type { AuditLogEntry } from "@/lib/types"; // type imports separate
import { query, getClient } from "@/lib/db";
import { createScopedLogger } from "@/lib/logger";
```
