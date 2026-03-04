-- ============================================================
-- TrafficGenius — 002: Application Tables
-- Target: Cloud SQL PostgreSQL (traffic_genius database)
-- ============================================================

-- Audit log for Cloud Armor rule changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(50) NOT NULL,       -- CREATE | UPDATE | DELETE | TOGGLE
  resource    VARCHAR(100) NOT NULL,       -- e.g. "security-policy:my-policy"
  details     JSONB DEFAULT '{}',          -- change payload
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User dashboard preferences (saved filters, chart config)
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
