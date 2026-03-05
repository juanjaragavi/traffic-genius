# IVT Classifier Cloud Function — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Cloud Function that consumes Cloud Armor logs from Pub/Sub, classifies each request as GIVT/SIVT/suspicious/clean using GeoIP + UA matching, and writes structured rows into BigQuery `ivt_classifications`.

**Architecture:** Cloud Logging emits `http_load_balancer` log entries to a Pub/Sub topic via a Log Sink. The Gen-2 Cloud Function is triggered per message, decodes the base64 LogEntry JSON, enriches it with MaxMind GeoLite2 country lookup, classifies traffic by action + user-agent pattern, and inserts a row into BigQuery using the log's `insertId` as an idempotency key.

**Tech Stack:** Node.js 20, TypeScript, `@google-cloud/functions-framework` (Gen 2 CloudEvent), `@google-cloud/bigquery`, `maxmind` (GeoLite2 reader), Jest + ts-jest (tests).

**Design doc:** `docs/plans/2026-03-04-ivt-classifier-cloud-function-design.md`

---

## Pre-flight: GCP infrastructure (you do this before Task 1)

Run commands 1–4 now. Command 5 (deploy) runs at the end of Task 7.

```bash
# 1. Create Pub/Sub topic
gcloud pubsub topics create armor-logs-topic \
  --project=absolute-brook-452020-d5

# 2. Delete the existing BigQuery sink
gcloud logging sinks delete armor-logs-to-bigquery \
  --project=absolute-brook-452020-d5 --quiet

# 3. Create the new Pub/Sub sink
gcloud logging sinks create armor-logs-to-pubsub \
  "pubsub.googleapis.com/projects/absolute-brook-452020-d5/topics/armor-logs-topic" \
  --log-filter='resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.name!=""' \
  --project=absolute-brook-452020-d5

# 4. Grant Cloud Logging publish permission to topic
gcloud pubsub topics add-iam-policy-binding armor-logs-topic \
  --member="serviceAccount:$(gcloud logging sinks describe armor-logs-to-pubsub \
    --project=absolute-brook-452020-d5 --format='value(writerIdentity)')" \
  --role="roles/pubsub.publisher" \
  --project=absolute-brook-452020-d5
```

Expected after step 3: output includes `writerIdentity: serviceAccount:pXXX@gcp-sa-logging.iam.gserviceaccount.com`.

---

## Task 1: Scaffold `cloud-function/` directory

### **Files:**

- Create: `cloud-function/package.json`
- Create: `cloud-function/tsconfig.json`
- Create: `cloud-function/.gcloudignore`
- Create: `cloud-function/.gitignore`

### **Step 1: Create `cloud-function/package.json`**

```json
{
  "name": "ivt-classifier",
  "version": "1.0.0",
  "description": "TrafficGenius IVT classification Cloud Function",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@google-cloud/bigquery": "^7.9.1",
    "@google-cloud/functions-framework": "^3.4.5",
    "maxmind": "^4.3.21"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^20.17.17",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.3"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/*.test.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
}
```

### **Step 2: Create `cloud-function/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### **Step 3: Create `cloud-function/.gcloudignore`**

```
node_modules/
src/
*.test.ts
tsconfig.json
jest.config.*
.env*
data/GeoLite2-Country.mmdb
```

> `.gcloudignore` tells `gcloud functions deploy` what NOT to upload. We deploy compiled `dist/` JS, not TypeScript source.

### **Step 4: Create `cloud-function/.gitignore`**

```
node_modules/
dist/
data/GeoLite2-Country.mmdb
```

### **Step 5: Install dependencies**

```bash
cd cloud-function && npm install
```

Expected: `node_modules/` created, `package-lock.json` generated.

### **Step 6: Commit**

```bash
git add cloud-function/package.json cloud-function/package-lock.json \
  cloud-function/tsconfig.json cloud-function/.gcloudignore cloud-function/.gitignore
git commit -m "feat(cloud-function): scaffold ivt-classifier project"
```

---

## Task 2: Known-bot user-agent data

### **Files:**

- Create: `cloud-function/data/known-bots.json`

### **Step 1: Create `cloud-function/data/known-bots.json`**

