/**
 * TrafficGenius — Single Site API
 *
 * GET    /api/sites/[id]  — Get site by id
 * PATCH  /api/sites/[id]  — Update site
 * DELETE /api/sites/[id]  — Delete site
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSiteById, updateSite, deleteSite } from "@/lib/sites";
import { createAuditLog } from "@/lib/audit-log";
import { validateDomainDns } from "@/lib/gcp/cloud-dns";
import { createScopedLogger } from "@/lib/logger";
import type { SiteFormData } from "@/lib/types";

const log = createScopedLogger("api:sites:[id]");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const siteId = Number(id);
  if (isNaN(siteId)) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  try {
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    return NextResponse.json({
      data: site,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err, id: siteId }, "Failed to fetch site");
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const siteId = Number(id);
  if (isNaN(siteId)) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Partial<SiteFormData>;

    // Validate DNS if domain is being changed
    let dnsValidation = null;
    if (body.domain) {
      const domainHost = body.domain.split("/")[0];
      if (domainHost) {
        try {
          dnsValidation = await validateDomainDns(domainHost);
          if (!body.cloudDnsZone && dnsValidation.zone) {
            body.cloudDnsZone = dnsValidation.zone;
          }
        } catch {
          log.warn({ domain: body.domain }, "DNS validation skipped on update");
        }
      }
    }

    const site = await updateSite(siteId, body);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    await createAuditLog({
      userId: Number(session.user.id),
      action: "UPDATE",
      resource: `sites/${siteId}`,
      details: {
        updatedFields: Object.keys(body),
        domain: site.domain,
        dnsValidation: dnsValidation
          ? { valid: dnsValidation.valid, zone: dnsValidation.zone }
          : null,
      },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    log.info({ siteId, domain: site.domain }, "Site updated");

    return NextResponse.json({
      data: site,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err, id: siteId }, "Failed to update site");
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const siteId = Number(id);
  if (isNaN(siteId)) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  try {
    // Fetch site before deletion for audit log
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const deleted = await deleteSite(siteId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete site" },
        { status: 500 },
      );
    }

    await createAuditLog({
      userId: Number(session.user.id),
      action: "DELETE",
      resource: `sites/${siteId}`,
      details: { domain: site.domain, label: site.label },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
    });

    log.info({ siteId, domain: site.domain }, "Site deleted");

    return NextResponse.json({
      data: { success: true },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err, id: siteId }, "Failed to delete site");
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 },
    );
  }
}
