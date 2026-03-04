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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and dashboard preferences
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-100 rounded-xl" />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
