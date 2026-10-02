-- Migration: Add sync_interval and updated_at columns to location_registry
-- Description: Adds sync_interval column to store sync frequency in minutes and updated_at for tracking updates
-- Created: 2026-05-12

-- Add sync_interval column
ALTER TABLE `location_registry` 
ADD COLUMN `sync_interval` INT DEFAULT 15 COMMENT 'Sync interval in minutes' 
AFTER `sync_enabled`;

-- Add updated_at column
ALTER TABLE `location_registry` 
ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
AFTER `created_at`;

-- Update existing records to have default values
UPDATE `location_registry` 
SET `sync_interval` = 15,
    `updated_at` = `created_at`
WHERE `sync_interval` IS NULL;