Each entry is a regex pattern (case-insensitive) matched against the full user-agent string.

```json
[
  "Googlebot",
  "Google-InspectionTool",
  "Google-Extended",
  "AdsBot-Google",
  "Mediapartners-Google",
  "bingbot",
  "BingPreview",
  "msnbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "YandexImages",
  "Sogou",
  "Exabot",
  "facebot",
  "facebookexternalhit",
  "ia_archiver",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Applebot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "DotBot",
  "rogerbot",
  "archive\\.org_bot",
  "CCBot",
  "DataForSeoBot",
  "serpstatbot",
  "wget",
  "curl\\/",
  "python-requests",
  "Go-http-client",
  "Java\\/",
  "libwww-perl",
  "Scrapy",
  "HeadlessChrome",
  "PhantomJS",
  "Selenium",
  "puppeteer",
  "playwright"
]
```

### **Step 2: Commit**

```bash
git add cloud-function/data/known-bots.json
git commit -m "feat(cloud-function): add known-bot user-agent pattern list"
```

---

## Task 3: GeoIP wrapper

### **Files:**

- Create: `cloud-function/src/geoip.ts`
- Create: `cloud-function/src/geoip.test.ts`

### **Step 1: Write the failing test**

Create `cloud-function/src/geoip.test.ts`:

```typescript
import { lookupCountry, initGeoIp } from "./geoip";
import path from "path";

describe("lookupCountry", () => {
  it("returns null when database is not initialized", () => {
    // lookupCountry without init → returns null, never throws
    expect(lookupCountry("8.8.8.8")).toBeNull();
  });

  it("returns null for invalid IP", () => {
    expect(lookupCountry("not-an-ip")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(lookupCountry("")).toBeNull();
  });
});
```

### **Step 2: Run test to verify it fails**

```bash
cd cloud-function && npx jest src/geoip.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './geoip'`

### **Step 3: Write minimal implementation**

Create `cloud-function/src/geoip.ts`:

```typescript
import * as maxmind from "maxmind";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(__dirname, "../data/GeoLite2-Country.mmdb");

let reader: maxmind.Reader<maxmind.CountryResponse> | null = null;

/**
 * Initialize the MaxMind GeoLite2 reader.
 * Called once at cold start. Safe to call multiple times (idempotent).
 */
export async function initGeoIp(): Promise<void> {
  if (reader) return;
  if (!fs.existsSync(DB_PATH)) {
    console.warn(
      `GeoLite2 database not found at ${DB_PATH}. Country lookup disabled.`,
    );
    return;
  }
  reader = await maxmind.open<maxmind.CountryResponse>(DB_PATH);
}

/**
 * Look up the ISO 3166-1 alpha-2 country code for an IP address.
 * Returns null if the database is not loaded or the IP is not found.
 */
export function lookupCountry(ip: string): string | null {
  if (!reader || !ip) return null;
  try {
    const result = reader.get(ip);
    return result?.country?.iso_code ?? null;
  } catch {
    return null;
  }
}
```

### **Step 4: Run test to verify it passes**

```bash
cd cloud-function && npx jest src/geoip.test.ts --no-coverage
```

Expected: PASS (3 tests)

### **Step 5: Commit**

```bash
git add cloud-function/src/geoip.ts cloud-function/src/geoip.test.ts
git commit -m "feat(cloud-function): add GeoLite2 country lookup wrapper"
```

---

## Task 4: IVT classifier

### **Files:**

- Create: `cloud-function/src/classifier.ts`
- Create: `cloud-function/src/classifier.test.ts`

**Step 1: Write the failing tests**

Create `cloud-function/src/classifier.test.ts`:

