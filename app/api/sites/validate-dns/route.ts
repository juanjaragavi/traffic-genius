/**
 * TrafficGenius — DNS Validation API
 *
 * GET /api/sites/validate-dns?domain=example.com
 * Validates a domain against Cloud DNS and returns zone + record info.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateDomainDns } from "@/lib/gcp/cloud-dns";
import { createScopedLogger } from "@/lib/logger";

const log = createScopedLogger("api:sites:validate-dns");

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json(
      { error: "Missing required parameter: domain" },
      { status: 400 },
    );
  }

  try {
    const result = await validateDomainDns(domain);
    return NextResponse.json({
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err, domain }, "DNS validation failed");
    return NextResponse.json(
      { error: "DNS validation failed" },
      { status: 500 },
    );
  }
}
