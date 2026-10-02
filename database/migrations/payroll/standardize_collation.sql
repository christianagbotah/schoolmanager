-- ============================================================================
-- Database Collation Standardization Migration
-- ============================================================================
-- Purpose: Convert all tables to use consistent utf8mb4_unicode_520_ci collation
--          to prevent "Illegal mix of collations" errors when comparing strings
--          across tables in JOIN or WHERE clauses.
--
-- Issue: Mixed collations (utf8mb4_unicode_520_ci vs utf8mb4_unicode_ci vs 
--        utf8mb4_0900_ai_ci) cause query failures.
--
-- Target Collation: utf8mb4_unicode_520_ci (Unicode 5.2.0 standard)
--        This collation provides good compatibility with existing data while
--        ensuring consistent string comparison behavior across all tables.
--
-- IMPORTANT: Back up your database before running this migration!
--
-- Rollback: If you need to revert, use similar ALTER TABLE statements but
--           specify the original collation for each table.
-- ============================================================================

-- Step 1: Identify tables with non-standard collations
-- Run this query first to see which tables will be affected:
/*
SELECT 
    TABLE_NAME, 
    TABLE_COLLATION,
    ENGINE
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE = 'BASE TABLE'
    AND TABLE_COLLATION != 'utf8mb4_unicode_520_ci'
ORDER BY TABLE_NAME;
*/

-- Step 2: Convert all tables to utf8mb4_unicode_520_ci
-- This will convert the table's default collation and all string columns

-- Note: The ALTER TABLE ... CONVERT TO syntax converts:
-- 1. The table's default collation
-- 2. All character/text columns to the new collation
-- 3. Preserves all data (string values remain unchanged)

-- Example: If query shows tables like assessment_methods_master, academic_syllabus, etc.
-- with utf8mb4_unicode_ci or utf8mb4_0900_ai_ci, they will be converted:

ALTER TABLE assessment_methods_master 
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

ALTER TABLE academic_syllabus 
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

-- Add more ALTER TABLE statements for other tables with mismatched collations
-- You can generate these statements automatically using this query:
/*
SELECT CONCAT(
    'ALTER TABLE ',
    TABLE_NAME,
    ' CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;'
) AS alter_statement
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE = 'BASE TABLE'
    AND TABLE_COLLATION != 'utf8mb4_unicode_520_ci'
ORDER BY TABLE_NAME;
*/

-- Step 3: Verify collation consistency after migration
-- Run this query to confirm all tables now use the same collation:
/*
SELECT 
    TABLE_NAME, 
    TABLE_COLLATION,
    COUNT(*) OVER () AS total_tables,
    SUM(CASE WHEN TABLE_COLLATION = 'utf8mb4_unicode_520_ci' THEN 1 ELSE 0 END) OVER () AS standardized_tables
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
*/

-- Step 4: Test cross-table string comparisons
-- After migration, queries like this should succeed without collation errors:
/*
SELECT a.*, b.*
FROM academic_syllabus a
INNER JOIN assessment_methods_master b ON a.description = b.description
LIMIT 10;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Expected Results:
-- 1. Zero "Illegal mix of collations" errors
-- 2. All cross-table string comparisons work correctly
-- 3. Existing data integrity preserved
-- 4. Query performance unchanged
-- ============================================================================
