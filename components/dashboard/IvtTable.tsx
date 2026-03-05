"use client";

/**
 * TrafficGenius — Translated IVT Table
 *
 * Client component that renders the bot detection table
 * with i18n support and proper timestamp formatting.
 */

import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
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
import { formatDateTime } from "@/lib/utils";
import type { IvtRecord } from "@/lib/types";

function ivtBadgeVariant(type: string) {
  switch (type) {
    case "GIVT":
      return "destructive" as const;
    case "SIVT":
      return "warning" as const;
    case "suspicious":
      return "warning" as const;
    case "clean":
      return "success" as const;
    default:
      return "secondary" as const;
  }
}

interface IvtTableProps {
  records: IvtRecord[];
  total: number;
}

export default function IvtTable({ records, total }: IvtTableProps) {
  const { t, locale } = useTranslation();

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {t("table.recentClassifications")}
            <HelpTooltip helpKey="recentClassifications" />
          </span>
          <span className="text-sm font-normal text-gray-500">
            {t("table.totalRecords", { count: total })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.timestamp")}</TableHead>
              <TableHead>{t("table.sourceIp")}</TableHead>
              <TableHead>{t("table.country")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.confidence")}</TableHead>
              <TableHead>{t("table.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(record.timestamp, locale)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {record.source_ip}
                </TableCell>
                <TableCell>{record.country_code}</TableCell>
                <TableCell>
                  <Badge variant={ivtBadgeVariant(record.ivt_type)}>
                    {t(`ivtTypes.${record.ivt_type}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${record.confidence_score * 100}%`,
                          backgroundColor:
                            record.confidence_score > 0.8
                              ? "#ef4444"
                              : record.confidence_score > 0.5
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {(record.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.action_taken === "allow"
                        ? "success"
                        : "destructive"
                    }
                  >
                    {record.action_taken}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-8"
                >
                  {t("table.noIvtRecords")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
