"use client";

/**
 * TrafficGenius — Traffic Area Chart
 *
 * Displays hourly traffic trend (total, blocked, allowed)
 * using Recharts AreaChart. Supports i18n, series toggles,
 * Brush zoom, CSV export, and fullscreen expand.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import type { HourlyDataPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
import ChartActions, {
  SeriesToggle,
  useSeriesVisibility,
} from "@/components/charts/ChartActions";

interface TrafficChartProps {
  data: HourlyDataPoint[];
  title?: string;
}

const SERIES = [
  { key: "total", color: "#2563eb", labelKey: "charts.total" },
  { key: "blocked", color: "#ef4444", labelKey: "charts.blocked" },
  { key: "allowed", color: "#22c55e", labelKey: "charts.allowed" },
];

function TrafficChartInner({
  data,
  height = "100%",
  showBrush = false,
  isVisible,
}: {
  data: HourlyDataPoint[];
  height?: number | `${number}%`;
  showBrush?: boolean;
  isVisible: (key: string) => boolean;
}) {
  const { t } = useTranslation();

  const formatted = data.map((d) => ({
    ...d,
    hour: d.hour.split(" ").pop() || d.hour,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "0.8125rem",
          }}
        />
        {isVisible("total") && (
          <Area
            type="monotone"
            dataKey="total"
            name={t("charts.total")}
            stroke="#2563eb"
            fill="url(#colorTotal)"
            strokeWidth={2}
            animationDuration={600}
          />
        )}
        {isVisible("blocked") && (
          <Area
            type="monotone"
            dataKey="blocked"
            name={t("charts.blocked")}
            stroke="#ef4444"
            fill="url(#colorBlocked)"
            strokeWidth={2}
            animationDuration={600}
          />
        )}
        {isVisible("allowed") && (
          <Area
            type="monotone"
            dataKey="allowed"
            name={t("charts.allowed")}
            stroke="#22c55e"
            fill="url(#colorAllowed)"
            strokeWidth={2}
            animationDuration={600}
          />
        )}
        {showBrush && formatted.length > 6 && (
          <Brush
            dataKey="hour"
            height={28}
            stroke="#2563eb"
            travellerWidth={8}
            fill="#f8fafc"
            tickFormatter={() => ""}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function TrafficChart({ data, title }: TrafficChartProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("charts.trafficTrend");
  const { toggle, isVisible } = useSeriesVisibility([]);

  const exportConfig = {
    filename: "traffic-trend-24h",
    headers: ["Hour", "Total", "Blocked", "Allowed"],
    rows: data.map((d) => [d.hour, d.total, d.blocked, d.allowed]),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {displayTitle}
            <HelpTooltip helpKey="trafficTrend" />
          </span>
          <ChartActions
            exportConfig={exportConfig}
            expandTitle={t("charts.trafficTrendFull")}
            expandContent={
              <TrafficChartInner data={data} showBrush isVisible={isVisible} />
            }
          >
            {SERIES.map((s) => (
              <SeriesToggle
                key={s.key}
                label={t(s.labelKey)}
                color={s.color}
                active={isVisible(s.key)}
                onToggle={() => toggle(s.key)}
              />
            ))}
          </ChartActions>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <TrafficChartInner
            data={data}
            showBrush={data.length > 12}
            isVisible={isVisible}
          />
        </div>
      </CardContent>
    </Card>
  );
}
