/**
 * TrafficGenius — Utility Functions
 *
 * cn() — merge Tailwind classes with clsx + tailwind-merge
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas as thousands separator.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * Format a percentage value.
 */
export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/**
 * Format a date for display.
 */
export function formatDate(
  date: string | Date | Record<string, unknown> | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-US",
): string {
  if (date == null) return "—";

  let d: Date;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    d = new Date(date);
  } else if (typeof date === "object" && date !== null) {
    const value = (date as Record<string, unknown>).value;
    if (typeof value === "string") {
      d = new Date(value);
    } else {
      return "—";
    }
  } else {
    return "—";
  }

  if (isNaN(d.getTime())) return "—";

  const dateLocale = locale === "es" ? "es-CO" : "en-US";
  return d.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a date with time. Handles Date objects, strings, BigQuery timestamp objects,
 * and other edge cases to prevent [object Object] rendering.
 */
export function formatDateTime(
  date: string | Date | Record<string, unknown> | null | undefined,
  locale: string = "en-US",
): string {
  if (date == null) return "—";

  let d: Date;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    d = new Date(date);
  } else if (typeof date === "object" && date !== null) {
    // Handle BigQuery timestamp objects ({ value: "2026-..." })
    const value = (date as Record<string, unknown>).value;
    if (typeof value === "string") {
      d = new Date(value);
    } else {
      return "—";
    }
  } else {
    return "—";
  }

  if (isNaN(d.getTime())) return "—";

  const dateLocale = locale === "es" ? "es-CO" : "en-US";
  return d.toLocaleString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sleep helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
