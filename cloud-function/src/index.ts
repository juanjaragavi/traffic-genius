import * as ff from "@google-cloud/functions-framework";
import { initGeoIp, lookupCountry } from "./geoip";
import { classify } from "./classifier";
import { buildRow, insertRow } from "./bigquery";

export interface LogEntry {
  insertId: string;
  timestamp: string;
  httpRequest: {
    remoteIp?: string;
    userAgent?: string;
    requestUrl?: string;
    status?: number;
  };
  jsonPayload: {
    enforcedSecurityPolicy?: {
      name?: string;
      priority?: number;
      outcome?: string;
      configuredAction?: string;
    };
  };
}

export interface ParsedEntry {
  insertId: string;
  timestamp: string;
  sourceIp: string;
  userAgent: string;
  requestPath: string;
  action: string;
  ruleMatched: string;
  trafficSource: string;
}

/**
 * Extract structured fields from a raw Cloud Logging LogEntry.
 * Pure function — testable without GCP.
 */
export function parseLogEntry(entry: LogEntry): ParsedEntry {
  const http = entry.httpRequest || {};
  const policy = entry.jsonPayload?.enforcedSecurityPolicy || {};

  let requestPath = "";
  if (http.requestUrl) {
    try {
      requestPath = new URL(http.requestUrl).pathname;
    } catch {
      requestPath = http.requestUrl;
    }
  }

  return {
    insertId: entry.insertId || "",
    timestamp: entry.timestamp || new Date().toISOString(),
    sourceIp: http.remoteIp || "",
    userAgent: http.userAgent || "",
    requestPath,
    action: policy.outcome || "ACCEPT",
    ruleMatched: String(policy.priority ?? ""),
    trafficSource: policy.name || "",
  };
}

// Initialize GeoIP once at cold start
const geoIpReady = initGeoIp();

/**
 * Cloud Function entry point.
 * Triggered by Pub/Sub message from Cloud Logging sink.
 */
ff.cloudEvent(
  "ivtClassifier",
  async (cloudEvent: ff.CloudEvent<{ message?: { data?: string } }>) => {
    await geoIpReady; // no-op after first call

    const base64 = cloudEvent.data?.message?.data ?? "";
    if (!base64) {
      console.warn("Received empty Pub/Sub message — skipping");
      return;
    }

    let logEntry: LogEntry;
    try {
      logEntry = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    } catch (err) {
      console.error("Failed to parse log entry JSON:", err);
      return; // ack message to avoid infinite retry on parse errors
    }

    const parsed = parseLogEntry(logEntry);
    if (!parsed.sourceIp) {
      console.warn("Log entry missing remoteIp — skipping", {
        insertId: parsed.insertId,
      });
      return;
    }

    const countryCode = lookupCountry(parsed.sourceIp);
    const { ivtType, confidence } = classify({
      action: parsed.action,
      userAgent: parsed.userAgent,
      requestPath: parsed.requestPath,
      ruleMatched: parsed.ruleMatched,
    });

    const row = buildRow({
      insertId: parsed.insertId,
      timestamp: parsed.timestamp,
      sourceIp: parsed.sourceIp,
      countryCode,
      trafficSource: parsed.trafficSource,
      ivtType,
      confidenceScore: confidence,
      ruleMatched: parsed.ruleMatched,
      actionTaken: parsed.action === "DENY" ? "deny" : "allow",
      userAgent: parsed.userAgent,
      requestPath: parsed.requestPath,
    });

    await insertRow(row);

    console.info("Classified and inserted row", {
      insertId: parsed.insertId,
      sourceIp: parsed.sourceIp,
      ivtType,
      confidence,
      country: countryCode,
    });
  },
);
