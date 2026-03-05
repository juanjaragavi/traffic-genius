# IVT Classifier Cloud Function — Design Document

**Date:** 2026-03-04
**Project:** TrafficGenius (`traffic-genius`)
**GCP Project:** `absolute-brook-452020-d5`
**Status:** Approved — pending implementation

---

## Problem

The TrafficGenius dashboard reads IVT and traffic metrics exclusively from the BigQuery table
`traffic_security_logs.ivt_classifications`. That table is empty because no pipeline exists to
populate it. Cloud Armor emits detailed logs to Cloud Logging (verbose logging now enabled on
`topnetworks-armor-policy`), but there is no mechanism to transform those logs into the
structured, classified rows the dashboard expects.

---2.

## Solution

A Cloud Function (`ivt-classifier`) that sits between Cloud Logging and BigQuery:

1. Cloud Logging routes `http_load_balancer` log entries to a Pub/Sub topic via a Log Sink.
2. The Cloud Function is triggered by each Pub/Sub message.
3. It extracts raw fields from the log entry, enriches with GeoIP country lookup, classifies
   traffic as GIVT / SIVT / suspicious / clean, and inserts a structured row into BigQuery.

---

## Architecture

```
Cloud Armor → Cloud Logging
                  │
                  ▼
    [Pub/Sub topic: armor-logs-topic]      ← replaces existing BigQuery sink
                  │
                  ▼
    [Cloud Function: ivt-classifier]
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
   MaxMind    Known-bot   Cloud Armor
   GeoLite2   UA list     action_taken
   (country)  (GIVT/SIVT) (deny/allow)
                  │
                  ▼
    BigQuery: ivt_classifications
                  │
                  ▼
    TrafficGenius Dashboard
```

---

## File Structure

```
cloud-function/                        # New directory in this repo
├── src/
│   ├── index.ts                       # Cloud Function entry point (Pub/Sub handler)
│   ├── classifier.ts                  # IVT classification engine
│   ├── geoip.ts                       # MaxMind GeoLite2 wrapper (load + lookup)
│   └── bigquery.ts                    # BigQuery insert with insertId deduplication
├── data/
│   ├── known-bots.json                # Bot UA regex patterns (checked in)
│   └── GeoLite2-Country.mmdb          # gitignored — downloaded by setup script
├── scripts/
│   └── download-geoip.sh              # Downloads .mmdb using MAXMIND_LICENSE_KEY
├── package.json                       # Node.js 20 deps: @google-cloud/bigquery, maxmind,
│                                      #   @google-cloud/functions-framework
├── tsconfig.json
└── .gcloudignore                      # Excludes node_modules, src/ (deploys compiled JS)
```

---

## Classification Logic

Signals available per log entry: `source_ip`, `user_agent`, `request_path`, `action_taken`
(ACCEPT / DENY), `rule_matched` (Cloud Armor rule priority).

Rules evaluated in priority order — first match wins:

| Priority | `ivt_type`   | Condition                                                                | `confidence_score`         |
| -------- | ------------ | ------------------------------------------------------------------------ | -------------------------- |
| 1        | `GIVT`       | UA matches known-bot list (Googlebot, bingbot, Slurp, Baiduspider, etc.) | `0.95`                     |
| 2        | `SIVT`       | `action = DENY` + UA not in known-bot list                               | `0.85` (empty UA) / `0.80` |
| 3        | `suspicious` | `action = ACCEPT` + empty UA                                             | `0.65`                     |
| 3        | `suspicious` | `action = ACCEPT` + path matches sensitive patterns                      | `0.70`                     |
| 4        | `clean`      | Everything else (accepted, non-empty UA, normal path)                    | `0.05`                     |

Sensitive path patterns: `/.git`, `/wp-admin`, `/etc/`, `/admin`, `/.env`.

---

## Field Mapping

