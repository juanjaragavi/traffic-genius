/**
 * TrafficGenius — BigQuery Service
 *
 * Queries the `traffic_security_logs.ivt_classifications` table
 * for IVT data, traffic summaries, and trend analysis.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { createScopedLogger } from "@/lib/logger";
import type {
  IvtRecord,
  TrafficSummary,
  CountryTraffic,
  IvtTypeSummary,
  HourlyDataPoint,
  DashboardKpis,
} from "@/lib/types";

const log = createScopedLogger("BigQuery");

const DATASET = process.env.BIGQUERY_DATASET || "traffic_security_logs";
const TABLE = process.env.BIGQUERY_TABLE || "ivt_classifications";
const PROJECT = process.env.GCP_PROJECT_ID || "";

let _client: BigQuery | null = null;

function getClient(): BigQuery {
  if (!_client) {
    _client = new BigQuery({ projectId: PROJECT });
  }
  return _client;
}

/**
 * Run a parameterized BigQuery SQL query.
 */
async function runQuery<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const bq = getClient();
  const [rows] = await bq.query({
    query: sql,
    params,
    location: "US",
  });
  return rows as T[];
}

/**
 * Get recent IVT records with optional filters.
 */
export async function getIvtRecords(options: {
  limit?: number;
  offset?: number;
  ivtType?: string;
  country?: string;
  hoursAgo?: number;
}): Promise<{ records: IvtRecord[]; total: number }> {
  const { limit = 50, offset = 0, ivtType, country, hoursAgo = 24 } = options;

  let whereClause = `WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hoursAgo} HOUR)`;
  if (ivtType) whereClause += ` AND ivt_type = @ivtType`;
  if (country) whereClause += ` AND country_code = @country`;

  const countSql = `SELECT COUNT(*) as total FROM \`${PROJECT}.${DATASET}.${TABLE}\` ${whereClause}`;
  const dataSql = `
    SELECT * FROM \`${PROJECT}.${DATASET}.${TABLE}\`
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const params: Record<string, unknown> = {};
  if (ivtType) params.ivtType = ivtType;
  if (country) params.country = country;

  try {
    const [countResult, records] = await Promise.all([
      runQuery<{ total: number }>(countSql, params),
      runQuery<IvtRecord>(dataSql, params),
    ]);

    return {
      records,
      total: countResult[0]?.total || 0,
    };
  } catch (err) {
    log.error({ err }, "Failed to fetch IVT records");
    throw err;
  }
}

/**
 * Get traffic summary for the dashboard.
 */
export async function getTrafficSummary(
  hoursAgo: number = 24,
): Promise<TrafficSummary> {
  const bq = getClient();

  try {
    // Total and blocked counts
    const overviewSql = `
      SELECT
        COUNT(*) as total_requests,
        COUNTIF(action_taken IN ('deny', 'block', 'deny(403)', 'deny(502)')) as blocked_requests,
        COUNTIF(action_taken IN ('allow', 'pass')) as allowed_requests,
        COUNTIF(ivt_type != 'clean') as ivt_count
      FROM \`${PROJECT}.${DATASET}.${TABLE}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hoursAgo} HOUR)
    `;

    // Top countries
    const countrySql = `
      SELECT
        country_code as country,
        COUNT(*) as requests,
        COUNTIF(action_taken IN ('deny', 'block', 'deny(403)', 'deny(502)')) as blocked
      FROM \`${PROJECT}.${DATASET}.${TABLE}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hoursAgo} HOUR)
      GROUP BY country_code
      ORDER BY requests DESC
      LIMIT 10
    `;

    // IVT type breakdown
    const ivtSql = `
      SELECT
        ivt_type as type,
        COUNT(*) as count
      FROM \`${PROJECT}.${DATASET}.${TABLE}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hoursAgo} HOUR)
        AND ivt_type != 'clean'
      GROUP BY ivt_type
      ORDER BY count DESC
    `;

    // Hourly trend
    const trendSql = `
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d %H:00', timestamp) as hour,
        COUNT(*) as total,
        COUNTIF(action_taken IN ('deny', 'block', 'deny(403)', 'deny(502)')) as blocked,
        COUNTIF(action_taken IN ('allow', 'pass')) as allowed
      FROM \`${PROJECT}.${DATASET}.${TABLE}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hoursAgo} HOUR)
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const [overview, countries, ivtTypes, trend] = await Promise.all([
      runQuery<{
        total_requests: number;
        blocked_requests: number;
        allowed_requests: number;
        ivt_count: number;
      }>(overviewSql),
      runQuery<CountryTraffic>(countrySql),
      runQuery<{ type: string; count: number }>(ivtSql),
      runQuery<HourlyDataPoint>(trendSql),
    ]);

    const o = overview[0] || {
      total_requests: 0,
      blocked_requests: 0,
      allowed_requests: 0,
      ivt_count: 0,
    };
    const totalReqs = Number(o.total_requests);

    return {
      totalRequests: totalReqs,
      blockedRequests: Number(o.blocked_requests),
      allowedRequests: Number(o.allowed_requests),
      ivtPercentage:
        totalReqs > 0 ? (Number(o.ivt_count) / totalReqs) * 100 : 0,
      topCountries: countries.map((c) => ({
        ...c,
        requests: Number(c.requests),
        blocked: Number(c.blocked),
        percentage: totalReqs > 0 ? (Number(c.requests) / totalReqs) * 100 : 0,
      })),
      topIvtTypes: ivtTypes.map((i) => ({
        type: i.type,
        count: Number(i.count),
        percentage: totalReqs > 0 ? (Number(i.count) / totalReqs) * 100 : 0,
      })),
      hourlyTrend: trend.map((t) => ({
        hour: t.hour,
        total: Number(t.total),
        blocked: Number(t.blocked),
        allowed: Number(t.allowed),
      })),
    };
  } catch (err) {
    log.error({ err }, "Failed to fetch traffic summary");
    throw err;
  }
}

/**
 * Get dashboard KPI data.
 */
export async function getDashboardKpis(): Promise<DashboardKpis> {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_requests,
        COUNTIF(action_taken IN ('deny', 'block', 'deny(403)', 'deny(502)')) as blocked_requests,
        COUNT(DISTINCT source_ip) as unique_ips,
        COUNTIF(ivt_type != 'clean') as ivt_detected,
        APPROX_TOP_COUNT(rule_matched, 1) as top_rule
      FROM \`${PROJECT}.${DATASET}.${TABLE}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    `;

    const rows = await runQuery<{
      total_requests: number;
      blocked_requests: number;
      unique_ips: number;
      ivt_detected: number;
      top_rule: Array<{ value: string; count: number }>;
    }>(sql);

    const r = rows[0];
    const totalReqs = Number(r?.total_requests || 0);
    const blockedReqs = Number(r?.blocked_requests || 0);

    return {
      totalRequests24h: totalReqs,
      blockedRequests24h: blockedReqs,
      blockRate: totalReqs > 0 ? (blockedReqs / totalReqs) * 100 : 0,
      uniqueIps24h: Number(r?.unique_ips || 0),
      activePolicies: 0, // filled by Cloud Armor wrapper
      totalRules: 0, // filled by Cloud Armor wrapper
      ivtDetected24h: Number(r?.ivt_detected || 0),
      topAttackVector: r?.top_rule?.[0]?.value || "N/A",
    };
  } catch (err) {
    log.error({ err }, "Failed to fetch dashboard KPIs");
    throw err;
  }
}
