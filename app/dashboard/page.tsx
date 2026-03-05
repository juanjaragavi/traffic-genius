/**
 * TrafficGenius — Dashboard Overview Page
 *
 * Displays KPI cards, traffic trend chart, IVT pie chart,
 * and top countries. Data fetched from API routes.
 * Supports site filtering via ?siteId= query parameter.
 */

import { Suspense } from "react";
import TrafficChart from "@/components/charts/TrafficChart";
import IvtPieChart from "@/components/charts/IvtPieChart";
import CountryChart from "@/components/charts/CountryChart";
import SiteSelector from "@/components/dashboard/SiteSelector";
import OverviewKpis from "@/components/dashboard/OverviewKpis";
import PageHeader from "@/components/dashboard/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardKpis } from "@/lib/gcp/bigquery";
import { getTrafficSummary } from "@/lib/gcp/bigquery";
import { listPolicies } from "@/lib/gcp/cloud-armor";
import { getActiveSites, getSiteById } from "@/lib/sites";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-30 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-100 rounded-xl" />
        <Skeleton className="h-100 rounded-xl" />
      </div>
    </div>
  );
}

async function DashboardContent({ siteId }: { siteId?: number }) {
  const [kpis, summary, policies, sites] = await Promise.all([
    getDashboardKpis(),
    getTrafficSummary(24),
    listPolicies(),
    getActiveSites(),
  ]);

  // Resolve selected site for display
  const selectedSite = siteId ? await getSiteById(siteId) : null;

  // Enrich KPIs with Cloud Armor data
  const totalRules = policies.reduce((acc, p) => acc + p.rules.length, 0);
  const enrichedKpis = {
    ...kpis,
    activePolicies: policies.length,
    totalRules,
  };

  return (
    <div className="space-y-6">
      {/* Site Filter */}
      <SiteSelector sites={sites} currentSiteId={siteId ?? null} />

      {selectedSite && (
        <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-2.5 text-sm text-brand-blue">
          Showing data for{" "}
          <span className="font-semibold">{selectedSite.label}</span>{" "}
          <span className="text-blue-400">({selectedSite.domain})</span>
        </div>
      )}

      {/* KPI Grid */}
      <OverviewKpis
        totalRequests24h={enrichedKpis.totalRequests24h}
        blockedRequests24h={enrichedKpis.blockedRequests24h}
        blockRate={enrichedKpis.blockRate}
        uniqueIps24h={enrichedKpis.uniqueIps24h}
        activePolicies={enrichedKpis.activePolicies}
        totalRules={enrichedKpis.totalRules}
        ivtDetected24h={enrichedKpis.ivtDetected24h}
        topAttackVector={enrichedKpis.topAttackVector}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={summary.hourlyTrend} />
        <IvtPieChart data={summary.topIvtTypes} />
      </div>

      {/* Country Chart */}
      <CountryChart data={summary.topCountries} />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { siteId: siteIdParam } = await searchParams;
  const siteId = siteIdParam ? Number(siteIdParam) : undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        titleKey="pages.overview.title"
        subtitleKey="pages.overview.subtitle"
      />

      {/* Suspense-wrapped data section */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
