"use client";

import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";

export default function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "transition-[padding-left] duration-300",
        collapsed ? "lg:pl-17" : "lg:pl-64",
      )}
    >
      {children}
    </div>
  );
}