```typescript
import { classify, ClassifierInput } from "./classifier";

function input(overrides: Partial<ClassifierInput> = {}): ClassifierInput {
  return {
    action: "ACCEPT",
    userAgent: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120",
    requestPath: "/credit-cards",
    ruleMatched: "2147483647",
    ...overrides,
  };
}

describe("classify — GIVT", () => {
  it("classifies Googlebot as GIVT", () => {
    const result = classify(
      input({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }),
    );
    expect(result.ivtType).toBe("GIVT");
    expect(result.confidence).toBe(0.95);
  });

  it("classifies bingbot as GIVT", () => {
    const result = classify(
      input({ userAgent: "Mozilla/5.0 (compatible; bingbot/2.0)" }),
    );
    expect(result.ivtType).toBe("GIVT");
  });

  it("classifies HeadlessChrome as GIVT", () => {
    const result = classify(input({ userAgent: "HeadlessChrome/120.0" }));
    expect(result.ivtType).toBe("GIVT");
  });

  it("classifies GIVT even when action is DENY", () => {
    const result = classify(
      input({ userAgent: "Googlebot/2.1", action: "DENY" }),
    );
    expect(result.ivtType).toBe("GIVT");
  });
});

describe("classify — SIVT", () => {
  it("classifies denied request with non-empty UA as SIVT with 0.80", () => {
    const result = classify(
      input({ action: "DENY", userAgent: "SomeSuspiciousTool/1.0" }),
    );
    expect(result.ivtType).toBe("SIVT");
    expect(result.confidence).toBe(0.8);
  });

  it("classifies denied request with empty UA as SIVT with 0.85", () => {
    const result = classify(input({ action: "DENY", userAgent: "" }));
    expect(result.ivtType).toBe("SIVT");
    expect(result.confidence).toBe(0.85);
  });
});

describe("classify — suspicious", () => {
  it("classifies accepted request with empty UA as suspicious", () => {
    const result = classify(input({ action: "ACCEPT", userAgent: "" }));
    expect(result.ivtType).toBe("suspicious");
    expect(result.confidence).toBe(0.65);
  });

  it("classifies accepted request to /.git as suspicious", () => {
    const result = classify(
      input({ action: "ACCEPT", requestPath: "/.git/config" }),
    );
    expect(result.ivtType).toBe("suspicious");
    expect(result.confidence).toBe(0.7);
  });

  it("classifies accepted request to /wp-admin as suspicious", () => {
    const result = classify(
      input({ action: "ACCEPT", requestPath: "/wp-admin/admin-ajax.php" }),
    );
    expect(result.ivtType).toBe("suspicious");
  });
});

describe("classify — clean", () => {
  it("classifies normal accepted request as clean", () => {
    const result = classify(input());
    expect(result.ivtType).toBe("clean");
    expect(result.confidence).toBe(0.05);
  });
});
```

### **Step 2: Run test to verify it fails**

```bash
cd cloud-function && npx jest src/classifier.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './classifier'`

### **Step 3: Write the implementation**

Create `cloud-function/src/classifier.ts`:

```typescript
import bots from "../data/known-bots.json";

const BOT_PATTERNS: RegExp[] = (bots as string[]).map(
  (p) => new RegExp(p, "i"),
);

const SENSITIVE_PATHS: RegExp[] = [
  /\/\.git/,
  /\/wp-admin/,
  /\/etc\//,
  /\/admin\b/,
  /\/\.env/,
];

export interface ClassifierInput {
  action: string; // "ACCEPT" | "DENY" (from Cloud Armor outcome)
  userAgent: string;
  requestPath: string;
  ruleMatched: string;
}

export interface ClassifierOutput {
  ivtType: "GIVT" | "SIVT" | "suspicious" | "clean";
  confidence: number;
}

function isKnownBot(ua: string): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

function isSensitivePath(path: string): boolean {
  if (!path) return false;
  return SENSITIVE_PATHS.some((p) => p.test(path));
}

/**
 * Classify a single request using action, user-agent, and path signals.
 * Rules are evaluated in priority order — first match wins.
 */
export function classify(input: ClassifierInput): ClassifierOutput {
  const { action, userAgent, requestPath } = input;
  const isDenied = action === "DENY";

  // Priority 1 — GIVT: known legitimate crawlers/bots
  if (isKnownBot(userAgent)) {
    return { ivtType: "GIVT", confidence: 0.95 };
  }

  // Priority 2 — SIVT: denied by Cloud Armor, not a known bot
  if (isDenied) {
    return {
      ivtType: "SIVT",
      confidence: userAgent.trim() === "" ? 0.85 : 0.8,
    };
  }

  // Priority 3 — suspicious: accepted but missing UA
  if (userAgent.trim() === "") {
    return { ivtType: "suspicious", confidence: 0.65 };
  }

  // Priority 3 — suspicious: accepted but probing sensitive path
  if (isSensitivePath(requestPath)) {
    return { ivtType: "suspicious", confidence: 0.7 };
  }

  // Priority 4 — clean
  return { ivtType: "clean", confidence: 0.05 };
}
```

