-- ============================================================================
-- Payroll Approval Notifications Enhancement - Addon Tables Only
-- ============================================================================
-- This migration creates ONLY the new tables for payroll notifications.
-- It uses the EXISTING 'notifications' table that is already in production.
--
-- Tables created:
--   1. user_notification_preferences - SMS opt-in/opt-out settings
--   2. notification_delivery_log - Audit log for notification delivery
--
-- Requirements: 7.2, 7.3, 7.5, 7.7, 8.6, 10.1
-- ============================================================================

-- ============================================================================
-- Table: user_notification_preferences
-- Purpose: Stores user SMS notification preferences (opt-in/opt-out)
-- Requirements: 7.2, 7.5, 7.7
-- NOTE: user_id uses INT (signed) to match admin.admin_id data type for FK compatibility
-- ============================================================================
CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
    `preference_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL COMMENT 'User ID (references admin.admin_id - INT signed)',
    `sms_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = SMS disabled (opt-out), 1 = SMS enabled (opt-in)',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last preference update timestamp',
    
    PRIMARY KEY (`preference_id`),
    
    -- Unique constraint: one preference record per user
    UNIQUE KEY `uk_user_id` (`user_id`),
    
    -- Foreign key constraint to admin table
    CONSTRAINT `fk_user_notification_preferences_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `admin` (`admin_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User SMS notification preferences (default: opt-out)';


-- ============================================================================
-- Table: notification_delivery_log
-- Purpose: Audit log for all notification delivery attempts across channels
-- Requirements: 7.3, 8.6, 10.1
-- NOTE: notification_id uses INT (signed) to match existing notifications.notification_id
-- If you get error #3780, check DESCRIBE notifications; and update data type to match exactly
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notification_delivery_log` (
    `log_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `notification_id` INT NOT NULL COMMENT 'Related notification ID (references notifications.notification_id)',
    `channel` VARCHAR(20) NOT NULL COMMENT 'Delivery channel (sms, email, in_app)',
    `recipient` VARCHAR(255) NOT NULL COMMENT 'Recipient identifier (phone number, email, or user_id)',
    `status` VARCHAR(20) NOT NULL COMMENT 'Delivery status (sent, failed, pending)',
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Delivery attempt timestamp',
    `error_message` TEXT DEFAULT NULL COMMENT 'Error details if delivery failed',
    
    PRIMARY KEY (`log_id`),
    
    -- Performance indexes
    INDEX `idx_notification_id` (`notification_id`),
    INDEX `idx_channel` (`channel`),
    INDEX `idx_status` (`status`),
    INDEX `idx_sent_at` (`sent_at`),
    
    -- Foreign key constraint to existing notifications table
    CONSTRAINT `fk_notification_delivery_log_notification`
        FOREIGN KEY (`notification_id`)
        REFERENCES `notifications` (`notification_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for notification delivery attempts across all channels';


-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify the existing notifications table exists
SELECT 
    'Existing notifications table verified' AS verification,
    COUNT(*) AS table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'notifications';
-- Expected: 1

-- Verify new tables were created successfully
SELECT 
    'New notification tables created' AS verification,
    COUNT(*) AS table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('user_notification_preferences', 'notification_delivery_log');
-- Expected: 2

-- Verify foreign keys are set up correctly
SELECT 
    'Foreign keys created' AS verification,
    COUNT(*) AS fk_count
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND TABLE_NAME IN ('user_notification_preferences', 'notification_delivery_log');
-- Expected: 2

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 
    'Payroll Notification Addon Migration Completed Successfully' AS status,
    'Using existing notifications table + 2 new tables' AS note,
    NOW() AS completed_at;
