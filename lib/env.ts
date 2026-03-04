/**
 * TrafficGenius — Environment Configuration
 *
 * Centralized environment detection and URL resolution.
 * Supports bifurcated environments:
 *   - Production: https://trafficgenius.topnetworks.co
 *   - Development: http://localhost:3080
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   console.log(env.appUrl); // → resolved URL for current environment
 */

const PRODUCTION_URL = "https://trafficgenius.topnetworks.co";
const DEVELOPMENT_URL = "http://localhost:3080";

/**
 * Detect the current deployment environment.
 */
function getEnvironment(): "production" | "development" | "test" {
  if (process.env.NODE_ENV === "test") return "test";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

/**
 * Resolve the canonical application URL for the current environment.
 * Priority: NEXT_PUBLIC_APP_URL env var → NODE_ENV-based default.
 */
function resolveAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return getEnvironment() === "production" ? PRODUCTION_URL : DEVELOPMENT_URL;
}

/**
 * Resolve the AUTH_URL used by NextAuth.js for OAuth callbacks.
 * Priority: AUTH_URL env var → NEXT_PUBLIC_APP_URL → NODE_ENV default.
 */
function resolveAuthUrl(): string {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  return resolveAppUrl();
}

export const env = {
  /** Current NODE_ENV */
  nodeEnv: getEnvironment(),

  /** Whether this is a production deployment */
  isProduction: getEnvironment() === "production",

  /** Whether this is a local development environment */
  isDevelopment: getEnvironment() === "development",

  /** Whether this is a test environment */
  isTest: getEnvironment() === "test",

  /** Canonical public-facing app URL (no trailing slash) */
  appUrl: resolveAppUrl(),

  /** OAuth callback base URL for NextAuth.js */
  authUrl: resolveAuthUrl(),

  /** Production domain constant */
  productionUrl: PRODUCTION_URL,

  /** Development domain constant */
  developmentUrl: DEVELOPMENT_URL,

  /** GCP Project ID */
  gcpProjectId: process.env.GCP_PROJECT_ID ?? "",

  /** Whether structured logging is enabled */
  loggingEnabled:
    getEnvironment() === "development" ||
    getEnvironment() === "test" ||
    process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true",
} as const;
