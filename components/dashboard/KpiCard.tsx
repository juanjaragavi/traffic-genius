"use client";

/**
 * TrafficGenius — KPI Card Component
 *
 * Displays a single key performance indicator with
 * icon, value, label, and optional trend indicator.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  className?: string;
  iconColor?: string;
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = "text-brand-blue",
}: KpiCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === "up"
      ? "text-red-500"
      : trend?.direction === "down"
        ? "text-green-500"
        : "text-gray-400";

  return (
    <div
      className={cn(
        "card-glass rounded-xl p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-2.5 bg-blue-50/80",
            iconColor.includes("cyan") && "bg-cyan-50/80",
            iconColor.includes("lime") && "bg-lime-50/80",
            iconColor.includes("red") && "bg-red-50/80",
            iconColor.includes("amber") && "bg-amber-50/80",
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>

      {trend && (
        <div className={cn("flex items-center gap-1 mt-3", trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {trend.value > 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs prev period</span>
        </div>
      )}
    </div>
  );
}
