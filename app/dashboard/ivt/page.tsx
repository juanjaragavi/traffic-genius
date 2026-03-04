/**
 * TrafficGenius — IVT Detection Page
 *
 * Table of IVT-classified records from BigQuery
 * with type distribution chart.
 * Supports site filtering via ?siteId= query parameter.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import IvtPieChart from "@/components/charts/IvtPieChart";
import SiteSelector from "@/components/dashboard/SiteSelector";
import { getIvtRecords, getTrafficSummary } from "@/lib/gcp/bigquery";
import { getActiveSites, getSiteById } from "@/lib/sites";
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

function IvtSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-125 rounded-xl" />
        </div>
        <Skeleton className="h-95 rounded-xl" />
      </div>
    </div>
  );
}

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

async function IvtContent({ siteId }: { siteId?: number }) {
  const [ivtData, summary, sites] = await Promise.all([
    getIvtRecords({ limit: 50, hoursAgo: 24 }),
    getTrafficSummary(24),
    getActiveSites(),
  ]);

  const selectedSite = siteId ? await getSiteById(siteId) : null;

  return (
    <div className="space-y-6">
      {/* Site Filter */}
      <SiteSelector sites={sites} currentSiteId={siteId ?? null} />

      {selectedSite && (
        <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-2.5 text-sm text-brand-blue">
          Filtering IVT data for{" "}
          <span className="font-semibold">{selectedSite.label}</span>{" "}
          <span className="text-blue-400">({selectedSite.domain})</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IVT Records Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Recent IVT Classifications</span>
              <span className="text-sm font-normal text-gray-400">
                {ivtData.total} total records (24h)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ivtData.records.map((record, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(record.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.source_ip}
                    </TableCell>
                    <TableCell>{record.country_code}</TableCell>
                    <TableCell>
                      <Badge variant={ivtBadgeVariant(record.ivt_type)}>
                        {record.ivt_type}
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
                {ivtData.records.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-400 py-8"
                    >
                      No IVT records found in the last 24 hours
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* IVT Distribution Chart */}
        <IvtPieChart data={summary.topIvtTypes} />
      </div>
    </div>
  );
}

export default async function IvtPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId: siteIdParam } = await searchParams;
  const siteId = siteIdParam ? Number(siteIdParam) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          IVT Detection
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Invalid Traffic classifications from BigQuery analytics pipeline
        </p>
      </div>

      <Suspense fallback={<IvtSkeleton />}>
        <IvtContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
