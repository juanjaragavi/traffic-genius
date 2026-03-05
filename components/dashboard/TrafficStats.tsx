"use client";

/**
 * TrafficGenius — Translated Traffic Stats
 *
 * Client wrapper for the traffic page KPI cards and country table
 * with i18n support and help tooltips.
 */

import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { CountryTraffic } from "@/lib/types";

interface TrafficStatsProps {
  totalRequests: number;
  blockedRequests: number;
  ivtPercentage: number;
}

export function TrafficKpis({
  totalRequests,
  blockedRequests,
  ivtPercentage,
}: TrafficStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {t("kpi.totalRequestsShort")}
            </p>
            <HelpTooltip helpKey="totalRequests" />
          </div>
          <p className="text-2xl font-bold mt-1">
            {formatNumber(totalRequests)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{t("kpi.blocked")}</p>
            <HelpTooltip helpKey="blockedRequests" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatNumber(blockedRequests)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{t("kpi.botTrafficRate")}</p>
            <HelpTooltip helpKey="botTrafficRate" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatPercent(ivtPercentage)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface CountryTableProps {
  countries: CountryTraffic[];
}

export function CountryTable({ countries }: CountryTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {t("table.countryDetails")}
          <HelpTooltip helpKey="countryDetails" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.country")}</TableHead>
              <TableHead className="text-right">
                {t("table.requests")}
              </TableHead>
              <TableHead className="text-right">
                {t("charts.blocked")}
              </TableHead>
              <TableHead className="text-right">
                {t("table.blockRate")}
              </TableHead>
              <TableHead className="text-right">
                {t("table.percentOfTotal")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((c) => (
              <TableRow key={c.country}>
                <TableCell className="font-medium">{c.country}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(c.requests)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {formatNumber(c.blocked)}
                </TableCell>
                <TableCell className="text-right">
                  {c.requests > 0
                    ? formatPercent((c.blocked / c.requests) * 100)
                    : "0%"}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(c.percentage)}
                </TableCell>
              </TableRow>
            ))}
            {countries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-8"
                >
                  {t("table.noTrafficData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
