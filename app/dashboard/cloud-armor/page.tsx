/**
 * TrafficGenius — Cloud Armor Policies List Page
 *
 * Shows all security policies with rule counts, associated site names,
 * and links to detail view.
 */

import { Suspense } from "react";
import Link from "next/link";
import { Shield, ChevronRight, Layers, Globe } from "lucide-react";
import { listPolicies } from "@/lib/gcp/cloud-armor";
import { getAllSites } from "@/lib/sites";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Build a lookup from policy name → site
  const policyToSite = new Map(
    sites
      .filter((s) => s.cloudArmorPolicy)
      .map((s) => [s.cloudArmorPolicy!, s]),
  );

  return (
    <div className="space-y-4">
      {policies.map((policy) => {
        const denyRules = policy.rules.filter((r) =>
          r.action.startsWith("deny"),
        ).length;
        const allowRules = policy.rules.filter(
          (r) => r.action === "allow",
        ).length;
        const rateLimitRules = policy.rules.filter(
          (r) => r.action === "rate_based_ban" || r.action === "throttle",
        ).length;

        const associatedSite = policyToSite.get(policy.name);

        return (
          <Link
            key={policy.name}
            href={`/dashboard/cloud-armor/${policy.name}`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg p-2.5 bg-blue-50/80">
                      <Shield className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors">
                          {policy.name}
                        </h3>
                        {associatedSite && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-cyan-50/60 border-cyan-200 text-brand-cyan"
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            {associatedSite.label}
                          </Badge>
                        )}
                      </div>
                      {policy.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {policy.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Layers className="w-3 h-3 mr-1" />
                          {policy.rules.length} rules
                        </Badge>
                        {denyRules > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {denyRules} deny
                          </Badge>
                        )}
                        {allowRules > 0 && (
                          <Badge variant="success" className="text-xs">
                            {allowRules} allow
                          </Badge>
                        )}
                        {rateLimitRules > 0 && (
                          <Badge variant="warning" className="text-xs">
                            {rateLimitRules} rate limit
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
      {policies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            No security policies found in project
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CloudArmorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Cloud Armor Policies
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage security policies and rules for your GCP backend services
        </p>
      </div>

      <Suspense fallback={<PoliciesSkeleton />}>
        <PoliciesContent />
      </Suspense>
    </div>
  );
}
