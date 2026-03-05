import { BigQuery } from "@google-cloud/bigquery";

const PROJECT = process.env.GCP_PROJECT_ID || "";
const DATASET = process.env.BIGQUERY_DATASET || "traffic_security_logs";
const TABLE = process.env.BIGQUERY_TABLE || "ivt_classifications";

let _client: BigQuery | null = null;

function getClient(): BigQuery {
  if (!_client) _client = new BigQuery({ projectId: PROJECT });
  return _client;
}

export interface IvtRowInput {
  insertId: string;
  timestamp: string;
  sourceIp: string;
  countryCode: string | null;
  trafficSource: string;
  ivtType: "GIVT" | "SIVT" | "suspicious" | "clean";
  confidenceScore: number;
  ruleMatched: string;
  actionTaken: string;
  userAgent: string;
  requestPath: string;
}

export interface IvtRow {
  id: string;
  timestamp: string;
  source_ip: string;
  country_code: string | null;
  traffic_source: string;
  ivt_type: string;
  confidence_score: number;
  rule_matched: string;
  action_taken: string;
  user_agent: string;
  request_path: string;
}

/**
 * Build a BigQuery row object from classified input.
 * Pure function — testable without GCP credentials.
 */
export function buildRow(input: IvtRowInput): IvtRow {
  return {
    id: input.insertId,
    timestamp: input.timestamp,
    source_ip: input.sourceIp,
    country_code: input.countryCode,
    traffic_source: input.trafficSource,
    ivt_type: input.ivtType,
    confidence_score: input.confidenceScore,
    rule_matched: input.ruleMatched,
    action_taken: input.actionTaken,
    user_agent: input.userAgent,
    request_path: input.requestPath,
  };
}

/**
 * Insert a classified IVT row into BigQuery.
 * Uses insertId for at-least-once deduplication (Pub/Sub safe).
 */
export async function insertRow(row: IvtRow): Promise<void> {
  const bq = getClient();
  await bq
    .dataset(DATASET)
    .table(TABLE)
    .insert([row], { raw: false, skipInvalidRows: false });
}
