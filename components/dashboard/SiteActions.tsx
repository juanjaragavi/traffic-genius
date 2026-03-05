"use client";

/**
 * TrafficGenius — Site Actions Component
 *
 * Edit and Delete buttons for a site card.
 * Wraps SiteForm in edit mode + standalone delete button.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteForm from "@/components/dashboard/SiteForm";
import type { Site, SecurityPolicy, BackendServiceInfo } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface SiteActionsProps {
  site: Site;
  policies: SecurityPolicy[];
  backendServices: BackendServiceInfo[];
}

export default function SiteActions({
  site,
  policies,
  backendServices,
}: SiteActionsProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (
      !confirm(
        t("siteForm.confirmDelete", { label: site.label, domain: site.domain }),
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <SiteForm
        mode="edit"
        site={site}
        policies={policies}
        backendServices={backendServices}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={loading}
        title={t("siteForm.deleteSiteTitle")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
