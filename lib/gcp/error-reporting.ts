/**
 * TrafficGenius — GCP Error Reporting
 *
 * Lazy singleton pattern to report unhandled errors to
 * GCP Error Reporting in production.
 */

import { createScopedLogger } from "@/lib/logger";

const log = createScopedLogger("ErrorReporting");

let _reporter: InstanceType<
  typeof import("@google-cloud/error-reporting").ErrorReporting
> | null = null;

async function getReporter() {
  if (typeof window !== "undefined") return null; // server-only

  if (!_reporter) {
    try {
      const { ErrorReporting } = await import(
        "@google-cloud/error-reporting"
      );
      _reporter = new ErrorReporting({
        projectId: process.env.GCP_PROJECT_ID,
        reportMode: process.env.NODE_ENV === "production" ? "always" : "never",
        serviceContext: {
          service: "traffic-genius",
          version: "0.1.0",
        },
      });
    } catch (err) {
      log.error({ err }, "Failed to initialize Error Reporting");
      return null;
    }
  }
  return _reporter;
}

/**
 * Report an error to GCP Error Reporting.
 */
export async function reportError(err: Error | string): Promise<void> {
  const reporter = await getReporter();
  if (!reporter) return;

  try {
    reporter.report(err instanceof Error ? err : new Error(err));
  } catch (reportErr) {
    log.error({ err: reportErr }, "Failed to report error");
  }
}
