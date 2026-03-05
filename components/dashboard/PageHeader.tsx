"use client";

/**
 * TrafficGenius — Translated Page Header
 *
 * Client component that renders page title and subtitle
 * with i18n support. Used by Server Component dashboard pages.
 */

import { useTranslation } from "@/lib/i18n";
import HelpTooltip from "@/components/dashboard/HelpTooltip";

interface PageHeaderProps {
  /** i18n key path for the page, e.g. "pages.overview" */
  titleKey: string;
  subtitleKey: string;
  /** Optional help tooltip key */
  helpKey?: string;
}

export default function PageHeader({
  titleKey,
  subtitleKey,
  helpKey,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {t(titleKey)}
        </h2>
        {helpKey && <HelpTooltip helpKey={helpKey} />}
      </div>
      <p className="text-sm text-gray-500 mt-1">{t(subtitleKey)}</p>
    </div>
  );
}
