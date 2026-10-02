-- ============================================================================
-- Seed Tier 2 Providers
-- Populates tier2_providers table with common Ghana pension providers
-- ============================================================================

-- Insert common Tier 2 providers in Ghana
INSERT INTO tier2_providers (provider_name, provider_code, is_active) VALUES
('Not Set', 'NOTSET', 1),
('Enterprise Trustees', 'ENTERPRISE', 1),
('Old Mutual', 'OLDMUTUAL', 1),
('Glico Pensions', 'GLICO', 1),
('Metropolitan Pensions', 'METROPOLITAN', 1),
('Pension Alliance Trust', 'PAT', 1),
('First National Benefits Trust', 'FNBT', 1),
('Apex Trust', 'APEX', 1),
('NASLA Trust', 'NASLA', 1),
('Daakye Trust', 'DAAKYE', 1)
ON DUPLICATE KEY UPDATE 
    provider_name = VALUES(provider_name),
    is_active = VALUES(is_active);

-- Note: "Not Set" is used when no specific provider is assigned
