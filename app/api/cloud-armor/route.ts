/**
 * TrafficGenius — Cloud Armor API: Add Rule
 *
 * POST /api/cloud-armor
 * Creates a new security rule on a Cloud Armor policy.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addRule } from "@/lib/gcp/cloud-armor";
import { createAuditLog } from "@/lib/audit-log";
import { createScopedLogger } from "@/lib/logger";

const logger = createScopedLogger("api:cloud-armor");

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { policyName, priority, description, action, match, preview } = body;

    if (!policyName || priority == null || !action || !match) {
      return NextResponse.json(
        {
          error: "Missing required fields: policyName, priority, action, match",
        },
        { status: 400 },
      );
    }

    await addRule(policyName, {
      priority,
      description: description || "",
      action,
      match,
      preview: preview ?? false,
    });

    await createAuditLog({
      userId: Number(session.user.id),
      action: "CREATE",
      resource: `cloud-armor/${policyName}/rules/${priority}`,
      details: { priority, action, match, preview },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    logger.info({ policyName, priority, action }, "Rule created");

    return NextResponse.json(
      { success: true, message: "Rule created successfully" },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, "Failed to create rule");
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 },
    );
  }
}
