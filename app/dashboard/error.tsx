"use client";

/**
 * TrafficGenius — Dashboard Error Boundary
 *
 * Catches runtime errors from server components (BigQuery, Cloud Armor, etc.)
 * and renders an informative state instead of a blank or broken page.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createScopedLogger } from "@/lib/logger";
import { useTranslation } from "@/lib/i18n";

const log = createScopedLogger("DashboardError");

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    log.error(
      { message: error.message, digest: error.digest },
      "Dashboard error boundary triggered",
    );
  }, [error]);

  const isGcpError =
    error.message.includes("BigQuery") ||
    error.message.includes("PERMISSION_DENIED") ||
    error.message.includes("NOT_FOUND") ||
    error.message.includes("Cloud Armor");

  return (
    <div className="flex flex-col items-center justify-center min-h-100 gap-6">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="p-3 rounded-full bg-red-50 border border-red-100">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("errors.dataSourceError")}
        </h3>
        <p className="text-sm text-gray-500">
          {isGcpError
            ? t("errors.gcpFetchFailed")
            : t("errors.unexpectedError")}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">
            {t("errors.errorId", { id: error.digest })}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        {t("errors.retry")}
      </Button>
    </div>
  );
}
