"use client";

/**
 * TrafficGenius — IVT Type Pie Chart
 *
 * Shows distribution of IVT types (GIVT, SIVT, suspicious, clean).
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { IvtTypeSummary } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function IvtPieChart({
  data,
  title = "IVT Distribution",
}: IvtPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.type,
    value: d.count,
    color: COLORS[d.type] || COLORS.default,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "0.8125rem" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
