---
description: "Use when creating or modifying GCP service modules (BigQuery, Cloud Armor, Cloud Logging, Cloud DNS). Covers lazy singleton clients, safe error defaults, scoped logging, and environment variable patterns."
applyTo: "lib/gcp/**/*.ts"
---

# GCP Service Module Conventions

## Lazy Singleton Client

Every module must use a private nullable client with a `getClient()` factory:

```typescript
let _client: BigQuery | null = null;

function getClient(): BigQuery {
  if (!_client) {
    _client = new BigQuery({ projectId: PROJECT });
  }
  return _client;
}
```

## Environment Variables at Module Top

```typescript
const PROJECT = process.env.GCP_PROJECT_ID!;
const DATASET = process.env.BIGQUERY_DATASET!;
const TABLE = process.env.BIGQUERY_TABLE!;
```

## Safe Error Defaults — Never Throw

Exported functions must catch errors and return safe defaults:

```typescript
// ✅ Return empty array on failure
export async function listPolicies(): Promise<SecurityPolicy[]> {
  try {
    const client = getClient();
    const [response] = await client.list({ project: PROJECT });
    return (response ?? []).map(mapRule);
  } catch (err) {
    log.error({ err }, "Failed to list security policies");
    return [];
  }
}
```

Safe defaults: `[]` for arrays, `null` for single items, `false` for booleans, `{ total: 0 }` for counts.

## Scoped Logger — PascalCase Module Name

```typescript
import { createScopedLogger } from "@/lib/logger";
const log = createScopedLogger("CloudArmor");
```

## Type Imports

All return types must reference interfaces from `lib/types.ts`:

```typescript
import type { SecurityPolicy, SecurityRule } from "@/lib/types";
```
