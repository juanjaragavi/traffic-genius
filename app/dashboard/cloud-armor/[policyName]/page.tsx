/**
 * TrafficGenius — Cloud Armor Policy Detail Page
 *
 * Shows all rules in a specific policy with actions to
 * add, edit, toggle preview, or delete rules.
 */

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { getPolicy } from "@/lib/gcp/cloud-armor";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RuleActions from "@/components/dashboard/RuleActions";

function PolicySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[60px] rounded-xl" />
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}

function actionBadgeVariant(action: string) {
  if (action.startsWith("deny")) return "destructive" as const;
  if (action === "allow") return "success" as const;
  if (action === "rate_based_ban" || action === "throttle")
    return "warning" as const;
  return "secondary" as const;
}

async function PolicyContent({ policyName }: { policyName: string }) {
  const policy = await getPolicy(policyName);

  if (!policy) {
    notFound();
  }

  const sortedRules = [...policy.rules].sort(
    (a, b) => a.priority - b.priority,
  );

  return (
    <div className="space-y-6">
      {/* Policy Info */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-blue" />
            <div>
              <h3 className="font-semibold text-gray-900">{policy.name}</h3>
              {policy.description && (
                <p className="text-sm text-gray-500">{policy.description}</p>
              )}
            </div>
          </div>
          <Badge variant="outline">{policy.rules.length} rules</Badge>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Security Rules</CardTitle>
          <RuleActions policyName={policyName} mode="add" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Match Expression</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((rule) => (
                <TableRow key={rule.priority}>
                  <TableCell className="font-mono text-sm font-medium">
                    {rule.priority}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                    {rule.description || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500 max-w-[300px] truncate">
                    {rule.match.expr?.expression ||
                      rule.match.config?.srcIpRanges?.join(", ") ||
                      "default"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionBadgeVariant(rule.action)}>
                      {rule.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.preview ? (
                      <Badge variant="warning">Preview</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <RuleActions
                      policyName={policyName}
                      rule={rule}
                      mode="edit"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {sortedRules.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-400 py-8"
                  >
                    No rules configured in this policy
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ policyName: string }>;
}) {
  const { policyName } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cloud-armor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {policyName}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage security rules for this policy
          </p>
        </div>
      </div>

      <Suspense fallback={<PolicySkeleton />}>
        <PolicyContent policyName={policyName} />
      </Suspense>
    </div>
  );
}
