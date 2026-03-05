"use client";

/**
 * TrafficGenius — Top Countries Bar Chart
 *
 * Horizontal bar chart showing top traffic source countries.
 * Features series toggles, CSV export, and fullscreen expand.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CountryTraffic } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
import ChartActions, {
  SeriesToggle,
  useSeriesVisibility,
} from "@/components/charts/ChartActions";

interface CountryChartProps {
  data: CountryTraffic[];
  title?: string;
}

const SERIES = [
  { key: "requests", color: "#2563eb", labelKey: "charts.total" },
  { key: "blocked", color: "#ef4444", labelKey: "charts.blocked" },
];

function CountryChartInner({
  data,
  height = "100%",
  isVisible,
  t,
}: {
  data: CountryTraffic[];
  height?: number | `${number}%`;
  isVisible: (key: string) => boolean;
  t: (key: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
          }
        />
        <YAxis
          type="category"
          dataKey="country"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "0.8125rem",
          }}
        />
        {isVisible("requests") && (
          <Bar
            dataKey="requests"
            name={t("charts.total")}
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
            barSize={18}
            animationDuration={500}
          />
        )}
        {isVisible("blocked") && (
          <Bar
            dataKey="blocked"
            name={t("charts.blocked")}
            fill="#ef4444"
            radius={[0, 4, 4, 0]}
            barSize={18}
            animationDuration={500}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CountryChart({ data, title }: CountryChartProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("charts.topCountries");
  const { toggle, isVisible } = useSeriesVisibility([]);

  const exportConfig = {
    filename: "top-countries-traffic",
    headers: ["Country", "Total Requests", "Blocked"],
    rows: data.map((d) => [d.country, d.requests, d.blocked]),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {displayTitle}
            <HelpTooltip helpKey="topCountries" />
          </span>
          <ChartActions
            exportConfig={exportConfig}
            expandTitle={displayTitle}
            expandContent={
              <CountryChartInner data={data} isVisible={isVisible} t={t} />
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
          <CountryChartInner data={data} isVisible={isVisible} t={t} />
        </div>
      </CardContent>
    </Card>
  );
}
