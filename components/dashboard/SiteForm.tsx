"use client";

/**
 * TrafficGenius — Site Form Component
 *
 * Dialog form for creating or editing a monitored site.
 * Validates domain against Cloud DNS and lets users
 * associate Cloud Armor policies and backend services.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  Site,
  SiteFormData,
  SecurityPolicy,
  BackendServiceInfo,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface SiteFormProps {
  mode: "create" | "edit";
  site?: Site;
  policies: SecurityPolicy[];
  backendServices: BackendServiceInfo[];
  onSuccess?: () => void;
}

export default function SiteForm({
  mode,
  site,
  policies,
  backendServices,
  onSuccess,
}: SiteFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [dnsZone, setDnsZone] = useState<string | null>(
    site?.cloudDnsZone ?? null,
  );
  const [formData, setFormData] = useState<SiteFormData>({
    domain: site?.domain ?? "",
    label: site?.label ?? "",
    cloudArmorPolicy: site?.cloudArmorPolicy ?? "",
    cloudDnsZone: site?.cloudDnsZone ?? "",
    backendService: site?.backendService ?? "",
    computeRegion: site?.computeRegion ?? "global",
    status: site?.status ?? "active",
    metadata: site?.metadata ?? {},
  });

  const validateDns = async () => {
    if (!formData.domain) return;
    setDnsStatus("checking");
    try {
      const host = formData.domain.split("/")[0];
      const res = await fetch(
        `/api/sites/validate-dns?domain=${encodeURIComponent(host)}`,
      );
      const json = await res.json();
      if (json.data?.valid) {
        setDnsStatus("valid");
        setDnsZone(json.data.zone);
        setFormData((prev) => ({
          ...prev,
          cloudDnsZone: json.data.zone ?? "",
        }));
      } else {
        setDnsStatus("invalid");
        setDnsZone(null);
      }
    } catch {
      setDnsStatus("invalid");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/sites" : `/api/sites/${site?.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setOpen(false);
        toast.success(mode === "create" ? "Site created" : "Site updated");
        onSuccess?.();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save site");
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof SiteFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t("siteForm.addSite")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(true)}
          title={t("siteForm.editSiteTitle")}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? t("siteForm.addNewSite")
                : t("siteForm.editSite", { label: site?.label ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? t("siteForm.addDescription")
                : t("siteForm.editDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Domain */}
            <div className="space-y-1.5">
              <Label htmlFor="domain">{t("siteForm.domain")}</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => {
                    update("domain", e.target.value);
                    setDnsStatus("idle");
                  }}
                  placeholder="us.topfinanzas.com"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={validateDns}
                  disabled={!formData.domain || dnsStatus === "checking"}
                  className="shrink-0"
                >
                  {dnsStatus === "checking" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : dnsStatus === "valid" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : dnsStatus === "invalid" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    t("siteForm.validateDns")
                  )}
                </Button>
              </div>
              {dnsStatus === "valid" && dnsZone && (
                <p className="text-xs text-green-600">
                  {t("siteForm.dnsValidated", { zone: dnsZone })}
                </p>
              )}
              {dnsStatus === "invalid" && (
                <p className="text-xs text-amber-600">
                  {t("siteForm.noDnsZone")}
                </p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="label">{t("siteForm.displayLabel")}</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="TopFinance US"
                required
              />
            </div>

            {/* Cloud Armor Policy */}
            <div className="space-y-1.5">
              <Label htmlFor="policy">{t("siteForm.cloudArmorPolicy")}</Label>
              <select
                id="policy"
                value={formData.cloudArmorPolicy ?? ""}
                onChange={(e) =>
                  update("cloudArmorPolicy", e.target.value || null)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="">{t("siteForm.none")}</option>
                {policies.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Backend Service */}
            <div className="space-y-1.5">
              <Label htmlFor="backend">{t("siteForm.backendService")}</Label>
              <select
                id="backend"
                value={formData.backendService ?? ""}
                onChange={(e) =>
                  update("backendService", e.target.value || null)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="">{t("siteForm.none")}</option>
                {backendServices.map((bs) => (
                  <option key={bs.name} value={bs.name}>
                    {bs.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cloud DNS Zone (auto-filled or manual) */}
            <div className="space-y-1.5">
              <Label htmlFor="dnsZone">{t("siteForm.cloudDnsZone")}</Label>
              <Input
                id="dnsZone"
                value={formData.cloudDnsZone ?? ""}
                onChange={(e) => update("cloudDnsZone", e.target.value)}
                placeholder={t("siteForm.dnsAutoDetected")}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">{t("siteForm.status")}</Label>
              <select
                id="status"
                value={formData.status ?? "active"}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="active">{t("siteForm.active")}</option>
                <option value="inactive">{t("siteForm.inactive")}</option>
                <option value="pending">{t("siteForm.pending")}</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {t("siteForm.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? mode === "create"
                    ? t("siteForm.creating")
                    : t("siteForm.saving")
                  : mode === "create"
                    ? t("siteForm.createSite")
                    : t("siteForm.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
