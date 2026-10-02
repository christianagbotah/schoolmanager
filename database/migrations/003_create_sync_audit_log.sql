-- Migration: 003_create_sync_audit_log
-- Description: Creates the sync_audit_log table for comprehensive sync operation tracking
-- Created: 2024-01-20
-- Requirements: Requirement 9, 10 - Sync Audit Trail and Revert Capability

-- Create sync_audit_log table
CREATE TABLE IF NOT EXISTS `sync_audit_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `table_name` VARCHAR(64) NOT NULL,
    `record_id` INT NOT NULL,
    `operation` ENUM('INSERT', 'UPDATE', 'DELETE', 'CONFLICT', 'REVERT') NOT NULL,
    `source_device_id` VARCHAR(50) NOT NULL,
    `target_device_id` VARCHAR(50) NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `sync_direction` ENUM('push', 'pull') NOT NULL,
    `synced_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `synced_by` INT NULL,
    `duration_ms` INT NULL,
    `status` ENUM('success', 'failed', 'conflict') DEFAULT 'success',
    `error_message` TEXT NULL,
    INDEX `idx_table_record` (`table_name`, `record_id`),
    INDEX `idx_device` (`source_device_id`),
    INDEX `idx_synced_at` (`synced_at`),
    INDEX `idx_operation` (`operation`),
    INDEX `idx_status` (`status`),
    INDEX `idx_direction` (`sync_direction`),
    CONSTRAINT `fk_sync_audit_log_synced_by` 
        FOREIGN KEY (`synced_by`) REFERENCES `admin`(`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
