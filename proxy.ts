/**
 * TrafficGenius — Proxy (Next.js 16 Middleware)
 *
 * Protects dashboard routes behind authentication.
 * Uses NextAuth.js v5 session cookie detection.
 *
 * Environment-aware:
 *   - Production (HTTPS): uses __Secure- prefixed cookies
 *   - Development (HTTP):  uses non-prefixed cookies
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // NextAuth.js v5 cookie names — __Secure- prefix requires HTTPS (production)
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.session-token");

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isAuthAPIRoute = pathname.startsWith("/api/auth");

  // Never intercept auth API routes
  if (isAuthAPIRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (isLoginRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Production-only: enforce HSTS at middleware level as a safety net
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
