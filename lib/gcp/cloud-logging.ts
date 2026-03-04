/**
 * TrafficGenius — Cloud Logging Service
 *
 * Fetches Cloud Armor access logs from GCP Cloud Logging.
 */

import { Logging } from "@google-cloud/logging";
import { createScopedLogger } from "@/lib/logger";

const log = createScopedLogger("CloudLogging");
const PROJECT = process.env.GCP_PROJECT_ID || "";

let _client: Logging | null = null;

function getClient(): Logging {
  if (!_client) {
    _client = new Logging({ projectId: PROJECT });
  }
  return _client;
}

export interface CloudArmorLogEntry {
  timestamp: string;
  sourceIp: string;
  requestUrl: string;
  userAgent: string;
  statusCode: number;
  enforcedPolicy: string;
  matchedRule: string;
  action: string;
  country: string;
}

/**
 * Fetch recent Cloud Armor log entries from Cloud Logging.
 */
export async function getArmorLogs(options: {
  limit?: number;
  hoursAgo?: number;
  filter?: string;
}): Promise<CloudArmorLogEntry[]> {
  const { limit = 100, hoursAgo = 1, filter } = options;

  try {
    const client = getClient();
    const cutoff = new Date(Date.now() - hoursAgo * 3600000).toISOString();

    let logFilter = `resource.type="http_load_balancer" AND timestamp >= "${cutoff}"`;
    if (filter) logFilter += ` AND ${filter}`;

    const [entries] = await client.getEntries({
      filter: logFilter,
      pageSize: limit,
      orderBy: "timestamp desc",
    });

    return entries.map((entry) => {
      const data = (entry.data as Record<string, unknown>) || {};
      const httpRequest = (data.httpRequest || {}) as Record<string, unknown>;
      const enforcedSecurityPolicy = (data.enforcedSecurityPolicy ||
        {}) as Record<string, unknown>;

      return {
        timestamp: entry.metadata?.timestamp?.toString() || "",
        sourceIp: (httpRequest.remoteIp as string) || "",
        requestUrl: (httpRequest.requestUrl as string) || "",
        userAgent: (httpRequest.userAgent as string) || "",
        statusCode: Number(httpRequest.status || 0),
        enforcedPolicy: (enforcedSecurityPolicy.name as string) || "",
        matchedRule: (enforcedSecurityPolicy.priority as string) || "",
        action: (enforcedSecurityPolicy.outcome as string) || "",
        country: "",
      };
    });
  } catch (err) {
    log.error({ err }, "Failed to fetch Cloud Armor logs");
    return [];
  }
}
