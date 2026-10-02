-- ============================================================================
-- ENTERPRISE-GRADE DISCOUNT SYSTEM MIGRATION
-- ============================================================================
-- This migration implements proper normalization and referential integrity
-- for the discount system with clear separation between invoice and daily fees
-- ============================================================================

-- Step 1: Create discount_categories lookup table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `discount_categories` (
    `category_id` TINYINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_code` (`code`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the two main categories (skip if exists)
INSERT IGNORE INTO `discount_categories` (`code`, `name`, `description`) VALUES
('invoice', 'Invoice Discounts', 'Discounts applied to billed items like school fees, admission fees, PTA fees, etc.'),
('daily_fees', 'Daily Fees Discounts', 'Discounts applied to daily collected fees like feeding, classes, water, breakfast, transport, etc.');

-- Step 2: Add category_id to discount_types table
-- ============================================================================
ALTER TABLE `discount_types` 
ADD COLUMN `category_id` TINYINT NOT NULL DEFAULT 1 AFTER `name`,
ADD CONSTRAINT `fk_discount_types_category` 
    FOREIGN KEY (`category_id`) REFERENCES `discount_categories`(`category_id`) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add index for better query performance
CREATE INDEX `idx_category_active` ON `discount_types`(`category_id`, `is_active`);

-- Step 3: Modify invoice_discounts table structure
-- ============================================================================

-- 3a. Add discount_type_id column (foreign key to discount_types)
ALTER TABLE `invoice_discounts` 
ADD COLUMN `discount_type_id` INT NULL AFTER `invoice_code`;

-- 3b. Add foreign key constraint
ALTER TABLE `invoice_discounts`
ADD CONSTRAINT `fk_invoice_discounts_type` 
    FOREIGN KEY (`discount_type_id`) REFERENCES `discount_types`(`discount_type_id`) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3c. Add category_id for direct access (denormalized for performance)
ALTER TABLE `invoice_discounts` 
ADD COLUMN `category_id` TINYINT NOT NULL DEFAULT 1 AFTER `discount_type_id`,
ADD CONSTRAINT `fk_invoice_discounts_category` 
    FOREIGN KEY (`category_id`) REFERENCES `discount_categories`(`category_id`) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3d. Add composite indexes for optimal query performance
CREATE INDEX `idx_student_category_status` ON `invoice_discounts`(`student_id`, `category_id`, `status`);
CREATE INDEX `idx_category_status` ON `invoice_discounts`(`category_id`, `status`);
CREATE INDEX `idx_type_status` ON `invoice_discounts`(`discount_type_id`, `status`);

-- Step 4: Update existing discount_types with categories
-- ============================================================================
-- Assuming existing types are invoice-related, set them to 'invoice' category
UPDATE `discount_types` 
SET `category_id` = (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice')
WHERE `category_id` = 1;

-- Step 5: Insert common discount types for both categories
-- ============================================================================

-- Invoice discount types
INSERT INTO `discount_types` (`name`, `category_id`, `icon`, `description`, `is_active`) VALUES
('School Fees', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice'), '🎓', 'Discount on school fees', 1),
('Admission Fees', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice'), '📝', 'Discount on admission fees', 1),
('PTA Fees', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice'), '👥', 'Discount on PTA fees', 1),
('Examination Fees', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice'), '📋', 'Discount on examination fees', 1),
('Full Scholarship', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'invoice'), '🎖️', '100% discount on all invoice items', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Daily fees discount types
INSERT INTO `discount_types` (`name`, `category_id`, `icon`, `description`, `is_active`) VALUES
('Feeding', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'daily_fees'), '🍽️', 'Discount on daily feeding fees', 1),
('Classes', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'daily_fees'), '📚', 'Discount on daily classes fees', 1),
('Water', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'daily_fees'), '💧', 'Discount on water fees', 1),
('Breakfast', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'daily_fees'), '🥐', 'Discount on breakfast fees', 1),
('Transport', (SELECT `category_id` FROM `discount_categories` WHERE `code` = 'daily_fees'), '🚌', 'Discount on daily transport fees', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Step 6: Create view for easy querying
-- ============================================================================
CREATE OR REPLACE VIEW `v_invoice_discounts_detailed` AS
SELECT 
    id.discount_id,
    id.student_id,
    s.name AS student_name,
    s.student_code,
    id.invoice_code,
    dt.discount_type_id,
    dt.name AS discount_type_name,
    dt.icon AS discount_type_icon,
    dc.category_id,
    dc.code AS category_code,
    dc.name AS category_name,
    id.discount_method,
    id.discount_value,
    id.discount_amount,
    id.reason,
    id.status,
    id.applied_by,
    id.applied_at,
    id.approved_by,
    id.approved_at
FROM invoice_discounts id
LEFT JOIN discount_types dt ON id.discount_type_id = dt.discount_type_id
LEFT JOIN discount_categories dc ON id.category_id = dc.category_id
LEFT JOIN student s ON id.student_id = s.student_id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Benefits of this structure:
-- 1. Proper normalization - discount types are in their own table
-- 2. Referential integrity - foreign keys ensure data consistency
-- 3. Flexibility - easy to add new discount types without code changes
-- 4. Performance - optimized indexes for common queries
-- 5. Maintainability - clear separation of concerns
-- 6. Scalability - can easily extend with more categories
-- ============================================================================
