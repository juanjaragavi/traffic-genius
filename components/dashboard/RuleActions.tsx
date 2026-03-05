"use client";

/**
 * TrafficGenius — Rule Actions Component
 *
 * Add / Edit / Delete buttons for Cloud Armor rules.
 * Opens a modal dialog with form.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { SecurityRule } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface RuleActionsProps {
  policyName: string;
  rule?: SecurityRule;
  mode: "add" | "edit";
}

const ACTION_VALUES = [
  "allow",
  "deny(403)",
  "deny(404)",
  "deny(502)",
  "rate_based_ban",
  "throttle",
  "redirect",
];

const ACTION_LABEL_KEYS: Record<string, string> = {
  allow: "ruleForm.actionAllow",
  "deny(403)": "ruleForm.actionDeny403",
  "deny(404)": "ruleForm.actionDeny404",
  "deny(502)": "ruleForm.actionDeny502",
  rate_based_ban: "ruleForm.actionRateBan",
  throttle: "ruleForm.actionThrottle",
  redirect: "ruleForm.actionRedirect",
};

export default function RuleActions({
  policyName,
  rule,
  mode,
}: RuleActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    priority: rule?.priority ?? 1000,
    description: rule?.description ?? "",
    action: (rule?.action ?? "deny(403)") as string,
    expression: rule?.match.expr?.expression ?? "",
    srcIpRanges: rule?.match.config?.srcIpRanges?.join("\n") ?? "",
    preview: rule?.preview ?? false,
    useExpression: !!rule?.match.expr?.expression,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        mode === "add"
          ? `/api/cloud-armor`
          : `/api/cloud-armor/${policyName}/rules`;

      const body = {
        policyName,
        priority: formData.priority,
        description: formData.description,
        action: formData.action,
        match: formData.useExpression
          ? { expr: { expression: formData.expression } }
          : {
              versionedExpr: "SRC_IPS_V1",
              config: {
                srcIpRanges: formData.srcIpRanges
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            },
        preview: formData.preview,
      };

      const res = await fetch(endpoint, {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        toast.success(mode === "add" ? "Rule created" : "Rule updated");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save rule");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rule || !confirm(t("ruleForm.confirmDelete"))) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/cloud-armor/${policyName}/rules?priority=${rule.priority}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Rule deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete rule");
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === "add") {
    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t("ruleForm.addRule")}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onClose={() => setOpen(false)}>
            <DialogHeader>
              <DialogTitle>{t("ruleForm.addSecurityRule")}</DialogTitle>
              <DialogDescription>
                {t("ruleForm.createRuleForPolicy", { policy: policyName })}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <RuleForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t("ruleForm.cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t("ruleForm.creating") : t("ruleForm.createRule")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        title={t("ruleForm.editRuleTitle")}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={loading || rule?.priority === 2147483647}
        title={t("ruleForm.deleteRuleTitle")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {t("ruleForm.editRule", {
                priority: String(rule?.priority ?? ""),
              })}
            </DialogTitle>
            <DialogDescription>
              {t("ruleForm.modifyRuleInPolicy", { policy: policyName })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <RuleForm formData={formData} setFormData={setFormData} isEdit />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {t("ruleForm.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("ruleForm.saving") : t("ruleForm.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Internal Form Component ── */

interface RuleFormProps {
  formData: {
    priority: number;
    description: string;
    action: string;
    expression: string;
    srcIpRanges: string;
    preview: boolean;
    useExpression: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<RuleFormProps["formData"]>>;
  isEdit?: boolean;
}

function RuleForm({ formData, setFormData, isEdit }: RuleFormProps) {
  const { t } = useTranslation();

  const actionOptions = ACTION_VALUES.map((v) => ({
    value: v,
    label: t(ACTION_LABEL_KEYS[v] ?? v),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">{t("ruleForm.priority")}</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) =>
              setFormData((d) => ({ ...d, priority: Number(e.target.value) }))
            }
            disabled={isEdit}
          />
        </div>
        <div>
          <Label htmlFor="action">{t("ruleForm.action")}</Label>
          <Select
            id="action"
            value={formData.action}
            onChange={(e) =>
              setFormData((d) => ({ ...d, action: e.target.value }))
            }
            options={actionOptions}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{t("ruleForm.description")}</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((d) => ({ ...d, description: e.target.value }))
          }
          placeholder={t("ruleForm.descriptionPlaceholder")}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.useExpression}
          onCheckedChange={(checked) =>
            setFormData((d) => ({ ...d, useExpression: checked }))
          }
        />
        <Label>{t("ruleForm.useCelExpression")}</Label>
      </div>

      {formData.useExpression ? (
        <div>
          <Label htmlFor="expression">{t("ruleForm.celExpression")}</Label>
          <Textarea
            id="expression"
            value={formData.expression}
            onChange={(e) =>
              setFormData((d) => ({ ...d, expression: e.target.value }))
            }
            placeholder='origin.region_code == "US" && request.headers["user-agent"].contains("bot")'
            rows={4}
            className="font-mono text-xs"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="srcIpRanges">{t("ruleForm.sourceIpRanges")}</Label>
          <Textarea
            id="srcIpRanges"
            value={formData.srcIpRanges}
            onChange={(e) =>
              setFormData((d) => ({ ...d, srcIpRanges: e.target.value }))
            }
            placeholder={"192.168.1.0/24\n10.0.0.0/8"}
            rows={4}
            className="font-mono text-xs"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.preview}
          onCheckedChange={(checked) =>
            setFormData((d) => ({ ...d, preview: checked }))
          }
        />
        <Label>{t("ruleForm.previewMode")}</Label>
      </div>
    </div>
  );
}
