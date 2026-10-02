-- ============================================
-- Purchase Order Financial Integration Migration
-- ============================================
-- Description: Adds payment tracking fields and tables for purchase order financial integration
-- Requirements: REQ-1.1, REQ-2.1, REQ-3.1, REQ-10.1
-- Created: 2026-05-21
-- 
-- This migration adds:
-- 1. Payment tracking fields to inventory_purchases table
-- 2. inventory_purchase_payments table for payment history
-- 3. Indexes for performance optimization
-- 4. Initialization of payment status for existing purchase orders
-- ============================================

-- ============================================
-- STEP 1: Add Payment Tracking Fields to inventory_purchases
-- ============================================

-- Add amount_paid field if not exists
SET @dbname = DATABASE();
SET @tablename = 'inventory_purchases';
SET @columnname = 'amount_paid';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = @tablename)
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''Total amount paid so far'' AFTER total_amount')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add payment_status field if not exists
SET @columnname = 'payment_status';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = @tablename)
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''unpaid'', ''partially_paid'', ''fully_paid'') NOT NULL DEFAULT ''unpaid'' COMMENT ''Current payment status'' AFTER amount_paid')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_payment_date field if not exists
SET @columnname = 'last_payment_date';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = @tablename)
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATE NULL COMMENT ''Date of most recent payment'' AFTER payment_status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- STEP 2: Add Indexes for Performance Optimization
-- ============================================

-- Helper procedure to add index if not exists
DELIMITER $$

DROP PROCEDURE IF EXISTS add_index_if_not_exists$$
CREATE PROCEDURE add_index_if_not_exists(
    IN tableName VARCHAR(64),
    IN indexName VARCHAR(64),
    IN indexDefinition TEXT
)
BEGIN
    DECLARE index_exists INT;
    
    -- Check if index exists
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
        AND CONVERT(TABLE_NAME USING utf8mb4) COLLATE utf8mb4_unicode_520_ci = tableName
        AND CONVERT(INDEX_NAME USING utf8mb4) COLLATE utf8mb4_unicode_520_ci = indexName;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD INDEX `', indexName, '` ', indexDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add indexes for payment tracking fields
CALL add_index_if_not_exists('inventory_purchases', 'idx_payment_status', '(`payment_status`)');
CALL add_index_if_not_exists('inventory_purchases', 'idx_last_payment_date', '(`last_payment_date`)');
CALL add_index_if_not_exists('inventory_purchases', 'idx_payment_status_date', '(`payment_status`, `last_payment_date`)');

-- ============================================
-- STEP 3: Create inventory_purchase_payments Table
-- ============================================

-- Inventory Purchase Payments Table
-- Stores individual payment transactions for purchase orders
CREATE TABLE IF NOT EXISTS `inventory_purchase_payments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `purchase_id` INT(11) NOT NULL COMMENT 'FK to inventory_purchases',
    `payment_date` DATE NOT NULL COMMENT 'Date payment was made',
    `amount` DECIMAL(10,2) NOT NULL COMMENT 'Payment amount',
    `payment_method_id` INT(11) NOT NULL COMMENT 'FK to payment_methods',
    `reference_number` VARCHAR(100) DEFAULT NULL COMMENT 'Transaction/cheque reference',
    `notes` TEXT DEFAULT NULL COMMENT 'Payment notes',
    `recorded_by` INT(11) NOT NULL COMMENT 'FK to admin who recorded payment',
    `expenditure_payment_id` INT(11) DEFAULT NULL COMMENT 'FK to payment table entry',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_purchase` (`purchase_id`),
    KEY `idx_payment_date` (`payment_date`),
    KEY `idx_payment_method` (`payment_method_id`),
    KEY `idx_recorded_by` (`recorded_by`),
    KEY `idx_expenditure_payment` (`expenditure_payment_id`),
    KEY `idx_purchase_payment_date` (`purchase_id`, `payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- ============================================
-- STEP 4: Add Foreign Key Constraints
-- ============================================

-- Helper procedure to add foreign key if not exists
DELIMITER $$

DROP PROCEDURE IF EXISTS add_fk_if_not_exists$$
CREATE PROCEDURE add_fk_if_not_exists(
    IN tableName VARCHAR(64),
    IN constraintName VARCHAR(64),
    IN fkDefinition TEXT
)
BEGIN
    DECLARE fk_exists INT;
    
    -- Convert information_schema values to utf8mb4 for comparison
    SELECT COUNT(*) INTO fk_exists
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONVERT(TABLE_NAME USING utf8mb4) COLLATE utf8mb4_unicode_520_ci = tableName
        AND CONVERT(CONSTRAINT_NAME USING utf8mb4) COLLATE utf8mb4_unicode_520_ci = constraintName
        AND CONSTRAINT_TYPE = 'FOREIGN KEY';
    
    IF fk_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD CONSTRAINT `', constraintName, '` ', fkDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Foreign keys for inventory_purchase_payments
CALL add_fk_if_not_exists('inventory_purchase_payments', 'fk_purchase_payment_purchase', 
    'FOREIGN KEY (`purchase_id`) REFERENCES `inventory_purchases` (`id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_purchase_payments', 'fk_purchase_payment_method', 
    'FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_purchase_payments', 'fk_purchase_payment_admin', 
    'FOREIGN KEY (`recorded_by`) REFERENCES `admin` (`admin_id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_purchase_payments', 'fk_purchase_payment_expenditure', 
    'FOREIGN KEY (`expenditure_payment_id`) REFERENCES `payment` (`payment_id`) ON DELETE SET NULL');

