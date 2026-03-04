/**
 * TrafficGenius — Traffic Analysis Page
 *
 * Detailed traffic analytics with time-range controls,
 * trend charts, and country breakdown.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import TrafficChart from "@/components/charts/TrafficChart";
import CountryChart from "@/components/charts/CountryChart";
import { getTrafficSummary } from "@/lib/gcp/bigquery";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TrafficSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[380px] rounded-xl" />
      <Skeleton className="h-[380px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}

async function TrafficContent() {
  const summary = await getTrafficSummary(24);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold mt-1">
              {formatNumber(summary.totalRequests)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Blocked</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatNumber(summary.blockedRequests)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">IVT Rate</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatPercent(summary.ivtPercentage)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Trend */}
      <TrafficChart
        data={summary.hourlyTrend}
        title="Traffic Trend — Last 24 Hours"
      />

      {/* Country Breakdown */}
      <CountryChart data={summary.topCountries} />

      {/* Country Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Country Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Blocked</TableHead>
                <TableHead className="text-right">Block Rate</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.topCountries.map((c) => (
                <TableRow key={c.country}>
                  <TableCell className="font-medium">{c.country}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(c.requests)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatNumber(c.blocked)}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.requests > 0
                      ? formatPercent((c.blocked / c.requests) * 100)
                      : "0%"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(c.percentage)}
                  </TableCell>
                </TableRow>
              ))}
              {summary.topCountries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-400 py-8"
                  >
                    No traffic data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrafficPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Traffic Analysis
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Detailed traffic breakdown by country, volume, and block rates
        </p>
      </div>

      <Suspense fallback={<TrafficSkeleton />}>
        <TrafficContent />
      </Suspense>
    </div>
  );
}
