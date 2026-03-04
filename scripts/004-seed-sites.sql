-- ============================================================
-- TrafficGenius — 004: Seed TopNetworks Properties
-- ============================================================

INSERT INTO sites (domain, label, cloud_armor_policy, backend_service, status, metadata)
VALUES
  (
    'us.topfinanzas.com',
    'TopFinance US',
    'default-security-policy-for-backend-service-ops-topfinanzas-com',
    'ops-topfinanzas-com-backend-service',
    'active',
    '{"market": "United States", "language": "en-US", "port": 3040}'
  ),
  (
    'topfinanzas.com/mx/',
    'TopFinanzas MX',
    'default-security-policy-for-backend-service',
    'co-topfinanzas-com-backend',
    'active',
    '{"market": "Mexico", "language": "es-MX"}'
  ),
  (
    'uk.topfinanzas.com',
    'TopFinance UK',
    'default-security-policy-for-backend-service-2',
    'topfinanzas-test-backend',
    'active',
    '{"market": "United Kingdom", "language": "en-GB", "port": 3004}'
  ),
  (
    'budgetbeepro.com',
    'BudgetBee',
    NULL,
    NULL,
    'active',
    '{"market": "United States", "language": "en-US", "brand": "BudgetBee"}'
  ),
  (
    'kardtrust.com',
    'KardTrust',
    NULL,
    NULL,
    'active',
    '{"market": "Multi-market", "language": "en-US", "brand": "KardTrust"}'
  )
ON CONFLICT (domain) DO NOTHING;
