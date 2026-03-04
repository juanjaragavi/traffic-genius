/**
 * TrafficGenius — Sites CRUD Service
 *
 * Manages the `sites` PostgreSQL table: domain registrations,
 * Cloud Armor policy mappings, and backend service references.
 */

import { query } from "@/lib/db";
import { createScopedLogger } from "@/lib/logger";
import type { Site, SiteFormData } from "@/lib/types";

const log = createScopedLogger("Sites");

// ─── Row Mapper ───

/**
 * Convert a snake_case database row to a camelCase Site object.
 */
function mapSiteRow(row: Record<string, unknown>): Site {
  let metadata: Record<string, unknown> = {};

  if (row.metadata) {
    if (typeof row.metadata === "string") {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        metadata = {};
      }
    } else if (typeof row.metadata === "object" && row.metadata !== null) {
      metadata = row.metadata as Record<string, unknown>;
    }
  }

  return {
    id: row.id as number,
    domain: row.domain as string,
    label: row.label as string,
    cloudArmorPolicy: (row.cloud_armor_policy as string) || null,
    cloudDnsZone: (row.cloud_dns_zone as string) || null,
    backendService: (row.backend_service as string) || null,
    computeRegion: (row.compute_region as string) || "global",
    status: (row.status as Site["status"]) || "active",
    metadata,
    createdAt: row.created_at ? String(row.created_at) : "",
    updatedAt: row.updated_at ? String(row.updated_at) : "",
  };
}

// ─── Read Operations ───

/**
 * Fetch all sites, ordered by label ASC.
 */
export async function getAllSites(): Promise<Site[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM sites ORDER BY label ASC`,
    );
    return rows.map(mapSiteRow);
  } catch (err) {
    log.error({ err }, "Failed to fetch all sites");
    return [];
  }
}

/**
 * Fetch only active sites, ordered by label ASC.
 */
export async function getActiveSites(): Promise<Site[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM sites WHERE status = $1 ORDER BY label ASC`,
      ["active"],
    );
    return rows.map(mapSiteRow);
  } catch (err) {
    log.error({ err }, "Failed to fetch active sites");
    return [];
  }
}

/**
 * Fetch a single site by its primary key.
 */
export async function getSiteById(id: number): Promise<Site | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM sites WHERE id = $1`,
      [id],
    );
    return rows.length > 0 ? mapSiteRow(rows[0]) : null;
  } catch (err) {
    log.error({ err, id }, "Failed to fetch site by id");
    return null;
  }
}

/**
 * Fetch a single site by its domain.
 */
export async function getSiteByDomain(domain: string): Promise<Site | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM sites WHERE domain = $1`,
      [domain],
    );
    return rows.length > 0 ? mapSiteRow(rows[0]) : null;
  } catch (err) {
    log.error({ err, domain }, "Failed to fetch site by domain");
    return null;
  }
}

/**
 * Fetch a single site by its Cloud Armor policy name.
 */
export async function getSiteByPolicy(
  policyName: string,
): Promise<Site | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM sites WHERE cloud_armor_policy = $1`,
      [policyName],
    );
    return rows.length > 0 ? mapSiteRow(rows[0]) : null;
  } catch (err) {
    log.error({ err, policyName }, "Failed to fetch site by policy");
    return null;
  }
}

// ─── Write Operations ───

/**
 * Insert a new site and return the created record.
 */
export async function createSite(data: SiteFormData): Promise<Site> {
  try {
    const rows = await query<Record<string, unknown>>(
      `INSERT INTO sites
         (domain, label, cloud_armor_policy, cloud_dns_zone,
          backend_service, compute_region, status, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        data.domain,
        data.label,
        data.cloudArmorPolicy || null,
        data.cloudDnsZone || null,
        data.backendService || null,
        data.computeRegion || "global",
        data.status || "active",
        JSON.stringify(data.metadata || {}),
      ],
    );

    return mapSiteRow(rows[0]);
  } catch (err) {
    log.error({ err, domain: data.domain }, "Failed to create site");
    throw err;
  }
}

/**
 * Update an existing site with partial data.
 * Builds the SET clause dynamically from the provided fields.
 * Always bumps updated_at to NOW().
 */
export async function updateSite(
  id: number,
  data: Partial<SiteFormData>,
): Promise<Site | null> {
  try {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const fieldMap: Record<string, string> = {
      domain: "domain",
      label: "label",
      cloudArmorPolicy: "cloud_armor_policy",
      cloudDnsZone: "cloud_dns_zone",
      backendService: "backend_service",
      computeRegion: "compute_region",
      status: "status",
    };

    for (const [tsKey, sqlColumn] of Object.entries(fieldMap)) {
      if (tsKey in data && data[tsKey as keyof SiteFormData] !== undefined) {
        setClauses.push(`${sqlColumn} = $${paramIdx++}`);
        params.push(data[tsKey as keyof SiteFormData]);
      }
    }

    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIdx++}`);
      params.push(JSON.stringify(data.metadata));
    }

    // Always bump updated_at
    setClauses.push(`updated_at = NOW()`);

    if (setClauses.length === 1) {
      // Only updated_at — nothing meaningful to update; just touch the row
      log.warn({ id }, "updateSite called with no fields to update");
    }

    params.push(id);

    const sql = `
      UPDATE sites
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIdx}
      RETURNING *
    `;

    const rows = await query<Record<string, unknown>>(sql, params);
    return rows.length > 0 ? mapSiteRow(rows[0]) : null;
  } catch (err) {
    log.error({ err, id }, "Failed to update site");
    throw err;
  }
}

/**
 * Delete a site by id. Returns true if a row was actually removed.
 */
export async function deleteSite(id: number): Promise<boolean> {
  try {
    const rows = await query<Record<string, unknown>>(
      `DELETE FROM sites WHERE id = $1 RETURNING id`,
      [id],
    );
    return rows.length > 0;
  } catch (err) {
    log.error({ err, id }, "Failed to delete site");
    return false;
  }
}
