-- ============================================================================
-- Add tier2_provider_id to pay_salary table
-- Links payroll records to Tier 2 pension providers
-- ============================================================================

-- Check if column exists, and add it if it doesn't
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pay_salary'
    AND COLUMN_NAME = 'tier2_provider_id'
);

-- Add column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE pay_salary ADD COLUMN tier2_provider_id INT NULL COMMENT ''Foreign key to tier2_providers table'' AFTER tier2_contribution',
    'SELECT ''Column tier2_provider_id already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pay_salary'
    AND INDEX_NAME = 'idx_tier2_provider'
);

SET @sql_index = IF(@index_exists = 0,
    'ALTER TABLE pay_salary ADD INDEX idx_tier2_provider (tier2_provider_id)',
    'SELECT ''Index idx_tier2_provider already exists'' AS message'
);

PREPARE stmt FROM @sql_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Foreign key constraint will be added after tier2_providers table is created
-- This is handled in a separate migration to ensure proper dependency order
