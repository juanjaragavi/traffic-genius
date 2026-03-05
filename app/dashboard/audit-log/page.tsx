/**
 * TrafficGenius — Audit Log Page
 *
 * Displays history of all security rule changes
 * from the PostgreSQL audit_logs table.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditLogs } from "@/lib/audit-log";
import PageHeader from "@/components/dashboard/PageHeader";
import AuditTable from "@/components/dashboard/AuditTable";

function AuditSkeleton() {
  return <Skeleton className="h-125 rounded-xl" />;
}

async function AuditContent() {
  const { logs, total } = await getAuditLogs({ limit: 100 });

  // Serialize timestamps for client component
  const serializedLogs = logs.map((entry) => ({
    id: entry.id,
    createdAt:
      typeof entry.createdAt === "object" && entry.createdAt !== null
        ? (((entry.createdAt as Record<string, unknown>).value as string) ??
          String(entry.createdAt))
        : String(entry.createdAt ?? ""),
    userName: entry.userName,
    userEmail: entry.userEmail,
    action: entry.action,
    resource: entry.resource,
    details: entry.details,
    ipAddress: entry.ipAddress,
  }));

  return <AuditTable logs={serializedLogs} total={total} />;
}

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.auditLog.title"
        subtitleKey="pages.auditLog.subtitle"
      />

      <Suspense fallback={<AuditSkeleton />}>
        <AuditContent />
      </Suspense>
    </div>
  );
}
