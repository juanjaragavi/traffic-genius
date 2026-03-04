-- ============================================================
-- TrafficGenius — 003: Sites / Domain Management
-- Target: Cloud SQL PostgreSQL (traffic_genius database)
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  id                  SERIAL PRIMARY KEY,
  domain              VARCHAR(255) NOT NULL UNIQUE,
  label               VARCHAR(100) NOT NULL,
  cloud_armor_policy  VARCHAR(255),
  cloud_dns_zone      VARCHAR(255),
  backend_service     VARCHAR(255),
  compute_region      VARCHAR(50) DEFAULT 'global',
  status              VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive', 'pending')),
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites (domain);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites (status);
CREATE INDEX IF NOT EXISTS idx_sites_cloud_armor ON sites (cloud_armor_policy);
