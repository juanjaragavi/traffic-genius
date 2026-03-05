/**
 * TrafficGenius — Bot Detection Page
 *
 * Table of bot-classified records from BigQuery
 * with type distribution chart.
 * Supports site filtering via ?siteId= query parameter.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import IvtPieChart from "@/components/charts/IvtPieChart";
import SiteSelector from "@/components/dashboard/SiteSelector";
import IvtTable from "@/components/dashboard/IvtTable";
import PageHeader from "@/components/dashboard/PageHeader";
import { getIvtRecords, getTrafficSummary } from "@/lib/gcp/bigquery";
import { getActiveSites, getSiteById } from "@/lib/sites";

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

async function IvtContent({ siteId }: { siteId?: number }) {
  const [ivtData, summary, sites] = await Promise.all([
    getIvtRecords({ limit: 50, hoursAgo: 24 }),
    getTrafficSummary(24),
    getActiveSites(),
  ]);

  const selectedSite = siteId ? await getSiteById(siteId) : null;

  // Serialize records for client component (handle BigQuery timestamp objects)
  // BigQuery may return { value: "2026-..." } objects despite the string type
  const serializedRecords = ivtData.records.map((record) => {
    let tsString = record.timestamp;
    if (typeof record.timestamp === "object" && record.timestamp !== null) {
      const obj = record.timestamp as unknown as Record<string, unknown>;
      tsString = String(obj.value ?? record.timestamp);
    }
    return { ...record, timestamp: tsString };
  });

  return (
    <div className="space-y-6">
      {/* Site Filter */}
      <SiteSelector sites={sites} currentSiteId={siteId ?? null} />

      {selectedSite && (
        <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-2.5 text-sm text-brand-blue">
          <span className="font-semibold">{selectedSite.label}</span>{" "}
          <span className="text-blue-400">({selectedSite.domain})</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IVT Records Table */}
        <IvtTable records={serializedRecords} total={ivtData.total} />

        {/* Bot Distribution Chart */}
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
      <PageHeader
        titleKey="pages.botDetection.title"
        subtitleKey="pages.botDetection.subtitle"
      />

      <Suspense fallback={<IvtSkeleton />}>
        <IvtContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
