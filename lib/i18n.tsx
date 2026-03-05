"use client";

/**
 * TrafficGenius — Internationalization (i18n)
 *
 * Lightweight React Context-based i18n for App Router.
 * Supports en and es locales with localStorage persistence.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";

export type Locale = "en" | "es";

const LOCALE_KEY = "tg-locale";

type TranslationMap = Record<string, unknown>;

const translations: Record<Locale, TranslationMap> = { en, es };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: TranslationMap, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

const DEFAULT_LOCALE: Locale = "es";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored === "en" || stored === "es" ? stored : DEFAULT_LOCALE;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value =
        getNestedValue(translations[locale], key) ??
        getNestedValue(translations.en, key) ??
        key;

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }

      return value;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
