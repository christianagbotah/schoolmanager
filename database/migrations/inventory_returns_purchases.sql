-- ============================================
-- Inventory Sales Returns & Stock Replenishment Migration
-- ============================================
-- Description: Creates tables for sales returns/refunds and purchase orders
-- Requirements: 1.4, 2.2, 2.4
-- Created: 2025-01-20
-- 
-- This migration adds:
-- 1. inventory_returns - Return transaction headers
-- 2. inventory_return_items - Individual returned items
-- 3. inventory_purchases - Purchase order headers
-- 4. inventory_purchase_items - Individual purchased items
-- 5. Enhancements to inventory_products and inventory_suppliers
-- ============================================

-- ============================================
-- STEP 1: Create Returns Tables
-- ============================================

-- Inventory Returns Table
-- Stores return transaction headers
CREATE TABLE IF NOT EXISTS `inventory_returns` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `original_sale_id` INT(11) NOT NULL COMMENT 'FK to inventory_sales',
    `return_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `total_refund_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `return_reason` VARCHAR(100) NOT NULL COMMENT 'Defective, Wrong item, Changed mind, Expired, Other',
    `return_notes` TEXT DEFAULT NULL,
    `refund_method` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Cash, 2=Account Credit, 3=Original Method',
    `processed_by` INT(11) NOT NULL COMMENT 'FK to admin',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_original_sale` (`original_sale_id`),
    KEY `idx_return_date` (`return_date`),
    KEY `idx_processed_by` (`processed_by`),
    KEY `idx_return_reason` (`return_reason`),
    KEY `idx_return_date_reason` (`return_date`, `return_reason`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Inventory Return Items Table
-- Stores individual returned items
CREATE TABLE IF NOT EXISTS `inventory_return_items` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `return_id` INT(11) NOT NULL COMMENT 'FK to inventory_returns',
    `sale_item_id` INT(11) NOT NULL COMMENT 'FK to inventory_sale_items',
    `product_id` INT(11) NOT NULL COMMENT 'FK to inventory_products',
    `quantity_returned` INT(11) NOT NULL,
    `unit_price` DECIMAL(10,2) NOT NULL COMMENT 'Original unit price',
    `refund_amount` DECIMAL(10,2) NOT NULL COMMENT 'unit_price * quantity_returned',
    PRIMARY KEY (`id`),
    KEY `idx_return` (`return_id`),
    KEY `idx_sale_item` (`sale_item_id`),
    KEY `idx_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- ============================================
-- STEP 2: Create Purchase Orders Tables
-- ============================================

-- Inventory Purchases Table
-- Stores purchase order headers
CREATE TABLE IF NOT EXISTS `inventory_purchases` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `supplier_id` INT(11) DEFAULT NULL COMMENT 'FK to inventory_suppliers',
    `purchase_date` DATE NOT NULL,
    `expected_delivery_date` DATE DEFAULT NULL,
    `reference_number` VARCHAR(100) DEFAULT NULL COMMENT 'Invoice/PO number',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('pending', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
    `notes` TEXT DEFAULT NULL,
    `created_by` INT(11) NOT NULL COMMENT 'FK to admin',
    `received_by` INT(11) DEFAULT NULL COMMENT 'FK to admin',
    `received_date` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_supplier` (`supplier_id`),
    KEY `idx_purchase_date` (`purchase_date`),
    KEY `idx_status` (`status`),
    KEY `idx_created_by` (`created_by`),
    KEY `idx_reference` (`reference_number`),
    KEY `idx_purchase_status_date` (`status`, `purchase_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Inventory Purchase Items Table
-- Stores individual purchased items
CREATE TABLE IF NOT EXISTS `inventory_purchase_items` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `purchase_id` INT(11) NOT NULL COMMENT 'FK to inventory_purchases',
    `product_id` INT(11) NOT NULL COMMENT 'FK to inventory_products',
    `quantity` INT(11) NOT NULL,
    `cost_price` DECIMAL(10,2) NOT NULL COMMENT 'Cost per unit',
    `total_cost` DECIMAL(10,2) NOT NULL COMMENT 'cost_price * quantity',
    PRIMARY KEY (`id`),
    KEY `idx_purchase` (`purchase_id`),
    KEY `idx_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- ============================================
-- STEP 3: Add Foreign Key Constraints (with existence checks)
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

-- Foreign keys for inventory_returns
CALL add_fk_if_not_exists('inventory_returns', 'fk_return_sale', 
    'FOREIGN KEY (`original_sale_id`) REFERENCES `inventory_sales` (`id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_returns', 'fk_return_admin', 
    'FOREIGN KEY (`processed_by`) REFERENCES `admin` (`admin_id`) ON DELETE RESTRICT');

