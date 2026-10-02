-- Migration: 002_create_sync_conflicts
-- Description: Creates the sync_conflicts table for conflict tracking
-- Created: 2024-01-20
-- Requirements: Requirement 3 - Configurable Conflict Resolution Strategies

-- Create sync_conflicts table
CREATE TABLE IF NOT EXISTS `sync_conflicts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `table_name` VARCHAR(64) NOT NULL,
    `record_id` INT NOT NULL,
    `local_device_id` VARCHAR(50) NOT NULL,
    `remote_device_id` VARCHAR(50) NOT NULL,
    `local_version` INT NOT NULL,
    `remote_version` INT NOT NULL,
    `local_data` JSON NOT NULL,
    `remote_data` JSON NOT NULL,
    `local_modified_at` TIMESTAMP NOT NULL,
    `remote_modified_at` TIMESTAMP NOT NULL,
    `conflict_strategy` VARCHAR(20) NOT NULL,
    `status` ENUM('pending', 'resolved', 'ignored') DEFAULT 'pending',
    `resolution` ENUM('local_wins', 'remote_wins', 'merged', 'ignored') NULL,
    `resolved_at` TIMESTAMP NULL,
    `resolved_by` INT NULL,
    `merged_data` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_table_record` (`table_name`, `record_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created` (`created_at`),
    INDEX `idx_local_device` (`local_device_id`),
    INDEX `idx_remote_device` (`remote_device_id`),
    CONSTRAINT `fk_sync_conflicts_resolved_by` 
        FOREIGN KEY (`resolved_by`) REFERENCES `admin`(`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
