/**
 * TrafficGenius — Settings Page
 *
 * User preferences and dashboard configuration.
 */

import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsContent from "@/components/dashboard/SettingsContent";
import PageHeader from "@/components/dashboard/PageHeader";

async function SettingsLoader() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SettingsContent
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      }}
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.settings.title"
        subtitleKey="pages.settings.subtitle"
      />

      <Suspense fallback={<Skeleton className="h-100 rounded-xl" />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
