/**
 * TrafficGenius — Dashboard Overview Page
 *
 * Displays KPI cards, traffic trend chart, IVT pie chart,
 * and top countries. Data fetched from API routes.
 * Supports site filtering via ?siteId= query parameter.
 */

import { Suspense } from "react";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficChart from "@/components/charts/TrafficChart";
import IvtPieChart from "@/components/charts/IvtPieChart";
import CountryChart from "@/components/charts/CountryChart";
import SiteSelector from "@/components/dashboard/SiteSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardKpis } from "@/lib/gcp/bigquery";
import { getTrafficSummary } from "@/lib/gcp/bigquery";
import { listPolicies } from "@/lib/gcp/cloud-armor";
import { getActiveSites, getSiteById } from "@/lib/sites";
import { formatNumber, formatPercent } from "@/lib/utils";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Requests (24h)"
          value={formatNumber(enrichedKpis.totalRequests24h)}
          icon="Activity"
          iconColor="text-brand-blue"
        />
        <KpiCard
          label="Blocked Requests"
          value={formatNumber(enrichedKpis.blockedRequests24h)}
          icon="Shield"
          iconColor="text-red-500"
        />
        <KpiCard
          label="Block Rate"
          value={formatPercent(enrichedKpis.blockRate)}
          icon="AlertTriangle"
          iconColor="text-amber-500"
        />
        <KpiCard
          label="Unique IPs"
          value={formatNumber(enrichedKpis.uniqueIps24h)}
          icon="Globe"
          iconColor="text-brand-cyan"
        />
        <KpiCard
          label="Active Policies"
          value={enrichedKpis.activePolicies}
          icon="Layers"
          iconColor="text-brand-blue"
        />
        <KpiCard
          label="Total Rules"
          value={enrichedKpis.totalRules}
          icon="Crosshair"
          iconColor="text-brand-cyan"
        />
        <KpiCard
          label="IVT Detected"
          value={formatNumber(enrichedKpis.ivtDetected24h)}
          icon="Bug"
          iconColor="text-red-500"
        />
        <KpiCard
          label="Top Attack Vector"
          value={enrichedKpis.topAttackVector}
          icon="Users"
          iconColor="text-amber-500"
          description="Most matched rule"
        />
      </div>

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Security Overview
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time anti-bot security analytics and traffic monitoring
        </p>
      </div>

      {/* Suspense-wrapped data section */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent siteId={siteId} />
      </Suspense>
    </div>
  );
}
