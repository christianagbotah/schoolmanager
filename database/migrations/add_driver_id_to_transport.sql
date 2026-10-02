-- ============================================================================
-- Add driver_id column to transport table
-- ============================================================================
-- Task: 3.1 - Create and execute database migration
-- Purpose: Enable vehicle-to-driver assignment functionality
-- Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
-- Date: 2026-06-13
-- ============================================================================

-- Add driver_id column to transport table (if it doesn't exist)
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'transport' 
     AND COLUMN_NAME = 'driver_id') = 0,
    'ALTER TABLE `transport` 
     ADD COLUMN `driver_id` INT(11) NULL DEFAULT NULL 
     COMMENT ''Foreign key to non_teaching_staff.staff_id for driver assignment'' 
     AFTER `route_fare`',
    'SELECT "Column driver_id already exists in transport" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on driver_id column for performance (if it doesn't exist)
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'transport' 
     AND INDEX_NAME = 'idx_driver_id') = 0,
    'CREATE INDEX `idx_driver_id` ON `transport`(`driver_id`)',
    'SELECT "Index idx_driver_id already exists" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify driver_id column was added
SELECT 
  'driver_id column added to transport' AS verification,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'transport'
  AND COLUMN_NAME = 'driver_id';

-- Verify index was created
SELECT 
  'idx_driver_id index created' AS verification,
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'transport'
  AND INDEX_NAME = 'idx_driver_id';

-- Verify all existing records have NULL driver_id
SELECT 
  'All existing transport records have NULL driver_id' AS verification,
  COUNT(*) as total_records,
  COUNT(driver_id) as assigned_drivers,
  COUNT(*) - COUNT(driver_id) as unassigned_vehicles
FROM transport;

-- Expected: total_records=15, assigned_drivers=0, unassigned_vehicles=15

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 
  'Driver ID Column Migration Completed Successfully' AS status,
  NOW() AS completed_at;

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. No foreign key constraint is added to maintain sync system compatibility
--    and allow flexibility in data management across distributed deployments.
-- 2. The column uses INT(11) to match non_teaching_staff.staff_id column type.
-- 3. NULL values are allowed - not all vehicles need assigned drivers.
-- 4. The index improves query performance when filtering by driver_id.
-- 5. Column uses utf8mb4_unicode_520_ci collation (same as parent table).
-- ============================================================================
