"use client";

/**
 * TrafficGenius — Traffic Area Chart
 *
 * Displays hourly traffic trend (total, blocked, allowed)
 * using Recharts AreaChart.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HourlyDataPoint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TrafficChartProps {
  data: HourlyDataPoint[];
  title?: string;
}

export default function TrafficChart({
  data,
  title = "Traffic Trend (24h)",
}: TrafficChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    hour: d.hour.split(" ").pop() || d.hour, // Show only time portion
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "0.8125rem" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#2563eb"
                fill="url(#colorTotal)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="blocked"
                name="Blocked"
                stroke="#ef4444"
                fill="url(#colorBlocked)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="allowed"
                name="Allowed"
                stroke="#22c55e"
                fill="url(#colorAllowed)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