### **Step 4: Run test to verify it passes**

```bash
cd cloud-function && npx jest src/classifier.test.ts --no-coverage
```

Expected: PASS (10 tests)

### **Step 5: Commit**

```bash
git add cloud-function/src/classifier.ts cloud-function/src/classifier.test.ts
git commit -m "feat(cloud-function): add IVT classification engine with tests"
```

---

## Task 5: BigQuery writer

### **Files:**

- Create: `cloud-function/src/bigquery.ts`
- Create: `cloud-function/src/bigquery.test.ts`

### **Step 1: Write the failing test**

Create `cloud-function/src/bigquery.test.ts`:

```typescript
import { buildRow, IvtRow } from "./bigquery";

describe("buildRow", () => {
  it("maps all fields correctly", () => {
    const row = buildRow({
      insertId: "abc123",
      timestamp: "2026-03-04T10:00:00Z",
      sourceIp: "1.2.3.4",
      countryCode: "US",
      trafficSource: "topnetworks-armor-policy",
      ivtType: "clean",
      confidenceScore: 0.05,
      ruleMatched: "2147483647",
      actionTaken: "allow",
      userAgent: "Mozilla/5.0",
      requestPath: "/credit-cards",
    });

    expect(row).toEqual({
      id: "abc123",
      timestamp: "2026-03-04T10:00:00Z",
      source_ip: "1.2.3.4",
      country_code: "US",
      traffic_source: "topnetworks-armor-policy",
      ivt_type: "clean",
      confidence_score: 0.05,
      rule_matched: "2147483647",
      action_taken: "allow",
      user_agent: "Mozilla/5.0",
      request_path: "/credit-cards",
    });
  });

  it("handles null country code", () => {
    const row = buildRow({
      insertId: "xyz",
      timestamp: "2026-03-04T10:00:00Z",
      sourceIp: "10.0.0.1",
      countryCode: null,
      trafficSource: "policy",
      ivtType: "SIVT",
      confidenceScore: 0.8,
      ruleMatched: "1000",
      actionTaken: "deny",
      userAgent: "",
      requestPath: "/",
    });

    expect(row.country_code).toBeNull();
  });
});
```

### **Step 2: Run test to verify it fails**

```bash
cd cloud-function && npx jest src/bigquery.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './bigquery'`

### **Step 3: Write the implementation**

Create `cloud-function/src/bigquery.ts`:

```typescript
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
```

### **Step 4: Run test to verify it passes**

```bash
cd cloud-function && npx jest src/bigquery.test.ts --no-coverage
```

Expected: PASS (2 tests)

### **Step 5: Commit**

```bash
git add cloud-function/src/bigquery.ts cloud-function/src/bigquery.test.ts
git commit -m "feat(cloud-function): add BigQuery writer with row builder and tests"
```

---

## Task 6: Cloud Function entry point

### **Files:**

- Create: `cloud-function/src/index.ts`
- Create: `cloud-function/src/index.test.ts`

### **Step 1: Understand the Cloud Armor LogEntry structure**

A Cloud Armor `http_load_balancer` log entry decoded from Pub/Sub looks like:

```json
{
  "insertId": "unique-log-id",
  "timestamp": "2026-03-04T10:00:00.000Z",
  "httpRequest": {
    "remoteIp": "1.2.3.4",
    "userAgent": "Mozilla/5.0...",
    "requestUrl": "https://us.topfinanzas.com/credit-cards",
    "status": 200
  },
  "jsonPayload": {
    "enforcedSecurityPolicy": {
      "name": "topnetworks-armor-policy",
      "priority": 2147483647,
      "outcome": "ACCEPT",
      "configuredAction": "ALLOW"
    }
  }
}
```

### **Step 2: Write the failing test**

Create `cloud-function/src/index.test.ts`:

```typescript
import { parseLogEntry, LogEntry } from "./index";

const sampleEntry: LogEntry = {
  insertId: "abc123",
  timestamp: "2026-03-04T10:00:00Z",
  httpRequest: {
    remoteIp: "1.2.3.4",
    userAgent: "Mozilla/5.0 Chrome/120",
    requestUrl: "https://us.topfinanzas.com/credit-cards",
    status: 200,
  },
  jsonPayload: {
    enforcedSecurityPolicy: {
      name: "topnetworks-armor-policy",
      priority: 2147483647,
      outcome: "ACCEPT",
      configuredAction: "ALLOW",
    },
  },
};

describe("parseLogEntry", () => {
  it("extracts all fields from a complete log entry", () => {
    const parsed = parseLogEntry(sampleEntry);
    expect(parsed.insertId).toBe("abc123");
    expect(parsed.timestamp).toBe("2026-03-04T10:00:00Z");
    expect(parsed.sourceIp).toBe("1.2.3.4");
    expect(parsed.userAgent).toBe("Mozilla/5.0 Chrome/120");
    expect(parsed.requestPath).toBe("/credit-cards");
    expect(parsed.action).toBe("ACCEPT");
    expect(parsed.ruleMatched).toBe("2147483647");
    expect(parsed.trafficSource).toBe("topnetworks-armor-policy");
  });

  it("extracts path from requestUrl (strips domain)", () => {
    const entry = {
      ...sampleEntry,
      httpRequest: {
        ...sampleEntry.httpRequest,
        requestUrl: "https://example.com/some/deep/path?q=1",
      },
    };
    expect(parseLogEntry(entry).requestPath).toBe("/some/deep/path");
  });

  it("handles missing httpRequest fields gracefully", () => {
    const entry = {
      ...sampleEntry,
      httpRequest: { remoteIp: "5.5.5.5" },
    } as LogEntry;
    const parsed = parseLogEntry(entry);
    expect(parsed.sourceIp).toBe("5.5.5.5");
    expect(parsed.userAgent).toBe("");
    expect(parsed.requestPath).toBe("");
  });
});
```

### **Step 3: Run test to verify it fails**

```bash
cd cloud-function && npx jest src/index.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './index'`

### **Step 4: Write the implementation**

Create `cloud-function/src/index.ts`:

```typescript
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
```

### **Step 5: Run all tests**

```bash
cd cloud-function && npx jest --no-coverage
```

Expected: PASS (all tests across all files)

### **Step 6: Commit**

```bash
git add cloud-function/src/index.ts cloud-function/src/index.test.ts
git commit -m "feat(cloud-function): add Pub/Sub entry point with log parsing and tests"
```

---

## Task 7: GeoIP download script + build + deploy

### **Files:**

- Create: `cloud-function/scripts/download-geoip.sh`

### **Step 1: Create the download script**

Create `cloud-function/scripts/download-geoip.sh`:

```bash
#!/usr/bin/env bash
# Downloads the MaxMind GeoLite2-Country database.
# Requires: MAXMIND_LICENSE_KEY environment variable.
# Usage: bash scripts/download-geoip.sh

set -euo pipefail

LICENSE_KEY="${MAXMIND_LICENSE_KEY:?Error: MAXMIND_LICENSE_KEY environment variable is not set}"
DEST="$(dirname "$0")/../data/GeoLite2-Country.mmdb"
TMPDIR="$(mktemp -d)"

echo "Downloading GeoLite2-Country database..."
curl -sL \
  "https://download.maxmind.com/app/geoip_getters?edition_id=GeoLite2-Country&license_key=${LICENSE_KEY}&suffix=tar.gz" \
  -o "${TMPDIR}/geoip.tar.gz"

tar -xzf "${TMPDIR}/geoip.tar.gz" -C "${TMPDIR}"
MMDB="$(find "${TMPDIR}" -name "GeoLite2-Country.mmdb" | head -1)"
cp "${MMDB}" "${DEST}"
rm -rf "${TMPDIR}"

echo "GeoLite2-Country.mmdb saved to ${DEST}"
```

### **Step 2: Make it executable**

```bash
chmod +x cloud-function/scripts/download-geoip.sh
```

### **Step 3: Get your MaxMind license key**