-- Foreign keys for inventory_return_items
CALL add_fk_if_not_exists('inventory_return_items', 'fk_return_item_return', 
    'FOREIGN KEY (`return_id`) REFERENCES `inventory_returns` (`id`) ON DELETE CASCADE');

CALL add_fk_if_not_exists('inventory_return_items', 'fk_return_item_sale_item', 
    'FOREIGN KEY (`sale_item_id`) REFERENCES `inventory_sale_items` (`id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_return_items', 'fk_return_item_product', 
    'FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`) ON DELETE RESTRICT');

-- Foreign keys for inventory_purchases
CALL add_fk_if_not_exists('inventory_purchases', 'fk_purchase_supplier', 
    'FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers` (`id`) ON DELETE SET NULL');

CALL add_fk_if_not_exists('inventory_purchases', 'fk_purchase_creator', 
    'FOREIGN KEY (`created_by`) REFERENCES `admin` (`admin_id`) ON DELETE RESTRICT');

CALL add_fk_if_not_exists('inventory_purchases', 'fk_purchase_receiver', 
    'FOREIGN KEY (`received_by`) REFERENCES `admin` (`admin_id`) ON DELETE RESTRICT');

-- Foreign keys for inventory_purchase_items
CALL add_fk_if_not_exists('inventory_purchase_items', 'fk_purchase_item_purchase', 
    'FOREIGN KEY (`purchase_id`) REFERENCES `inventory_purchases` (`id`) ON DELETE CASCADE');

CALL add_fk_if_not_exists('inventory_purchase_items', 'fk_purchase_item_product', 
    'FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`) ON DELETE RESTRICT');

-- Clean up the helper procedure
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

-- ============================================
-- STEP 4: Enhance Existing Tables
-- ============================================

-- Add last_restocked field to inventory_products if not exists
SET @dbname = DATABASE();
SET @tablename = 'inventory_products';
SET @columnname = 'last_restocked';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = @tablename)
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATE DEFAULT NULL AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Enhance inventory_suppliers table with additional fields if they don't exist
-- Check and add contact_person
SET @columnname = 'contact_person';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN contact_person VARCHAR(100) DEFAULT NULL AFTER name'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add email
SET @columnname = 'email';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN email VARCHAR(100) DEFAULT NULL AFTER contact_person'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add phone
SET @columnname = 'phone';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add address
SET @columnname = 'address';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN address TEXT DEFAULT NULL AFTER phone'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add status
SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN status TINYINT(1) DEFAULT 1 COMMENT ''1=Active, 0=Inactive'' AFTER address'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add created_at
SET @columnname = 'created_at';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER status'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add updated_at
SET @columnname = 'updated_at';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (table_name = 'inventory_suppliers')
            AND (table_schema = @dbname)
            AND (column_name = @columnname)
    ) > 0,
    'SELECT 1',
    'ALTER TABLE inventory_suppliers ADD COLUMN updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- STEP 5: Verification Queries
-- ============================================

-- Verify all tables were created
SELECT 
    'inventory_returns' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_returns'

UNION ALL

SELECT 
    'inventory_return_items' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_return_items'

UNION ALL

SELECT 
    'inventory_purchases' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchases'

UNION ALL

SELECT 
    'inventory_purchase_items' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'inventory_purchase_items';

-- ============================================
-- END OF MIGRATION
-- ============================================
-- Tables Created: 4
-- - inventory_returns
-- - inventory_return_items
-- - inventory_purchases
-- - inventory_purchase_items
-- 
-- Tables Enhanced: 2
-- - inventory_products (added last_restocked)
-- - inventory_suppliers (added contact_person, email, phone, address, status, created_at, updated_at)
-- 
-- Foreign Keys: 8
-- Indexes: 15
-- ============================================
