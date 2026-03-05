"use client";

/**
 * TrafficGenius — Translated KPI Grid for Overview
 *
 * Client wrapper that renders KPI cards with translated labels
 * and help tooltips. Receives pre-fetched data from the server component.
 */

import KpiCard from "@/components/dashboard/KpiCard";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
import { useTranslation } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

interface OverviewKpisProps {
  totalRequests24h: number;
  blockedRequests24h: number;
  blockRate: number;
  uniqueIps24h: number;
  activePolicies: number;
  totalRules: number;
  ivtDetected24h: number;
  topAttackVector: string;
}

export default function OverviewKpis(props: OverviewKpisProps) {
  const { t } = useTranslation();

  const kpis = [
    {
      label: t("kpi.totalRequests"),
      value: formatNumber(props.totalRequests24h),
      icon: "Activity",
      iconColor: "text-brand-blue",
      helpKey: "totalRequests",
    },
    {
      label: t("kpi.blockedRequests"),
      value: formatNumber(props.blockedRequests24h),
      icon: "Shield",
      iconColor: "text-red-500",
      helpKey: "blockedRequests",
    },
    {
      label: t("kpi.blockRate"),
      value: formatPercent(props.blockRate),
      icon: "AlertTriangle",
      iconColor: "text-amber-500",
      helpKey: "blockRate",
    },
    {
      label: t("kpi.uniqueIps"),
      value: formatNumber(props.uniqueIps24h),
      icon: "Globe",
      iconColor: "text-brand-cyan",
      helpKey: "uniqueIps",
    },
    {
      label: t("kpi.activePolicies"),
      value: props.activePolicies,
      icon: "Layers",
      iconColor: "text-brand-blue",
      helpKey: "activePolicies",
    },
    {
      label: t("kpi.totalRules"),
      value: props.totalRules,
      icon: "Crosshair",
      iconColor: "text-brand-cyan",
      helpKey: "totalRules",
    },
    {
      label: t("kpi.ivtDetected"),
      value: formatNumber(props.ivtDetected24h),
      icon: "Bug",
      iconColor: "text-red-500",
      helpKey: "ivtDetected",
    },
    {
      label: t("kpi.topAttackVector"),
      value: props.topAttackVector,
      icon: "Users",
      iconColor: "text-amber-500",
      description: t("kpi.topAttackVectorDescription"),
      helpKey: "topAttackVector",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.helpKey} className="relative">
          <KpiCard
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            description={kpi.description}
          />
          <div className="absolute top-3 right-12">
            <HelpTooltip helpKey={kpi.helpKey} />
          </div>
        </div>
      ))}
    </div>
  );
}
