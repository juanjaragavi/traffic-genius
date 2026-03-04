"use client";

/**
 * TrafficGenius — Site Selector Component
 *
 * Dropdown filter that lets users scope dashboard data
 * to a specific monitored site. Used on Overview, Traffic,
 * and IVT Detection pages.
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Globe, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Site } from "@/lib/types";

interface SiteSelectorProps {
  sites: Site[];
  /** Current site ID from searchParams (server-provided) */
  currentSiteId?: number | null;
  className?: string;
}

export default function SiteSelector({
  sites,
  currentSiteId,
  className,
}: SiteSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeSites = sites.filter((s) => s.status === "active");
  const selectedSite = activeSites.find((s) => s.id === currentSiteId) ?? null;

  const handleSelect = useCallback(
    (siteId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (siteId) {
        params.set("siteId", String(siteId));
      } else {
        params.delete("siteId");
      }
      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [router, pathname, searchParams],
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
          selectedSite
            ? "bg-blue-50/80 border-blue-200 text-brand-blue"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300",
        )}
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-45">
          {selectedSite ? selectedSite.label : "All Sites"}
        </span>
        {selectedSite ? (
          <X
            className="w-3.5 h-3.5 shrink-0 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null);
            }}
          />
        ) : (
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
          {/* All Sites option */}
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
              !selectedSite
                ? "bg-blue-50 text-brand-blue font-medium"
                : "text-gray-700 hover:bg-gray-50",
            )}
            onClick={() => handleSelect(null)}
          >
            <Globe className="w-4 h-4 text-gray-400" />
            <div>
              <div>All Sites</div>
              <div className="text-xs text-gray-400">Show aggregated data</div>
            </div>
          </button>

          <div className="border-t border-gray-100 my-1" />

          {activeSites.map((site) => (
            <button
              key={site.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                selectedSite?.id === site.id
                  ? "bg-blue-50 text-brand-blue font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              )}
              onClick={() => handleSelect(site.id)}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  site.status === "active" ? "bg-green-400" : "bg-gray-300",
                )}
              />
              <div className="min-w-0">
                <div className="truncate">{site.label}</div>
                <div className="text-xs text-gray-400 truncate">
                  {site.domain}
                </div>
              </div>
            </button>
          ))}

          {activeSites.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">
              No sites configured
            </div>
          )}
        </div>
      )}
    </div>
  );
}
