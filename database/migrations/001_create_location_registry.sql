-- Migration: 001_create_location_registry
-- Description: Creates the location_registry table for multi-location sync support
-- Created: 2024-01-20
-- Requirements: Requirement 7 - Location Registry and Management

-- Create location_registry table
CREATE TABLE IF NOT EXISTS `location_registry` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `location_name` VARCHAR(100) NOT NULL,
    `device_id` VARCHAR(50) NOT NULL UNIQUE,
    `api_endpoint` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    `priority` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_sync_at` TIMESTAMP NULL,
    `last_sync_status` ENUM('success', 'failed', 'partial', 'pending') DEFAULT 'pending',
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `timezone` VARCHAR(50) DEFAULT 'UTC',
    `sync_enabled` BOOLEAN DEFAULT TRUE,
    `description` TEXT NULL,
    INDEX `idx_device_id` (`device_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_last_sync` (`last_sync_at`),
    INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default location for this server
INSERT INTO `location_registry` (`location_name`, `device_id`, `status`, `priority`, `description`)
SELECT 
    'Default Location',
    COALESCE(
        (SELECT `description` FROM `settings` WHERE `type` = 'device_id' LIMIT 1),
        'local-server-001'
    ),
    'active',
    1,
    'Default location for this server installation'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `location_registry` LIMIT 1);

-- Add location_id setting to settings table if not exists
INSERT IGNORE INTO `settings` (`type`, `description`)
VALUES ('location_id', (SELECT `id` FROM `location_registry` LIMIT 1));
