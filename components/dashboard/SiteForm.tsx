"use client";

/**
 * TrafficGenius — Site Form Component
 *
 * Dialog form for creating or editing a monitored site.
 * Validates domain against Cloud DNS and lets users
 * associate Cloud Armor policies and backend services.
 */

import { useState } from "react";
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
        onSuccess?.();
        window.location.reload();
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
          Add Site
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(true)}
          title="Edit site"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add New Site" : `Edit ${site?.label}`}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Register a new domain with its GCP resource mappings."
                : "Update the site configuration and GCP associations."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Domain */}
            <div className="space-y-1.5">
              <Label htmlFor="domain">Domain</Label>
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
                    "Validate DNS"
                  )}
                </Button>
              </div>
              {dnsStatus === "valid" && dnsZone && (
                <p className="text-xs text-green-600">
                  DNS validated — Zone: {dnsZone}
                </p>
              )}
              {dnsStatus === "invalid" && (
                <p className="text-xs text-amber-600">
                  No matching DNS zone found. You can still save the site.
                </p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="label">Display Label</Label>
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
              <Label htmlFor="policy">Cloud Armor Policy</Label>
              <select
                id="policy"
                value={formData.cloudArmorPolicy ?? ""}
                onChange={(e) =>
                  update("cloudArmorPolicy", e.target.value || null)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="">— None —</option>
                {policies.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Backend Service */}
            <div className="space-y-1.5">
              <Label htmlFor="backend">Backend Service</Label>
              <select
                id="backend"
                value={formData.backendService ?? ""}
                onChange={(e) =>
                  update("backendService", e.target.value || null)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="">— None —</option>
                {backendServices.map((bs) => (
                  <option key={bs.name} value={bs.name}>
                    {bs.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cloud DNS Zone (auto-filled or manual) */}
            <div className="space-y-1.5">
              <Label htmlFor="dnsZone">Cloud DNS Zone</Label>
              <Input
                id="dnsZone"
                value={formData.cloudDnsZone ?? ""}
                onChange={(e) => update("cloudDnsZone", e.target.value)}
                placeholder="Auto-detected on DNS validation"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status ?? "active"}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Create Site"
                    : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
