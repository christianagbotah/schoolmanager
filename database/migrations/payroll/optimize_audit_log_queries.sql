-- ============================================================================
-- TASK 17.4: Optimize audit log queries
-- ============================================================================
-- This migration adds composite indexes for the audit_logs table to improve 
-- query performance when filtering by common combinations.
--
-- Requirements: 8.7 - Provide an admin interface to view audit logs
-- 
-- IMPORTANT: Run this migration after selecting your target database.
-- This file does not specify a database name, making it reusable across
-- different database instances.
-- ============================================================================

-- ============================================================================
-- ADD COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- ============================================================================
-- Note: These indexes will fail if they already exist, which is safe to ignore

-- Index for filtering by module + date range (most common filter combination)
-- Query pattern: WHERE module = ? AND created_at BETWEEN ? AND ?
CREATE INDEX idx_module_created ON audit_logs(module, created_at DESC);

-- Index for filtering by user + date range
-- Query pattern: WHERE user_id = ? AND created_at BETWEEN ? AND ?
CREATE INDEX idx_user_created ON audit_logs(user_id, created_at DESC);

-- Index for record history lookups (module + record_id combination)
-- Query pattern: WHERE module = ? AND record_id = ? ORDER BY created_at
CREATE INDEX idx_module_record_created ON audit_logs(module, record_id, created_at ASC);

-- Index for record_id alone (used in search operations)
-- Query pattern: WHERE record_id = ?
CREATE INDEX idx_record_id ON audit_logs(record_id);

-- Composite index for action statistics queries
-- Query pattern: WHERE created_at BETWEEN ? AND ? GROUP BY module, action
CREATE INDEX idx_created_module_action ON audit_logs(created_at DESC, module, action);

-- ============================================================================
-- ANALYZE TABLE TO UPDATE STATISTICS
-- ============================================================================

ANALYZE TABLE audit_logs;

-- ============================================================================
-- INDEX USAGE RECOMMENDATIONS
-- ============================================================================
-- The following indexes optimize specific query patterns:
--
-- 1. idx_module_created: Dashboard views, module-specific log pages
-- 2. idx_user_created: User activity reports, security audits
-- 3. idx_module_record_created: Change history of specific records
-- 4. idx_record_id: Search functionality across all modules
-- 5. idx_created_module_action: Analytics and reporting dashboards
-- ============================================================================

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Audit log query optimization migration completed successfully!' as status;
