-- Migration: 005_extend_sync_metadata
-- Description: Extends sync_metadata table with conflict resolution and real-time sync columns
-- Created: 2024-01-20
-- Requirements: Requirement 3, 6, 11 - Conflict Strategy, Real-time Sync, Data Partitioning

-- Add new columns to sync_metadata table
ALTER TABLE `sync_metadata` 
ADD COLUMN IF NOT EXISTS `conflict_strategy` ENUM('REMOTE_WINS', 'LOCAL_WINS', 'TIMESTAMP_WINS', 'VERSION_WINS', 'MANUAL_REVIEW') 
    DEFAULT 'TIMESTAMP_WINS' AFTER `sync_enabled`,
ADD COLUMN IF NOT EXISTS `real_time_sync` BOOLEAN DEFAULT FALSE AFTER `conflict_strategy`,
ADD COLUMN IF NOT EXISTS `data_scope` ENUM('GLOBAL', 'LOCATION_LOCAL', 'LOCATION_SHARED') 
    DEFAULT 'GLOBAL' AFTER `real_time_sync`,
ADD COLUMN IF NOT EXISTS `sync_targets` JSON NULL AFTER `data_scope`,
ADD COLUMN IF NOT EXISTS `priority` INT DEFAULT 0 AFTER `sync_targets`;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS `idx_conflict_strategy` ON `sync_metadata` (`conflict_strategy`);
CREATE INDEX IF NOT EXISTS `idx_real_time_sync` ON `sync_metadata` (`real_time_sync`);
CREATE INDEX IF NOT EXISTS `idx_data_scope` ON `sync_metadata` (`data_scope`);

-- Set default conflict strategies for critical tables
UPDATE `sync_metadata` SET `conflict_strategy` = 'MANUAL_REVIEW' 
WHERE `table_name` IN ('payment', 'invoice', 'daily_fee_wallet', 'daily_fee_transactions');

-- Set real-time sync for financial tables
UPDATE `sync_metadata` SET `real_time_sync` = TRUE 
WHERE `table_name` IN ('payment', 'invoice');

-- Set default conflict strategies for other tables
UPDATE `sync_metadata` SET `conflict_strategy` = 'TIMESTAMP_WINS' 
WHERE `table_name` IN ('student', 'attendance', 'teacher');

UPDATE `sync_metadata` SET `conflict_strategy` = 'VERSION_WINS' 
WHERE `table_name` IN ('exam_marks', 'grade');

UPDATE `sync_metadata` SET `conflict_strategy` = 'REMOTE_WINS' 
WHERE `table_name` IN ('discount_profiles', 'discount_categories');

UPDATE `sync_metadata` SET `conflict_strategy` = 'LOCAL_WINS' 
WHERE `table_name` IN ('admin');
