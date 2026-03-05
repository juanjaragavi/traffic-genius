/**
 * TrafficGenius — Dashboard Layout
 *
 * Authenticated layout wrapper for all /dashboard/* pages.
 * Sidebar navigation on desktop, top bar + drawer on mobile.
 */

import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { T } from "@/lib/i18n";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen page-bg">
      {/* Skip navigation for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-blue focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <DashboardNav />
      <DashboardContent>
        <main
          id="main-content"
          className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          {children}
        </main>
        <footer className="border-t border-gray-200/40 bg-white/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              <T
                k="common.copyright"
                params={{ year: String(new Date().getFullYear()) }}
              />
            </p>
            <p className="text-xs text-gray-400">
              <T k="common.version" />
            </p>
          </div>
        </footer>
      </DashboardContent>
    </div>
  );
}
