-- ============================================================================
-- Check existing table structures for foreign key compatibility
-- ============================================================================

-- Check notifications table structure
DESCRIBE notifications;

-- Check notification_id column specifically
SHOW COLUMNS FROM notifications LIKE 'notification_id';

-- Check admin table primary key
DESCRIBE admin;

-- Check admin_id column specifically
SHOW COLUMNS FROM admin LIKE 'admin_id';

-- Show all foreign keys in the database
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND (TABLE_NAME = 'user_notification_preferences' OR TABLE_NAME = 'notification_delivery_log')
ORDER BY TABLE_NAME, COLUMN_NAME;
