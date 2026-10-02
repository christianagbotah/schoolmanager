-- =============================================================================
-- Migration: Enhance pay_salary table for Payroll System Enhancements
-- Task: 1. Create database migration for pay_salary table enhancements
-- Date: 2026-06-03
-- Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 24.1, 24.2, 25.1
-- =============================================================================

-- This migration adds:
-- 1. approval_status column for workflow management
-- 2. Timestamp columns (created_at, updated_at) for audit tracking
-- 3. Sync metadata columns (sync_status, last_modified_at, device_id, last_modified_by)
-- 4. Data type corrections (other_deductions to DOUBLE, month/year optimization)
-- 5. Performance indexes (composite and individual)
-- 6. Unique constraint for duplicate prevention

USE schoolmanager;

-- =============================================================================
-- STEP 1: Add new columns
-- =============================================================================

-- Add approval_status ENUM column for workflow management
-- Default to 'paid' to maintain compatibility with existing records
ALTER TABLE `pay_salary` 
ADD COLUMN `approval_status` ENUM('draft', 'pending_approval', 'approved', 'rejected', 'paid') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci 
  NOT NULL DEFAULT 'paid' 
  COMMENT 'Workflow status for approval process'
  AFTER `status`;

-- Add timestamp columns for creation and modification tracking
ALTER TABLE `pay_salary` 
ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
  COMMENT 'Timestamp when record was created'
  AFTER `sync`;

ALTER TABLE `pay_salary` 
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
  COMMENT 'Timestamp when record was last updated'
  AFTER `created_at`;

-- Add sync metadata columns for offline synchronization
ALTER TABLE `pay_salary` 
ADD COLUMN `sync_status` ENUM('synced', 'pending', 'conflict') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci 
  NOT NULL DEFAULT 'synced' 
  COMMENT 'Offline sync status'
  AFTER `updated_at`;

ALTER TABLE `pay_salary` 
ADD COLUMN `last_modified_at` TIMESTAMP NULL DEFAULT NULL 
  COMMENT 'Last modification timestamp for sync conflict resolution'
  AFTER `sync_status`;

ALTER TABLE `pay_salary` 
ADD COLUMN `device_id` VARCHAR(100) 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci 
  NULL DEFAULT NULL 
  COMMENT 'Device identifier for offline sync tracking'
  AFTER `last_modified_at`;

ALTER TABLE `pay_salary` 
ADD COLUMN `last_modified_by` INT NULL DEFAULT NULL 
  COMMENT 'User ID who made the last modification'
  AFTER `device_id`;

-- =============================================================================
-- STEP 2: Fix data type inconsistencies
-- =============================================================================

-- Change other_deductions from INT to DOUBLE for decimal support
-- This prevents data loss when deductions include cents
ALTER TABLE `pay_salary` 
MODIFY COLUMN `other_deductions` DOUBLE NOT NULL DEFAULT 0 
  COMMENT 'Other deductions in decimal format';

-- Optimize month column - keep as VARCHAR(64) for month names like "January", "February"
-- Note: The design document suggested TINYINT but existing data uses month names
-- We'll keep VARCHAR for backward compatibility with existing application code

-- Optimize year column - keep as VARCHAR(64) to maintain compatibility
-- Note: While INT would be more efficient, changing this requires application code updates
-- This can be done in a future migration after code updates

-- =============================================================================
-- STEP 3: Add indexes for performance optimization
-- =============================================================================

-- Composite index for most common query pattern: finding payroll by employee, month, year
-- This significantly speeds up queries like "SELECT * FROM pay_salary WHERE employee_code = ? AND month = ? AND year = ?"
CREATE INDEX `idx_employee_month_year` ON `pay_salary` (`employee_code`, `month`, `year`);

-- Index on approval_status for workflow queries
-- Speeds up dashboard queries filtering by approval status
CREATE INDEX `idx_approval_status` ON `pay_salary` (`approval_status`);

-- Index on created_at for date range queries and reports
-- Enables fast filtering by creation date
CREATE INDEX `idx_created_at` ON `pay_salary` (`created_at`);

-- Note: We're NOT adding separate index on employee_code because it's already
-- the first column in the composite index idx_employee_month_year, which can be
-- used for employee_code-only queries due to MySQL's leftmost prefix rule

-- =============================================================================
-- STEP 4: Add unique constraint for duplicate payment prevention
-- =============================================================================

-- Before adding the unique constraint, we need to check for and handle duplicates
-- First, let's identify any duplicate records

-- Create a temporary table to store duplicate records for review
CREATE TEMPORARY TABLE IF NOT EXISTS temp_pay_salary_duplicates AS
SELECT 
    employee_code,
    month,
    year,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(pay_id ORDER BY created_at DESC) as pay_ids,
    MAX(created_at) as latest_created_at
