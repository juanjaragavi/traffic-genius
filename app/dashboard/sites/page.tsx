/**
 * TrafficGenius — Sites Management Page
 *
 * Full CRUD interface for monitored domains.
 * Displays each site with its GCP resource associations:
 * Cloud DNS zone, Backend Service, and Cloud Armor policy.
 */

import { Suspense } from "react";
import { Globe, Shield, Server, MapPin, Layers } from "lucide-react";
import { getAllSites } from "@/lib/sites";
import { listPolicies } from "@/lib/gcp/cloud-armor";
import { listBackendServices } from "@/lib/gcp/backend-services";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/dashboard/PageHeader";
import SiteForm from "@/components/dashboard/SiteForm";
import SiteActions from "@/components/dashboard/SiteActions";

function SitesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-30 rounded-xl" />
      ))}
    </div>
  );
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "inactive":
      return "secondary" as const;
    case "pending":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

async function SitesContent() {
  const [sites, policies, backendServices] = await Promise.all([
    getAllSites(),
    listPolicies(),
    listBackendServices(),
  ]);

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {sites.length} site{sites.length !== 1 ? "s" : ""} registered
        </p>
        <SiteForm
          mode="create"
          policies={policies}
          backendServices={backendServices}
        />
      </div>

      {/* Site Cards */}
      {sites.map((site) => {
        const meta = site.metadata as Record<string, unknown>;
        const market = meta?.market as string | undefined;
        const language = meta?.language as string | undefined;

        return (
          <Card key={site.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Left: site info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="rounded-lg p-2.5 bg-blue-50/80 shrink-0 mt-0.5">
                    <Globe className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {site.label}
                        </h3>
                        <Badge variant={statusBadgeVariant(site.status)}>
                          {site.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">
                        {site.domain}
                      </p>
                    </div>

                    {/* Resource Associations */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      {site.cloudArmorPolicy && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-brand-cyan" />
                          {site.cloudArmorPolicy}
                        </span>
                      )}
                      {site.backendService && (
                        <span className="flex items-center gap-1">
                          <Server className="w-3.5 h-3.5 text-brand-blue" />
                          {site.backendService}
                        </span>
                      )}
                      {site.cloudDnsZone && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-brand-lime" />
                          DNS: {site.cloudDnsZone}
                        </span>
                      )}
                      {market && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {market}
                          {language && ` (${language})`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <SiteActions
                  site={site}
                  policies={policies}
                  backendServices={backendServices}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {sites.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            No sites registered yet. Click &quot;Add Site&quot; to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SitesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.sites.title"
        subtitleKey="pages.sites.subtitle"
      />

      <Suspense fallback={<SitesSkeleton />}>
        <SitesContent />
      </Suspense>
    </div>
  );
}
