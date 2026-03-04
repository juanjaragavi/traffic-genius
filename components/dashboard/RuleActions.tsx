"use client";

/**
 * TrafficGenius — Rule Actions Component
 *
 * Add / Edit / Delete buttons for Cloud Armor rules.
 * Opens a modal dialog with form.
 */

import { useState } from "react";
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

interface RuleActionsProps {
  policyName: string;
  rule?: SecurityRule;
  mode: "add" | "edit";
}

const ACTION_OPTIONS = [
  { value: "allow", label: "Allow" },
  { value: "deny(403)", label: "Deny (403)" },
  { value: "deny(404)", label: "Deny (404)" },
  { value: "deny(502)", label: "Deny (502)" },
  { value: "rate_based_ban", label: "Rate-Based Ban" },
  { value: "throttle", label: "Throttle" },
  { value: "redirect", label: "Redirect" },
];

export default function RuleActions({
  policyName,
  rule,
  mode,
}: RuleActionsProps) {
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
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rule || !confirm("Are you sure you want to delete this rule?")) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/cloud-armor/${policyName}/rules?priority=${rule.priority}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        window.location.reload();
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
          Add Rule
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onClose={() => setOpen(false)}>
            <DialogHeader>
              <DialogTitle>Add Security Rule</DialogTitle>
              <DialogDescription>
                Create a new rule for policy: {policyName}
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
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Rule"}
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
        title="Edit rule"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={loading || rule?.priority === 2147483647}
        title="Delete rule"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Rule (Priority: {rule?.priority})</DialogTitle>
            <DialogDescription>
              Modify this rule in policy: {policyName}
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
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
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
          <Label htmlFor="action">Action</Label>
          <Select
            id="action"
            value={formData.action}
            onChange={(e) =>
              setFormData((d) => ({ ...d, action: e.target.value }))
            }
            options={ACTION_OPTIONS}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((d) => ({ ...d, description: e.target.value }))
          }
          placeholder="e.g. Block known bot IPs"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.useExpression}
          onCheckedChange={(checked) =>
            setFormData((d) => ({ ...d, useExpression: checked }))
          }
        />
        <Label>Use CEL Expression (advanced)</Label>
      </div>

      {formData.useExpression ? (
        <div>
          <Label htmlFor="expression">CEL Expression</Label>
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
          <Label htmlFor="srcIpRanges">Source IP Ranges (one per line)</Label>
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
        <Label>Preview mode (log only, don&apos;t enforce)</Label>
      </div>
    </div>
  );
}
