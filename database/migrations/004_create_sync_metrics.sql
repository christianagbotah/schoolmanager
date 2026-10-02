-- Migration: 004_create_sync_metrics
-- Description: Creates the sync_metrics table for performance monitoring
-- Created: 2024-01-20
-- Requirements: Requirement 20 - Sync Monitoring and Metrics

-- Create sync_metrics table
CREATE TABLE IF NOT EXISTS `sync_metrics` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `metric_name` VARCHAR(50) NOT NULL,
    `metric_value` DECIMAL(10,2) NOT NULL,
    `location_id` INT NULL,
    `table_name` VARCHAR(64) NULL,
    `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `metadata` JSON NULL,
    INDEX `idx_metric_name` (`metric_name`),
    INDEX `idx_recorded_at` (`recorded_at`),
    INDEX `idx_location` (`location_id`),
    INDEX `idx_table` (`table_name`),
    CONSTRAINT `fk_sync_metrics_location` 
        FOREIGN KEY (`location_id`) REFERENCES `location_registry`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default metrics for monitoring
INSERT INTO `sync_metrics` (`metric_name`, `metric_value`, `metadata`) VALUES
('sync_duration_avg', 0, '{"unit": "seconds"}'),
('records_synced_total', 0, '{"unit": "count"}'),
('records_failed_total', 0, '{"unit": "count"}'),
('conflicts_detected_total', 0, '{"unit": "count"}'),
('conflicts_resolved_total', 0, '{"unit": "count"}');
