---
description: "Use when creating or modifying API route handlers in app/api/. Covers auth guards, audit logging, error handling, request validation, and route param patterns for Next.js 16."
applyTo: "app/api/**/*.ts"
---

# API Route Conventions

## Auth Guard — Always First

Every handler must check the session before any other logic:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## Route Params Are Async (Next.js 16)

```typescript
type RouteParams = { params: Promise<{ policyName: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { policyName } = await params;
}
```

## Handler Structure

```
1. Auth check → 401 if missing
2. try {
3.   Parse & validate body → 400 if invalid
4.   Execute action (GCP, DB)
5.   Audit log via createAuditLog()
6.   log.info() success
7.   Return JSON with status
8. } catch {
9.   log.error({ error }, "message")
10.  Return 500
11. }
```

## Audit Trail — Every Mutation

POST/PATCH/DELETE must call `createAuditLog()` with action, resource, details, and IP:

```typescript
await createAuditLog({
  userId: Number(session.user.id),
  action: "CREATE", // CREATE | UPDATE | DELETE | TOGGLE
  resource: `cloud-armor/${policyName}/rules/${priority}`,
  details: { priority, action, match },
  ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0],
});
```

## Logger — Never console.log

```typescript
import { createScopedLogger } from "@/lib/logger";
const logger = createScopedLogger("api:cloud-armor");
```

Use `api:<domain>` namespace for route loggers.
