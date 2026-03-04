import type { NextConfig } from "next";

/**
 * TrafficGenius — Next.js Configuration
 *
 * Environment-aware configuration supporting:
 *   - Production: https://trafficgenius.topnetworks.co
 *   - Development: http://localhost:3080
 */

const PRODUCTION_URL = "https://trafficgenius.topnetworks.co";
const DEVELOPMENT_URL = "http://localhost:3080";

const isProduction = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  : isProduction
    ? PRODUCTION_URL
    : DEVELOPMENT_URL;

const nextConfig: NextConfig = {
  /* ── Environment variables exposed at build time ── */
  env: {
    NEXT_PUBLIC_APP_URL: appUrl,
  },

  /* ── Image optimization ── */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/media-topfinanzas-com/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  /* ── Security headers ── */
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: https://storage.googleapis.com https://lh3.googleusercontent.com`,
      `connect-src 'self' ${isProduction ? PRODUCTION_URL : DEVELOPMENT_URL}`,
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
                {
                  key: "Content-Security-Policy",
                  value: cspDirectives,
                },
              ]
            : []),
        ],
      },
    ];
  },

  /* ── Logging ── */
  logging: {
    fetches: {
      fullUrl: !isProduction,
    },
  },
};

export default nextConfig;
