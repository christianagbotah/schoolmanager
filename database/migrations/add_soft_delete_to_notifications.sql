-- Migration: Add Soft Delete Support to Notifications Table
-- Date: 2026-05-29
-- Purpose: Add is_deleted column to support soft delete functionality for sync consistency

-- Add is_deleted column with default value 0 (not deleted)
ALTER TABLE notifications 
ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag: 0=active, 1=deleted' AFTER is_read;

-- Add index on is_deleted for query performance
ALTER TABLE notifications 
ADD INDEX idx_is_deleted (is_deleted);

-- Verify column was added successfully
SELECT 
    column_name, 
    column_type, 
    column_default, 
    is_nullable,
    column_comment
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'notifications'
  AND column_name = 'is_deleted';

-- Verify all existing records have is_deleted=0
SELECT 
    COUNT(*) as total_notifications,
    SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active_notifications,
    SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted_notifications
FROM notifications;

-- Expected result: total_notifications = active_notifications, deleted_notifications = 0
