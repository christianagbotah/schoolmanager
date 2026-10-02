-- ============================================================================
-- TASK 17.4: Optimize audit log queries
-- ============================================================================
-- This migration adds composite indexes and optimizations for the audit_logs
-- table to improve query performance when filtering by common combinations
-- and implementing pagination for large result sets.
--
-- Requirements: 8.7 - Provide an admin interface to view audit logs with 
-- filtering by date, user, and employee
--
-- Performance Goals:
-- - Reduce query time for filtered searches from seconds to milliseconds
-- - Enable efficient pagination over large datasets (millions of records)
-- - Support fast lookups by module+record combination (audit trail)
-- ============================================================================

USE schoolmanager;

-- ============================================================================
-- ADD COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- ============================================================================

-- Index for filtering by module + date range (most common filter combination)
-- Used in: get_logs_by_module(), get_logs_filtered()
-- Query pattern: WHERE module = ? AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_module_created 
  ON audit_logs(module, created_at DESC)
  COMMENT 'Optimizes filtering by module and date range';

-- Index for filtering by user + date range
-- Used in: get_user_activity(), get_logs_filtered()
-- Query pattern: WHERE user_id = ? AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_user_created 
  ON audit_logs(user_id, created_at DESC)
  COMMENT 'Optimizes user activity queries with date filters';

-- Index for record history lookups (module + record_id combination)
-- Used in: get_logs_by_record()
-- Query pattern: WHERE module = ? AND record_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_module_record_created 
  ON audit_logs(module, record_id, created_at ASC)
  COMMENT 'Optimizes record history retrieval';

-- Index for record_id alone (used in search operations)
-- Used in: search_logs(), get_logs_filtered()
-- Query pattern: WHERE record_id = ?
CREATE INDEX IF NOT EXISTS idx_record_id 
  ON audit_logs(record_id)
  COMMENT 'Optimizes searches by record ID';

-- Composite index for action statistics queries
-- Used in: get_action_statistics()
-- Query pattern: WHERE created_at BETWEEN ? AND ? GROUP BY module, action
CREATE INDEX IF NOT EXISTS idx_created_module_action 
  ON audit_logs(created_at DESC, module, action)
  COMMENT 'Optimizes action statistics grouped queries';

-- ============================================================================
-- VERIFY INDEXES CREATED
-- ============================================================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    INDEX_COMMENT
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'audit_logs'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- QUERY PERFORMANCE TESTING
-- ============================================================================
-- Uncomment these queries to test index effectiveness with EXPLAIN

/*
-- Test 1: Module + date range filter (should use idx_module_created)
EXPLAIN SELECT * FROM audit_logs 
WHERE module = 'payroll' 
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC
LIMIT 50;

-- Test 2: User activity filter (should use idx_user_created)
EXPLAIN SELECT * FROM audit_logs
WHERE user_id = 1
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC
LIMIT 100;

-- Test 3: Record history (should use idx_module_record_created)
EXPLAIN SELECT * FROM audit_logs
WHERE module = 'payroll'
  AND record_id = '12345'
ORDER BY created_at ASC;

-- Test 4: Action statistics (should use idx_created_module_action)
EXPLAIN SELECT module, action, COUNT(*) as count
FROM audit_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY module, action
ORDER BY count DESC;

-- Test 5: Complex filter query (should use appropriate composite index)
EXPLAIN SELECT al.*, COALESCE(a.name, t.name, acc.name) as user_name
FROM audit_logs al
LEFT JOIN admin a ON al.user_id = a.admin_id
LEFT JOIN teacher t ON al.user_id = t.teacher_id  
LEFT JOIN accountant acc ON al.user_id = acc.accountant_id
WHERE al.module = 'payroll'
  AND DATE(al.created_at) >= '2024-01-01'
  AND DATE(al.created_at) <= '2024-12-31'
ORDER BY al.created_at DESC
LIMIT 50 OFFSET 0;
*/

-- ============================================================================
-- ANALYZE TABLE TO UPDATE STATISTICS
-- ============================================================================
-- This helps MySQL's query optimizer make better decisions

ANALYZE TABLE audit_logs;

-- ============================================================================
-- INDEX USAGE RECOMMENDATIONS
-- ============================================================================
-- The following indexes optimize specific query patterns:
--
-- 1. idx_module_created: Use for dashboard views, module-specific log pages
-- 2. idx_user_created: Use for user activity reports, security audits
-- 3. idx_module_record_created: Use for viewing change history of specific records
-- 4. idx_record_id: Use for search functionality across all modules
-- 5. idx_created_module_action: Use for analytics and reporting dashboards
--
-- Existing indexes remain for backward compatibility:
-- - idx_module_action: Fast filtering by module and action type
-- - idx_created_at: General date-based queries without other filters
-- - idx_user_id: Quick user lookup without date filtering
--
-- Query Builder Optimization:
-- When using CodeIgniter's query builder, the optimizer will automatically
-- choose the best index based on the WHERE clause columns and ORDER BY.
-- No code changes are required - queries will automatically become faster.
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To remove these indexes if needed:
/*
DROP INDEX IF EXISTS idx_module_created ON audit_logs;
DROP INDEX IF EXISTS idx_user_created ON audit_logs;
DROP INDEX IF EXISTS idx_module_record_created ON audit_logs;
DROP INDEX IF EXISTS idx_record_id ON audit_logs;
DROP INDEX IF EXISTS idx_created_module_action ON audit_logs;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Audit log query optimization migration completed successfully!' as status;
SELECT CONCAT('Total indexes on audit_logs table: ', COUNT(*)) as index_count
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'audit_logs';
