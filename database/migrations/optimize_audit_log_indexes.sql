-- Task 17.4: Optimize audit log queries with indexes
-- Migration: Add indexes to audit_logs table for faster querying
-- Requirements: 8.7

-- Check if indexes exist before creating them
SET @exist_module := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                       WHERE table_schema = DATABASE() 
                       AND table_name = 'audit_logs' 
                       AND index_name = 'idx_module_action');

SET @exist_created := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                        WHERE table_schema = DATABASE() 
                        AND table_name = 'audit_logs' 
                        AND index_name = 'idx_created_at');

SET @exist_user := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE table_schema = DATABASE() 
                     AND table_name = 'audit_logs' 
                     AND index_name = 'idx_user_id_created');

SET @exist_module_created := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                               WHERE table_schema = DATABASE() 
                               AND table_name = 'audit_logs' 
                               AND index_name = 'idx_module_created_at');

-- Create composite index on (module, action) for filtering by module and action
SET @sql_module_action = IF(@exist_module = 0,
    'CREATE INDEX idx_module_action ON audit_logs(module, action)',
    'SELECT "Index idx_module_action already exists"');
PREPARE stmt FROM @sql_module_action;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index on created_at for date range queries
SET @sql_created = IF(@exist_created = 0,
    'CREATE INDEX idx_created_at ON audit_logs(created_at DESC)',
    'SELECT "Index idx_created_at already exists"');
PREPARE stmt FROM @sql_created;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create composite index on (user_id, created_at) for user activity queries
SET @sql_user_created = IF(@exist_user = 0,
    'CREATE INDEX idx_user_id_created ON audit_logs(user_id, created_at DESC)',
    'SELECT "Index idx_user_id_created already exists"');
PREPARE stmt FROM @sql_user_created;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create composite index on (module, created_at) for module-specific date range queries
SET @sql_module_created = IF(@exist_module_created = 0,
    'CREATE INDEX idx_module_created_at ON audit_logs(module, created_at DESC)',
    'SELECT "Index idx_module_created_at already exists"');
PREPARE stmt FROM @sql_module_created;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify indexes were created
SELECT 
    table_name,
    index_name,
    column_name,
    seq_in_index
FROM information_schema.statistics
WHERE table_schema = DATABASE()
AND table_name = 'audit_logs'
AND index_name LIKE 'idx_%'
ORDER BY index_name, seq_in_index;

-- Show query optimization improvement
EXPLAIN SELECT * FROM audit_logs 
WHERE module = 'payroll' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC
LIMIT 50;

