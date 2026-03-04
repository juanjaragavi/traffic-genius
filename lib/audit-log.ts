/**
 * TrafficGenius — Audit Log Service
 *
 * Records all Cloud Armor rule changes to PostgreSQL audit_logs.
 */

import { query } from "@/lib/db";
import { createScopedLogger } from "@/lib/logger";
import type { AuditLogEntry } from "@/lib/types";

const log = createScopedLogger("AuditLog");

/**
 * Record an audit log entry.
 */
export async function createAuditLog(entry: {
  userId: number;
  action: AuditLogEntry["action"];
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.userId,
        entry.action,
        entry.resource,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null,
      ],
    );
  } catch (err) {
    log.error({ err }, "Failed to create audit log");
  }
}

/**
 * Fetch audit logs with optional filters.
 */
export async function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const { limit = 50, offset = 0, action, userId } = options;

  try {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];
    let paramIdx = 1;

    if (action) {
      whereClause += ` AND al.action = $${paramIdx++}`;
      params.push(action);
    }
    if (userId) {
      whereClause += ` AND al.user_id = $${paramIdx++}`;
      params.push(userId);
    }

    const countSql = `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`;
    const dataSql = `
      SELECT
        al.id,
        al.user_id as "userId",
        u.name as "userName",
        u.email as "userEmail",
        al.action,
        al.resource,
        al.details,
        al.ip_address as "ipAddress",
        al.created_at as "createdAt"
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    params.push(limit, offset);

    const [countResult, logs] = await Promise.all([
      query<{ total: string }>(countSql, params.slice(0, -2)),
      query<AuditLogEntry>(dataSql, params),
    ]);

    return {
      logs,
      total: Number(countResult[0]?.total || 0),
    };
  } catch (err) {
    log.error({ err }, "Failed to fetch audit logs");
    return { logs: [], total: 0 };
  }
}
