"use client";

/**
 * TrafficGenius — Contextual Help Tooltip
 *
 * Renders a "?" icon that displays a plain-language
 * description on hover (desktop) or tap (mobile).
 * Tooltip copy is resolved via the i18n layer.
 */

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  /** i18n key under the "help" namespace, e.g. "totalRequests" */
  helpKey: string;
  className?: string;
}

export default function HelpTooltip({ helpKey, className }: HelpTooltipProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const text = t(`help.${helpKey}`);

  // Close on outside click (for mobile tap-to-open)
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-pointer rounded-full p-0.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50/80 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 sm:w-72">
          <div className="rounded-lg bg-gray-900 text-white text-xs leading-relaxed px-3 py-2.5 shadow-lg">
            {text}
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1.5" />
          </div>
        </div>
      )}
    </div>
  );
}
