"use client";

/**
 * TrafficGenius — PolicyList Client Component
 *
 * Renders the Cloud Armor / Security Rules policy cards with i18n.
 */

import Link from "next/link";
import { Shield, ChevronRight, Layers, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface PolicyItem {
  name: string;
  description?: string;
  rules: { action: string }[];
}

interface AssociatedSite {
  label: string;
}

interface PolicyListProps {
  policies: PolicyItem[];
  policyToSite: Record<string, AssociatedSite>;
}

export default function PolicyList({
  policies,
  policyToSite,
}: PolicyListProps) {
  const { t } = useTranslation();

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-400">
          {t("pages.securityRules.noPolices")}
        </CardContent>
      </Card>
    );
  }

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

        const associatedSite = policyToSite[policy.name];

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
                          {policy.rules.length} {t("common.rules")}
                        </Badge>
                        {denyRules > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {denyRules} {t("common.deny")}
                          </Badge>
                        )}
                        {allowRules > 0 && (
                          <Badge variant="success" className="text-xs">
                            {allowRules} {t("common.allow")}
                          </Badge>
                        )}
                        {rateLimitRules > 0 && (
                          <Badge variant="warning" className="text-xs">
                            {rateLimitRules} {t("common.rateLimit")}
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
    </div>
  );
}
