/**
 * TrafficGenius — Cloud Armor API: Manage Rules
 *
 * PATCH /api/cloud-armor/[policyName]/rules  — Update a rule
 * DELETE /api/cloud-armor/[policyName]/rules?priority=N — Delete a rule
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { patchRule, removeRule } from "@/lib/gcp/cloud-armor";
import { createAuditLog } from "@/lib/audit-log";
import { createScopedLogger } from "@/lib/logger";

const logger = createScopedLogger("api:cloud-armor:rules");

interface RouteParams {
  params: Promise<{ policyName: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { policyName } = await params;
    const body = await request.json();
    const { priority, description, action, match, preview } = body;

    if (priority == null) {
      return NextResponse.json(
        { error: "Missing required field: priority" },
        { status: 400 },
      );
    }

    await patchRule(policyName, priority, {
      description,
      action,
      match,
      preview,
    });

    await createAuditLog({
      userId: Number(session.user.id),
      action: "UPDATE",
      resource: `cloud-armor/${policyName}/rules/${priority}`,
      details: { priority, action, match, preview },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    logger.info({ policyName, priority }, "Rule updated");

    return NextResponse.json({ success: true, message: "Rule updated" });
  } catch (error) {
    logger.error({ error }, "Failed to update rule");
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { policyName } = await params;
    const url = new URL(request.url);
    const priority = url.searchParams.get("priority");

    if (!priority) {
      return NextResponse.json(
        { error: "Missing query parameter: priority" },
        { status: 400 },
      );
    }

    const prio = Number(priority);
    if (prio === 2147483647) {
      return NextResponse.json(
        { error: "Cannot delete default rule" },
        { status: 403 },
      );
    }

    await removeRule(policyName, prio);

    await createAuditLog({
      userId: Number(session.user.id),
      action: "DELETE",
      resource: `cloud-armor/${policyName}/rules/${prio}`,
      details: { priority: prio },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    logger.info({ policyName, priority: prio }, "Rule deleted");

    return NextResponse.json({ success: true, message: "Rule deleted" });
  } catch (error) {
    logger.error({ error }, "Failed to delete rule");
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 },
    );
  }
}