```
LogEntry field                               → ivt_classifications column
─────────────────────────────────────────────────────────────────────────
logEntry.insertId                            → id  (BigQuery insertId for deduplication)
logEntry.timestamp                           → timestamp
httpRequest.remoteIp                         → source_ip
httpRequest.userAgent                        → user_agent
httpRequest.requestUrl (path extracted)      → request_path
jsonPayload.enforcedSecurityPolicy.priority  → rule_matched
jsonPayload.enforcedSecurityPolicy.outcome   → action_taken (ACCEPT→allow, DENY→deny)
jsonPayload.enforcedSecurityPolicy.name      → traffic_source
GeoLite2 lookup on source_ip                → country_code
Classification engine output                 → ivt_type, confidence_score
```

---

## GeoIP

- **Database:** MaxMind GeoLite2-Country (`.mmdb` binary, ~60 MB)
- **Package:** `maxmind` npm package (pure JS reader, no native bindings)
- **Loading:** Once at cold start, cached in module scope
- **Key storage:** `MAXMIND_LICENSE_KEY` Cloud Function environment variable
- **Refresh:** `scripts/download-geoip.sh` downloads fresh `.mmdb` before each deploy
- **Fallback:** `country_code = null` if IP not found in database

---

## Infrastructure

### GCP Resources

| Resource        | Name                   | Notes                                                  |
| --------------- | ---------------------- | ------------------------------------------------------ |
| Pub/Sub topic   | `armor-logs-topic`     | New                                                    |
| Log Sink        | `armor-logs-to-pubsub` | Replaces `armor-logs-to-bigquery`                      |
| Cloud Function  | `ivt-classifier`       | Gen 2, Node.js 20, 512 MB, us-central1                 |
| Service account | `traffic-genius-sa`    | Already has `bigquery.dataEditor` + `bigquery.jobUser` |

### Log Sink Filter (unchanged from previous sink)

```
resource.type="http_load_balancer"
jsonPayload.enforcedSecurityPolicy.name!=""
```

### Setup Commands (run once)

```bash
# 1. Create Pub/Sub topic
gcloud pubsub topics create armor-logs-topic \
  --project=absolute-brook-452020-d5

# 2. Delete existing BigQuery sink
gcloud logging sinks delete armor-logs-to-bigquery \
  --project=absolute-brook-452020-d5

# 3. Create new Pub/Sub sink
gcloud logging sinks create armor-logs-to-pubsub \
  pubsub.googleapis.com/projects/absolute-brook-452020-d5/topics/armor-logs-topic \
  --log-filter='resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.name!=""' \
  --project=absolute-brook-452020-d5

# 4. Grant Cloud Logging write permission to topic
gcloud pubsub topics add-iam-policy-binding armor-logs-topic \
  --member="serviceAccount:$(gcloud logging sinks describe armor-logs-to-pubsub \
    --project=absolute-brook-452020-d5 --format='value(writerIdentity)')" \
  --role="roles/pubsub.publisher" \
  --project=absolute-brook-452020-d5

# 5. Deploy (run after code is built)
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
  --source=cloud-function/ \
  --project=absolute-brook-452020-d5
```

---

## Reliability

- **Deduplication:** BigQuery insert uses `logEntry.insertId` as row insert ID — Pub/Sub
  at-least-once delivery is safe; duplicate messages produce no duplicate rows.
- **Retries:** On error, function throws → Pub/Sub nacks message → automatic retry with
  exponential backoff (up to 7 days).
- **Cold start:** MaxMind DB and known-bots list loaded once per instance into module scope.
  Estimated cold start: ~800ms. Warm invocations: <50ms.
- **Backlog:** Pub/Sub queues messages for 7 days. Commands 1–4 can be run before the
  function is deployed; queued messages are processed on first deploy.

---

## Decisions Not Made

- **GeoIP refresh cadence:** MaxMind releases GeoLite2-Country updates on Tuesdays.
  A weekly CI/CD step or manual pre-deploy run of `download-geoip.sh` is sufficient.
  Automated weekly refresh not in scope for v1.
- **Rules preview-mode removal:** Switching Cloud Armor rules from preview to enforce is a
  separate traffic-impact change to be done after metrics are confirmed flowing.
