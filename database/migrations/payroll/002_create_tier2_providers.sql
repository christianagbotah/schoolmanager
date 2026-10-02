-- ============================================================================
-- Tier 2 Provider System Migration
-- Creates table for managing SSNIT Tier 2 pension providers
-- ============================================================================

-- Create tier2_providers table
CREATE TABLE IF NOT EXISTS tier2_providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    provider_code VARCHAR(20) NOT NULL UNIQUE,
    contact_person VARCHAR(100) NULL,
    contact_email VARCHAR(100) NULL,
    contact_phone VARCHAR(20) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_provider_code (provider_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SSNIT Tier 2 pension providers for employee contribution tracking';
