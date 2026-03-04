/**
 * TrafficGenius — Audit Log Page
 *
 * Displays history of all Cloud Armor rule changes
 * from the PostgreSQL audit_logs table.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLogs } from "@/lib/audit-log";
import { formatDateTime } from "@/lib/utils";

function AuditSkeleton() {
  return <Skeleton className="h-[500px] rounded-xl" />;
}

function actionBadge(action: string) {
  switch (action) {
    case "CREATE":
      return "success" as const;
    case "UPDATE":
      return "default" as const;
    case "DELETE":
      return "destructive" as const;
    case "TOGGLE":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

async function AuditContent() {
  const { logs, total } = await getAuditLogs({ limit: 100 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Rule Change History</span>
          <span className="text-sm font-normal text-gray-400">
            {total} total entries
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {entry.userName || "Unknown"}
                    </p>
                    {entry.userEmail && (
                      <p className="text-xs text-gray-400">{entry.userEmail}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={actionBadge(entry.action)}>
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-600">
                  {entry.resource}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <pre className="text-xs text-gray-500 truncate">
                    {JSON.stringify(entry.details, null, 0).slice(0, 80)}
                  </pre>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-400">
                  {entry.ipAddress || "—"}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-8"
                >
                  No audit log entries yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Audit Log
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete history of all security rule modifications
        </p>
      </div>

      <Suspense fallback={<AuditSkeleton />}>
        <AuditContent />
      </Suspense>
    </div>
  );
}
