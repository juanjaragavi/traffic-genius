/**
 * TrafficGenius — Sites API
 *
 * GET  /api/sites         — List all sites
 * POST /api/sites         — Create a new site
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllSites, createSite } from "@/lib/sites";
import { createAuditLog } from "@/lib/audit-log";
import { validateDomainDns } from "@/lib/gcp/cloud-dns";
import { createScopedLogger } from "@/lib/logger";
import type { SiteFormData } from "@/lib/types";

const log = createScopedLogger("api:sites");

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sites = await getAllSites();
    return NextResponse.json({
      data: sites,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err }, "Failed to list sites");
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SiteFormData;

    if (!body.domain || !body.label) {
      return NextResponse.json(
        { error: "Missing required fields: domain, label" },
        { status: 400 },
      );
    }

    // Validate DNS if domain looks like a hostname (not a path-based domain)
    let dnsValidation = null;
    const domainHost = body.domain.split("/")[0];
    if (domainHost && !domainHost.includes("/")) {
      try {
        dnsValidation = await validateDomainDns(domainHost);
        // Auto-fill Cloud DNS zone if not provided
        if (!body.cloudDnsZone && dnsValidation.zone) {
          body.cloudDnsZone = dnsValidation.zone;
        }
      } catch {
        // DNS validation failures are non-blocking
        log.warn({ domain: body.domain }, "DNS validation skipped");
      }
    }

    const site = await createSite(body);

    await createAuditLog({
      userId: Number(session.user.id),
      action: "CREATE",
      resource: `sites/${site.id}`,
      details: {
        domain: site.domain,
        label: site.label,
        cloudArmorPolicy: site.cloudArmorPolicy,
        dnsValidation: dnsValidation
          ? { valid: dnsValidation.valid, zone: dnsValidation.zone }
          : null,
      },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    log.info({ siteId: site.id, domain: site.domain }, "Site created");

    return NextResponse.json(
      { data: site, timestamp: new Date().toISOString() },
      { status: 201 },
    );
  } catch (err) {
    log.error({ err }, "Failed to create site");
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 },
    );
  }
}
