/**
 * TrafficGenius — Session Provider
 *
 * Wraps next-auth SessionProvider for client components
 * that need session access (signOut, useSession).
 */

"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