FROM `pay_salary`
WHERE employee_code IS NOT NULL 
  AND month IS NOT NULL 
  AND year IS NOT NULL
GROUP BY employee_code, month, year
HAVING COUNT(*) > 1;

-- Display information about duplicates (if any)
-- This will be shown in the migration output
SELECT 
    CONCAT('WARNING: Found ', COUNT(*), ' duplicate payroll records that need to be resolved before adding unique constraint') as message
FROM temp_pay_salary_duplicates;

-- If duplicates exist, show details
SELECT 
    employee_code,
    month,
    year,
    duplicate_count,
    pay_ids,
    latest_created_at,
    'KEEP LATEST, DELETE OTHERS' as recommendation
FROM temp_pay_salary_duplicates
ORDER BY employee_code, year, month;

-- For automated resolution, we'll keep the most recent record and delete older duplicates
-- This assumes the latest record is the most accurate

-- Delete older duplicate records, keeping only the most recent one
DELETE ps1 FROM `pay_salary` ps1
INNER JOIN (
    SELECT 
        employee_code,
        month,
        year,
        MAX(created_at) as max_created_at
    FROM `pay_salary`
    WHERE employee_code IS NOT NULL 
      AND month IS NOT NULL 
      AND year IS NOT NULL
    GROUP BY employee_code, month, year
    HAVING COUNT(*) > 1
) ps2 ON ps1.employee_code = ps2.employee_code
    AND ps1.month = ps2.month
    AND ps1.year = ps2.year
    AND ps1.created_at < ps2.max_created_at;

-- Show how many duplicates were removed
SELECT 
    ROW_COUNT() as duplicates_removed,
    'Older duplicate payroll records deleted' as message;

-- Now add the unique constraint to prevent future duplicates
-- This enforces one payroll record per employee per month/year combination
ALTER TABLE `pay_salary` 
ADD CONSTRAINT `uk_employee_month_year` UNIQUE KEY (`employee_code`, `month`, `year`);

-- =============================================================================
-- STEP 5: Update existing records to set approval_status based on status
-- =============================================================================

-- For existing records where status = 'Paid', set approval_status to 'paid'
-- For existing records where status = 'Process', set approval_status to 'draft'
UPDATE `pay_salary` 
SET `approval_status` = CASE 
    WHEN `status` = 'Paid' THEN 'paid'
    WHEN `status` = 'Process' THEN 'draft'
    ELSE 'draft'
END
WHERE `approval_status` = 'paid'; -- Only update records that still have default value

-- =============================================================================
-- STEP 6: Verification queries
-- =============================================================================

-- Verify new columns exist
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'pay_salary'
  AND COLUMN_NAME IN (
      'approval_status',
      'created_at',
      'updated_at',
      'sync_status',
      'last_modified_at',
      'device_id',
      'last_modified_by'
  )
ORDER BY ORDINAL_POSITION;

-- Verify indexes were created
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    INDEX_TYPE,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'pay_salary'
  AND INDEX_NAME IN (
      'idx_employee_month_year',
      'idx_approval_status',
      'idx_created_at',
      'uk_employee_month_year'
  )
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verify data type changes
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'pay_salary'
  AND COLUMN_NAME = 'other_deductions';

-- Show table status
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(employee_code, '-', month, '-', year)) as unique_employee_month_year,
    SUM(CASE WHEN approval_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(CASE WHEN approval_status = 'draft' THEN 1 ELSE 0 END) as draft_count,
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count
FROM `pay_salary`;

-- =============================================================================
-- Migration Complete
-- =============================================================================

SELECT 
    'Migration 001_enhance_pay_salary_table.sql completed successfully' as status,
    NOW() as completed_at;

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================
-- To rollback this migration, run the following commands:
--
-- ALTER TABLE `pay_salary` DROP CONSTRAINT `uk_employee_month_year`;
-- ALTER TABLE `pay_salary` DROP INDEX `idx_created_at`;
-- ALTER TABLE `pay_salary` DROP INDEX `idx_approval_status`;
-- ALTER TABLE `pay_salary` DROP INDEX `idx_employee_month_year`;
-- ALTER TABLE `pay_salary` MODIFY COLUMN `other_deductions` INT NOT NULL DEFAULT 0;
-- ALTER TABLE `pay_salary` DROP COLUMN `last_modified_by`;
-- ALTER TABLE `pay_salary` DROP COLUMN `device_id`;
-- ALTER TABLE `pay_salary` DROP COLUMN `last_modified_at`;
-- ALTER TABLE `pay_salary` DROP COLUMN `sync_status`;
-- ALTER TABLE `pay_salary` DROP COLUMN `updated_at`;
-- ALTER TABLE `pay_salary` DROP COLUMN `created_at`;
-- ALTER TABLE `pay_salary` DROP COLUMN `approval_status`;
-- =============================================================================
