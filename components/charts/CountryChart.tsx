"use client";

/**
 * TrafficGenius — Top Countries Bar Chart
 *
 * Horizontal bar chart showing top traffic source countries.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CountryTraffic } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CountryChartProps {
  data: CountryTraffic[];
  title?: string;
}

export default function CountryChart({
  data,
  title = "Top Countries by Traffic",
}: CountryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "0.8125rem" }}
              />
              <Bar
                dataKey="requests"
                name="Total"
                fill="#2563eb"
                radius={[0, 4, 4, 0]}
                barSize={18}
              />
              <Bar
                dataKey="blocked"
                name="Blocked"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
