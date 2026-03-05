"use client";

/**
 * TrafficGenius — Bot Distribution Pie Chart
 *
 * Shows distribution of bot traffic types with i18n labels,
 * interactive legend, CSV export, and fullscreen expand.
 */

import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { IvtTypeSummary } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
import ChartActions from "@/components/charts/ChartActions";

const COLORS: Record<string, string> = {
  GIVT: "#ef4444",
  SIVT: "#ea580c",
  suspicious: "#f59e0b",
  clean: "#22c55e",
  default: "#6b7280",
};

interface IvtPieChartProps {
  data: IvtTypeSummary[];
  title?: string;
}

function PieChartInner({
  chartData,
  highlightIndex,
  height = "100%",
}: {
  chartData: { name: string; value: number; color: string }[];
  highlightIndex: number | null;
  height?: number | `${number}%`;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
          labelLine={false}
          animationDuration={500}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              opacity={
                highlightIndex === null || highlightIndex === index ? 1 : 0.35
              }
              stroke={highlightIndex === index ? entry.color : "transparent"}
              strokeWidth={highlightIndex === index ? 3 : 0}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) =>
            new Intl.NumberFormat("en-US").format(value ?? 0)
          }
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "0.8125rem",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function IvtPieChart({ data, title }: IvtPieChartProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("charts.botDistribution");
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const chartData = data.map((d) => ({
    name: t(`ivtTypes.${d.type}`),
    value: d.count,
    color: COLORS[d.type] || COLORS.default,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const exportConfig = {
    filename: "bot-distribution",
    headers: ["Type", "Count", "Percentage"],
    rows: data.map((d) => [
      t(`ivtTypes.${d.type}`),
      d.count,
      total > 0 ? `${((d.count / total) * 100).toFixed(1)}%` : "0%",
    ]),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {displayTitle}
            <HelpTooltip helpKey="botDistribution" />
          </span>
          <ChartActions
            exportConfig={exportConfig}
            expandTitle={displayTitle}
            expandContent={
              <PieChartInner
                chartData={chartData}
                highlightIndex={highlightIndex}
              />
            }
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Interactive Color Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {chartData.map((entry, i) => {
            const pct =
              total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
            return (
              <button
                key={entry.name}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseLeave={() => setHighlightIndex(null)}
                onClick={() =>
                  setHighlightIndex((prev) => (prev === i ? null : i))
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all ${
                  highlightIndex === null || highlightIndex === i
                    ? "bg-white shadow-sm border-gray-200 text-gray-700"
                    : "bg-gray-50 border-gray-100 text-gray-400"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
                <span className="text-gray-400 font-normal">({pct}%)</span>
              </button>
            );
          })}
        </div>
        <div className="h-65">
          <PieChartInner
            chartData={chartData}
            highlightIndex={highlightIndex}
          />
        </div>
      </CardContent>
    </Card>
  );
}
