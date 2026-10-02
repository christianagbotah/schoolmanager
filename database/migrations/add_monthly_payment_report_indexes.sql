-- ============================================================================
-- Migration: Add Database Indexes for Monthly Payment Report Query Optimization
-- Spec: monthly-payment-report-by-invoice-item
-- Task: 6. Add database indexes for query optimization
-- Requirements: 8.2, 8.5
-- Date: 2026-05-13
-- ============================================================================

-- Purpose:
-- These indexes optimize the performance of the monthly payment report by invoice item.
-- The report aggregates payment data by invoice item and month, requiring efficient
-- filtering and joining across payment, invoice, and bill_item tables.

-- ============================================================================
-- Index 1: idx_payment_date_year
-- Table: payment
-- Columns: day_timestamp, year
-- Purpose: Optimize filtering by payment date and academic year
-- ============================================================================
-- This composite index supports the WHERE clause that filters payments by:
-- - MONTH(FROM_UNIXTIME(p.day_timestamp)) BETWEEN ? AND ?
-- - p.year = ?
-- The index allows the database to quickly locate payments within the date range
-- and academic year without scanning the entire payment table.

CREATE INDEX IF NOT EXISTS `idx_payment_date_year` 
ON `payment` (`day_timestamp`, `year`);

-- ============================================================================
-- Index 2: idx_invoice_lookup
-- Table: payment
-- Columns: invoice_id, invoice_code
-- Purpose: Optimize invoice lookup in payment records
-- ============================================================================
-- This composite index supports the JOIN condition:
-- - INNER JOIN invoice i ON (p.invoice_id = i.invoice_id OR p.invoice_code = i.invoice_code)
-- The index allows efficient lookup of invoice relationships using either invoice_id
-- or invoice_code, which are alternative foreign keys in the payment table.

CREATE INDEX IF NOT EXISTS `idx_invoice_lookup` 
ON `payment` (`invoice_id`, `invoice_code`);

-- ============================================================================
-- Index 3: idx_invoice_title
-- Table: invoice
-- Columns: title
-- Purpose: Optimize joining invoice with bill_item by title
-- ============================================================================
-- This index supports the JOIN condition:
-- - INNER JOIN bill_item bi ON i.title = bi.title
-- The invoice.title column is used to match invoice records with bill_item records
-- to retrieve the invoice item name (fee type). This index speeds up the join operation.

CREATE INDEX IF NOT EXISTS `idx_invoice_title` 
ON `invoice` (`title`);

-- ============================================================================
-- Index 4: idx_bill_item_title
-- Table: bill_item
-- Columns: title
-- Purpose: Optimize joining bill_item with invoice by title
-- ============================================================================
-- This index supports the JOIN condition from the bill_item side:
-- - INNER JOIN bill_item bi ON i.title = bi.title
-- Combined with idx_invoice_title, this creates an efficient join path between
-- invoice and bill_item tables using the title column.

CREATE INDEX IF NOT EXISTS `idx_bill_item_title` 
ON `bill_item` (`title`);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if all indexes exist on payment table
-- Expected: idx_payment_date_year, idx_invoice_lookup
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'payment'
  AND INDEX_NAME IN ('idx_payment_date_year', 'idx_invoice_lookup')
GROUP BY TABLE_NAME, INDEX_NAME;

-- Check if all indexes exist on invoice table
-- Expected: idx_invoice_title
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'invoice'
  AND INDEX_NAME = 'idx_invoice_title'
GROUP BY TABLE_NAME, INDEX_NAME;

-- Check if all indexes exist on bill_item table
-- Expected: idx_bill_item_title
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'schoolmanager'
  AND TABLE_NAME = 'bill_item'
  AND INDEX_NAME = 'idx_bill_item_title'
GROUP BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- Performance Impact Analysis
-- ============================================================================

-- Before indexes (estimated):
-- - Full table scan on payment table (potentially millions of rows)
-- - Nested loop joins without index support
-- - Query time: 5-30 seconds for large datasets

-- After indexes (estimated):
-- - Index range scan on payment(day_timestamp, year)
-- - Index lookup for invoice relationships
-- - Index-based joins on title columns
-- - Query time: < 1 second for most datasets

-- ============================================================================
-- Rollback Instructions
-- ============================================================================

-- To remove these indexes if needed:
-- DROP INDEX `idx_payment_date_year` ON `payment`;
-- DROP INDEX `idx_invoice_lookup` ON `payment`;
-- DROP INDEX `idx_invoice_title` ON `invoice`;
-- DROP INDEX `idx_bill_item_title` ON `bill_item`;

-- ============================================================================
-- Notes
-- ============================================================================

-- 1. These indexes are already present in the database (verified 2026-05-13)
-- 2. The CREATE INDEX IF NOT EXISTS syntax ensures idempotent execution
-- 3. Index maintenance overhead is minimal compared to query performance gains
-- 4. Indexes are automatically updated when data is inserted/updated/deleted
-- 5. Monitor index usage with: SHOW INDEX FROM table_name;
-- 6. Analyze query performance with: EXPLAIN SELECT ... (see query below)

-- ============================================================================
-- Example Query Performance Test
-- ============================================================================

-- Test the monthly payment report query with EXPLAIN to verify index usage:
/*
EXPLAIN
SELECT 
    bi.title AS invoice_item,
    MONTH(FROM_UNIXTIME(p.day_timestamp)) AS payment_month,
    SUM(p.amount) AS total_amount
FROM payment p
INNER JOIN invoice i ON (p.invoice_id = i.invoice_id OR p.invoice_code = i.invoice_code)
INNER JOIN bill_item bi ON i.title = bi.title
WHERE 
    (p.invoice_id IS NOT NULL OR p.invoice_code IS NOT NULL)
    AND p.can_delete != 'trash'
    AND p.year = '2025-2026'
    AND MONTH(FROM_UNIXTIME(p.day_timestamp)) BETWEEN 1 AND 12
GROUP BY bi.title, MONTH(FROM_UNIXTIME(p.day_timestamp))
ORDER BY bi.title ASC, payment_month ASC;
*/

-- Expected EXPLAIN output should show:
-- - type: range or ref (not ALL)
-- - key: idx_payment_date_year, idx_invoice_lookup, idx_invoice_title, idx_bill_item_title
-- - rows: significantly reduced compared to full table scan

-- ============================================================================
-- End of Migration
-- ============================================================================