-- Clean up helper procedures
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

-- ============================================
-- STEP 5: Initialize Payment Status for Existing Purchase Orders
-- ============================================

-- Set all existing purchase orders to 'unpaid' status
-- This is safe because we're adding new fields, so all existing orders have amount_paid = 0
UPDATE `inventory_purchases` 
SET `payment_status` = 'unpaid' 
WHERE `amount_paid` = 0 AND `payment_status` = 'unpaid';

-- Handle any edge cases where amount_paid might have been manually set
-- (This shouldn't happen, but we handle it for data integrity)
UPDATE `inventory_purchases` 
SET `payment_status` = 'fully_paid' 
WHERE `amount_paid` >= `total_amount` AND `payment_status` != 'fully_paid';

UPDATE `inventory_purchases` 
SET `payment_status` = 'partially_paid' 
WHERE `amount_paid` > 0 AND `amount_paid` < `total_amount` AND `payment_status` != 'partially_paid';

-- ============================================
-- STEP 6: Verification Queries
-- ============================================

-- Verify new columns were added to inventory_purchases
SELECT 
    'inventory_purchases.amount_paid' AS field_name,
    COUNT(*) AS exists_count
FROM information_schema.COLUMNS 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchases'
AND column_name = 'amount_paid'

UNION ALL

SELECT 
    'inventory_purchases.payment_status' AS field_name,
    COUNT(*) AS exists_count
FROM information_schema.COLUMNS 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchases'
AND column_name = 'payment_status'

UNION ALL

SELECT 
    'inventory_purchases.last_payment_date' AS field_name,
    COUNT(*) AS exists_count
FROM information_schema.COLUMNS 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchases'
AND column_name = 'last_payment_date';

-- Verify inventory_purchase_payments table was created
SELECT 
    'inventory_purchase_payments' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchase_payments';

-- Verify indexes were created
SELECT 
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'inventory_purchases'
AND INDEX_NAME IN ('idx_payment_status', 'idx_last_payment_date', 'idx_payment_status_date')
GROUP BY INDEX_NAME;

-- Verify foreign keys were created
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
AND TABLE_NAME = 'inventory_purchase_payments'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Show payment status distribution for existing purchase orders
-- Note: This query is commented out to avoid phpMyAdmin issues.
-- You can run it manually after the migration to verify payment status distribution.
-- SELECT 
--     p.payment_status,
--     COUNT(*) AS count,
--     SUM(p.total_amount) AS total_amount,
--     SUM(p.amount_paid) AS total_paid
-- FROM `inventory_purchases` p
-- GROUP BY p.payment_status;

-- ============================================
-- END OF MIGRATION
-- ============================================
-- Tables Modified: 1
-- - inventory_purchases (added amount_paid, payment_status, last_payment_date)
-- 
-- Tables Created: 1
-- - inventory_purchase_payments
-- 
-- Foreign Keys: 4
-- Indexes: 9 (3 on inventory_purchases, 6 on inventory_purchase_payments)
-- 
-- Data Initialization: All existing purchase orders set to 'unpaid' status
-- ============================================
