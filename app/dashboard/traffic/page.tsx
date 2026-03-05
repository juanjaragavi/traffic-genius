/**
 * TrafficGenius — Traffic Analysis Page
 *
 * Detailed traffic analytics with time-range controls,
 * trend charts, and country breakdown.
 * Supports site filtering via ?siteId= query parameter.
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import TrafficChart from "@/components/charts/TrafficChart";
import CountryChart from "@/components/charts/CountryChart";
import SiteSelector from "@/components/dashboard/SiteSelector";
import PageHeader from "@/components/dashboard/PageHeader";
import { TrafficKpis, CountryTable } from "@/components/dashboard/TrafficStats";
import { getTrafficSummary } from "@/lib/gcp/bigquery";
import { getActiveSites, getSiteById } from "@/lib/sites";

function TrafficSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-95 rounded-xl" />
      <Skeleton className="h-95 rounded-xl" />
      <Skeleton className="h-95 rounded-xl" />
    </div>
  );
}

async function TrafficContent({ siteId }: { siteId?: number }) {
  const [summary, sites] = await Promise.all([
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
          <span className="font-semibold">{selectedSite.label}</span>{" "}
          <span className="text-blue-400">({selectedSite.domain})</span>
        </div>
      )}

      {/* Overview Stats */}
      <TrafficKpis
        totalRequests={summary.totalRequests}
        blockedRequests={summary.blockedRequests}
        ivtPercentage={summary.ivtPercentage}
      />

      {/* Traffic Trend */}
      <TrafficChart data={summary.hourlyTrend} />

      {/* Country Breakdown */}
      <CountryChart data={summary.topCountries} />

      {/* Country Table */}
      <CountryTable countries={summary.topCountries} />
    </div>
  );
}

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId: siteIdParam } = await searchParams;
  const siteId = siteIdParam ? Number(siteIdParam) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.traffic.title"
        subtitleKey="pages.traffic.subtitle"
      />

      <Suspense fallback={<TrafficSkeleton />}>
        <TrafficContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
