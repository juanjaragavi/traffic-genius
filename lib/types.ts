/**
 * TrafficGenius — TypeScript Interfaces
 *
 * Shared types for the entire application.
 */

// ─── Cloud Armor Types ───

export interface SecurityPolicy {
  name: string;
  description?: string;
  selfLink?: string;
  rules: SecurityRule[];
  fingerprint?: string;
  creationTimestamp?: string;
}

export interface SecurityRule {
  priority: number;
  description?: string;
  action: "allow" | "deny(403)" | "deny(404)" | "deny(502)" | "rate_based_ban" | "throttle" | "redirect";
  match: {
    versionedExpr?: "SRC_IPS_V1";
    expr?: {
      expression: string; // CEL expression
    };
    config?: {
      srcIpRanges?: string[];
    };
  };
  preview?: boolean;
  rateLimitOptions?: {
    rateLimitThreshold?: {
      count: number;
      intervalSec: number;
    };
    conformAction?: string;
    exceedAction?: string;
    enforceOnKey?: string;
    banDurationSec?: number;
  };
}

// ─── BigQuery / IVT Types ───

export interface IvtRecord {
  timestamp: string;
  source_ip: string;
  country_code: string;
  ivt_type: "GIVT" | "SIVT" | "suspicious" | "clean";
  confidence_score: number;
  user_agent: string;
  request_path: string;
  rule_matched: string;
  action_taken: string;
}

export interface TrafficSummary {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  ivtPercentage: number;
  topCountries: CountryTraffic[];
  topIvtTypes: IvtTypeSummary[];
  hourlyTrend: HourlyDataPoint[];
}

export interface CountryTraffic {
  country: string;
  requests: number;
  blocked: number;
  percentage: number;
}

export interface IvtTypeSummary {
  type: string;
  count: number;
  percentage: number;
}

export interface HourlyDataPoint {
  hour: string;
  total: number;
  blocked: number;
  allowed: number;
}

// ─── Dashboard KPI Types ───

export interface DashboardKpis {
  totalRequests24h: number;
  blockedRequests24h: number;
  blockRate: number;
  uniqueIps24h: number;
  activePolicies: number;
  totalRules: number;
  ivtDetected24h: number;
  topAttackVector: string;
}

// ─── Audit Log Types ───

export interface AuditLogEntry {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── Chart Types ───

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

// ─── API Response Types ───

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Dashboard Preferences ───

export interface DashboardPreferences {
  dateRange: "1h" | "6h" | "24h" | "7d" | "30d";
  refreshInterval: number; // seconds, 0 = disabled
  chartType: "area" | "bar" | "line";
  visibleKpis: string[];
}
