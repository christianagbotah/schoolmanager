-- ============================================================================
-- Deletion Tracking System - Database Migration
-- ============================================================================
-- Purpose: Create sync_deletions table for tracking DELETE operations
-- Version: 1.0
-- Date: 2026-05-30
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
-- ============================================================================

-- Create sync_deletions table
CREATE TABLE IF NOT EXISTS `sync_deletions` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `table_name` VARCHAR(100) NOT NULL COMMENT 'Name of the table where deletion occurred',
  `record_id` TEXT NOT NULL COMMENT 'JSON-encoded primary key(s) of deleted record',
  `deleted_at` DATETIME NOT NULL COMMENT 'Timestamp when record was deleted',
  `deleted_by` INT(11) UNSIGNED NULL DEFAULT NULL COMMENT 'User ID who performed deletion (NULL for system)',
  `device_id` VARCHAR(50) NOT NULL COMMENT 'Device that performed the deletion',
  `sync_status` ENUM('PENDING','SYNCED','FAILED','FAILED_PERMANENT') NOT NULL DEFAULT 'PENDING' COMMENT 'Sync status of this deletion',
  `last_modified_at` DATETIME NOT NULL COMMENT 'Last modification timestamp',
  `version` INT(11) NOT NULL DEFAULT 1 COMMENT 'Version for optimistic locking',
  `retry_count` INT(11) NOT NULL DEFAULT 0 COMMENT 'Number of sync retry attempts',
  `error_message` TEXT NULL DEFAULT NULL COMMENT 'Error message if sync failed',
  PRIMARY KEY (`id`),
  INDEX `idx_sync_status_table` (`sync_status`, `table_name`),
  INDEX `idx_table_deleted_at` (`table_name`, `deleted_at`),
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks DELETE operations for synchronization';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify table structure:
-- DESCRIBE sync_deletions;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS `sync_deletions`;

-- ============================================================================
-- Example Record_Identifier JSON Formats
-- ============================================================================
-- Single-column primary key:
--   {"id":"123"}
--
-- Composite primary key:
--   {"student_id":"456","class_id":"789"}
--
-- String primary key:
--   {"code":"ABC123"}
-- ============================================================================
