/**
 * TrafficGenius — App Providers
 *
 * Wraps next-auth SessionProvider, I18nProvider, and SidebarProvider
 * for client components that need session, i18n, and sidebar state.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";
import { SidebarProvider } from "@/lib/sidebar-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