Sign up at https://dev.maxmind.com/geoip/geolite2-free-geolocation-data — free account.
Create a license key (License Keys section). Copy it.

### **Step 4: Download the database**

```bash
cd cloud-function && MAXMIND_LICENSE_KEY=your_key_here bash scripts/download-geoip.sh
```

Expected: `GeoLite2-Country.mmdb saved to data/GeoLite2-Country.mmdb`
Verify: `ls -lh cloud-function/data/GeoLite2-Country.mmdb` → ~60 MB file

### **Step 5: Build TypeScript**

```bash
cd cloud-function && npm run build
```

Expected: `dist/` directory created with compiled JS files. No TypeScript errors.

### **Step 6: Commit**

```bash
git add cloud-function/scripts/download-geoip.sh
git commit -m "feat(cloud-function): add GeoIP database download script"
```

> Note: `.mmdb` file is gitignored and not committed. Run `download-geoip.sh` before every deploy.

### **Step 7: Deploy the Cloud Function**

```bash
cd cloud-function
gcloud functions deploy ivt-classifier \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --trigger-topic=armor-logs-topic \
  --entry-point=ivtClassifier \
  --memory=512MB \
  --timeout=60s \
  --service-account=traffic-genius-sa@absolute-brook-452020-d5.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT_ID=absolute-brook-452020-d5,BIGQUERY_DATASET=traffic_security_logs,BIGQUERY_TABLE=ivt_classifications,MAXMIND_LICENSE_KEY=YOUR_KEY \
  --source=. \
  --project=absolute-brook-452020-d5
```

> `--source=.` must be run from `cloud-function/` so `dist/` and `data/GeoLite2-Country.mmdb` are included.

Expected: `State: ACTIVE` in the output.

---

## Task 8: Verification

### **Step 1: Verify the function deployed**

```bash
gcloud functions describe ivt-classifier \
  --gen2 --region=us-central1 \
  --project=absolute-brook-452020-d5 \
  --format="value(state)"
```

Expected: `ACTIVE`

### **Step 2: Wait for live traffic and check BigQuery (15 minutes)**

```sql
-- Run in BigQuery console
SELECT COUNT(*) as row_count,
       MIN(timestamp) as oldest,
       MAX(timestamp) as newest,
       COUNTIF(ivt_type = 'GIVT') as givt,
       COUNTIF(ivt_type = 'SIVT') as sivt,
       COUNTIF(ivt_type = 'suspicious') as suspicious,
       COUNTIF(ivt_type = 'clean') as clean
FROM `absolute-brook-452020-d5.traffic_security_logs.ivt_classifications`
```

Expected: `row_count > 0`, timestamps recent.

### **Step 3: Check Cloud Function logs for any errors**

```bash
gcloud functions logs read ivt-classifier \
  --gen2 --region=us-central1 \
  --project=absolute-brook-452020-d5 \
  --limit=50
```

Look for: `Classified and inserted row` entries. No `ERROR` lines.

### **Step 4: Verify TrafficGenius dashboard**

Navigate to `https://trafficgenius.topnetworks.co/dashboard` — KPI cards should show non-zero values for Total Requests, with IVT Distribution chart populated.

### **Step 5: Final commit**

```bash
git add docs/plans/2026-03-04-ivt-classifier-implementation.md
git commit -m "docs: add IVT classifier implementation plan"
```

---

## Environment Variables Reference

| Variable              | Where set          | Value                      |
| --------------------- | ------------------ | -------------------------- |
| `GCP_PROJECT_ID`      | Cloud Function env | `absolute-brook-452020-d5` |
| `BIGQUERY_DATASET`    | Cloud Function env | `traffic_security_logs`    |
| `BIGQUERY_TABLE`      | Cloud Function env | `ivt_classifications`      |
| `MAXMIND_LICENSE_KEY` | Cloud Function env | Your MaxMind key           |

---

## Re-deploy Checklist (after code changes)

```bash
cd cloud-function
MAXMIND_LICENSE_KEY=your_key npm run build && \
  bash scripts/download-geoip.sh && \
  gcloud functions deploy ivt-classifier --gen2 --region=us-central1 \
    --source=. --project=absolute-brook-452020-d5 [... same flags as Task 7 Step 7]
```
