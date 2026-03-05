/**
 * TrafficGenius — Cloud Armor / Security Rules Page
 *
 * Shows all security policies with rule counts, associated site names,
 * and links to detail view.
 */

import { Suspense } from "react";
import { listPolicies } from "@/lib/gcp/cloud-armor";
import { getAllSites } from "@/lib/sites";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/dashboard/PageHeader";
import PolicyList from "@/components/dashboard/PolicyList";

function PoliciesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-25 rounded-xl" />
      ))}
    </div>
  );
}

async function PoliciesContent() {
  const [policies, sites] = await Promise.all([listPolicies(), getAllSites()]);

  // Build a serializable lookup from policy name → site label
  const policyToSite: Record<string, { label: string }> = {};
  for (const s of sites) {
    if (s.cloudArmorPolicy) {
      policyToSite[s.cloudArmorPolicy] = { label: s.label };
    }
  }

  // Serialize policies to plain objects for client component
  const serializedPolicies = policies.map((p) => ({
    name: p.name,
    description: p.description,
    rules: p.rules.map((r) => ({ action: r.action })),
  }));

  return (
    <PolicyList policies={serializedPolicies} policyToSite={policyToSite} />
  );
}

export default function CloudArmorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.securityRules.title"
        subtitleKey="pages.securityRules.subtitle"
      />

      <Suspense fallback={<PoliciesSkeleton />}>
        <PoliciesContent />
      </Suspense>
    </div>
  );
}
