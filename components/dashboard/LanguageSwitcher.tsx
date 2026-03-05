"use client";

/**
 * TrafficGenius — Language Switcher
 *
 * Toggles between EN and ES locales.
 * Persists selection via the i18n provider (localStorage).
 */

import { useTranslation, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const options: Locale[] = ["en", "es"];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white/80 px-1 py-0.5">
      <Languages className="w-3.5 h-3.5 text-gray-400 ml-1" />
      {options.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={cn(
            "px-2 py-1 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer",
            locale === loc
              ? "bg-brand-blue text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
          )}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
