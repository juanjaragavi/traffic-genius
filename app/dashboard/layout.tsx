/**
 * TrafficGenius — Dashboard Layout
 *
 * Authenticated layout wrapper for all /dashboard/* pages.
 * Renders navigation, main content area, and footer.
 */

import DashboardNav from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen page-bg">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        {children}
      </main>
      <footer className="border-t border-gray-200/40 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} TopNetworks, Inc. All rights
            reserved.
          </p>
          <p className="text-xs text-gray-300">TrafficGenius v0.1.0</p>
        </div>
      </footer>
    </div>
  );
}
