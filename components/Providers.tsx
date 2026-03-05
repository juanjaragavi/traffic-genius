/**
 * TrafficGenius — App Providers
 *
 * Wraps next-auth SessionProvider and I18nProvider for client components
 * that need session access (signOut, useSession) and i18n translations.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>{children}</I18nProvider>
    </SessionProvider>
  );
}
