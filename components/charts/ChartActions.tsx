"use client";

/**
 * TrafficGenius — Chart Actions Toolbar
 *
 * Google Analytics-inspired toolbar for chart cards.
 * Provides: series visibility toggles, CSV export, and fullscreen expand.
 */

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Download, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

/* ─── CSV Export ─── */

interface ExportConfig {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

function downloadCsv({ filename, headers, rows }: ExportConfig) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Series Toggle Button ─── */

interface SeriesToggleProps {
  label: string;
  color: string;
  active: boolean;
  onToggle: () => void;
}

export function SeriesToggle({
  label,
  color,
  active,
  onToggle,
}: SeriesToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border",
        active
          ? "bg-white shadow-sm border-gray-200 text-gray-700"
          : "bg-gray-50 border-gray-100 text-gray-400 line-through",
      )}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
        style={{
          backgroundColor: color,
          opacity: active ? 1 : 0.3,
        }}
      />
      {label}
    </button>
  );
}

/* ─── Fullscreen Overlay ─── */

interface FullscreenOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function FullscreenOverlay({
  open,
  onClose,
  title,
  children,
}: FullscreenOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Chart area */}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Chart Actions Bar ─── */

interface ChartActionsProps {
  /** CSV export configuration. Pass null to hide the export button. */
  exportConfig?: ExportConfig | null;
  /** Fullscreen chart title. Pass null to hide the expand button. */
  expandTitle?: string | null;
  /** Content rendered in fullscreen overlay. Usually the same chart at larger size. */
  expandContent?: ReactNode;
  /** Extra elements rendered before action buttons (e.g. SeriesToggle pills). */
  children?: ReactNode;
}

export default function ChartActions({
  exportConfig,
  expandTitle,
  expandContent,
  children,
}: ChartActionsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleExport = useCallback(() => {
    if (exportConfig) downloadCsv(exportConfig);
  }, [exportConfig]);

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {children}

        {exportConfig && (
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title={t("chartActions.export")}
            aria-label={t("chartActions.export")}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {expandTitle && expandContent && (
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title={t("chartActions.expand")}
            aria-label={t("chartActions.expand")}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <FullscreenOverlay
        open={expanded}
        onClose={() => setExpanded(false)}
        title={expandTitle ?? ""}
      >
        {expandContent}
      </FullscreenOverlay>
    </>
  );
}

/* ─── Hook: Series Visibility Manager ─── */

export function useSeriesVisibility(seriesKeys: string[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isVisible = useCallback((key: string) => !hidden.has(key), [hidden]);

  return { hidden, toggle, isVisible };
}
