"use client";

/**
 * TrafficGenius — AuditTable Client Component
 *
 * Renders the audit log table with i18n support.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import HelpTooltip from "@/components/dashboard/HelpTooltip";

interface AuditEntry {
  id: number;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ipAddress?: string;
}

interface AuditTableProps {
  logs: AuditEntry[];
  total: number;
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

export default function AuditTable({ logs, total }: AuditTableProps) {
  const { t, locale } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {t("table.ruleChangeHistory")}
            <HelpTooltip helpKey="ruleChangeHistory" />
          </span>
          <span className="text-sm font-normal text-gray-500">
            {t("table.totalEntries", { count: String(total) })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.timestamp")}</TableHead>
              <TableHead>{t("table.user")}</TableHead>
              <TableHead>{t("table.action")}</TableHead>
              <TableHead>{t("table.resource")}</TableHead>
              <TableHead>{t("table.details")}</TableHead>
              <TableHead>{t("table.ipAddress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(entry.createdAt, locale)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {entry.userName || t("table.unknown")}
                    </p>
                    {entry.userEmail && (
                      <p className="text-xs text-gray-500">{entry.userEmail}</p>
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
                <TableCell className="max-w-50">
                  <pre className="text-xs text-gray-500 truncate">
                    {JSON.stringify(entry.details, null, 0).slice(0, 80)}
                  </pre>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">
                  {entry.ipAddress || "—"}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-8"
                >
                  {t("table.noAuditEntries")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
