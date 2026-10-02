-- Update existing invoice_discounts table for enterprise discount system
-- Only adds missing columns and updates existing structure

-- Add year and term columns for period tracking
ALTER TABLE `invoice_discounts` 
ADD COLUMN `year` INT NULL AFTER `status`,
ADD COLUMN `term` INT NULL AFTER `year`;

-- Add indexes for year and term (check if exists first)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_NAME = 'invoice_discounts' AND INDEX_NAME = 'idx_year_term');
SET @sql = IF(@idx_exists = 0, 
    'CREATE INDEX `idx_year_term` ON `invoice_discounts`(`year`, `term`)', 
    'SELECT "Index idx_year_term already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_NAME = 'invoice_discounts' AND INDEX_NAME = 'idx_student_category_status');
SET @sql = IF(@idx_exists = 0, 
    'CREATE INDEX `idx_student_category_status` ON `invoice_discounts`(`student_id`, `category_id`, `status`)', 
    'SELECT "Index idx_student_category_status already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create discount_categories table if not exists
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

-- Insert categories (skip if exists)
INSERT IGNORE INTO `discount_categories` (`category_id`, `code`, `name`, `description`) VALUES
(1, 'invoice', 'Invoice Discounts', 'Discounts applied to billed items like school fees, admission fees, PTA fees, etc.'),
(2, 'daily_fees', 'Daily Fees Discounts', 'Discounts applied to daily collected fees like feeding, classes, water, breakfast, transport, etc.');

-- Add foreign key for category_id if not exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'fk_invoice_discounts_category' 
    AND TABLE_NAME = 'invoice_discounts');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE `invoice_discounts` ADD CONSTRAINT `fk_invoice_discounts_category` 
     FOREIGN KEY (`category_id`) REFERENCES `discount_categories`(`category_id`) 
     ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update discount_types table - add category_id if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_NAME = 'discount_types' 
    AND COLUMN_NAME = 'category_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `discount_types` ADD COLUMN `category_id` TINYINT NOT NULL DEFAULT 1 AFTER `name`',
    'SELECT "Column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for discount_types.category_id if not exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'fk_discount_types_category' 
    AND TABLE_NAME = 'discount_types');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE `discount_types` ADD CONSTRAINT `fk_discount_types_category` 
     FOREIGN KEY (`category_id`) REFERENCES `discount_categories`(`category_id`) 
     ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for invoice_discounts.discount_type_id if not exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'fk_invoice_discounts_type' 
    AND TABLE_NAME = 'invoice_discounts');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE `invoice_discounts` ADD CONSTRAINT `fk_invoice_discounts_type` 
     FOREIGN KEY (`discount_type_id`) REFERENCES `discount_types`(`discount_type_id`) 
     ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default discount types for invoice category
INSERT IGNORE INTO `discount_types` (`name`, `category_id`, `icon`, `description`, `is_active`) VALUES
('School Fees', 1, '🎓', 'Discount on school fees', 1),
('Admission Fees', 1, '📝', 'Discount on admission fees', 1),
('PTA Fees', 1, '👥', 'Discount on PTA fees', 1),
('Examination Fees', 1, '📋', 'Discount on examination fees', 1),
('Full Scholarship', 1, '🎖️', '100% discount on all invoice items', 1);

-- Insert default discount types for daily fees category
INSERT IGNORE INTO `discount_types` (`name`, `category_id`, `icon`, `description`, `is_active`) VALUES
('Feeding', 2, '🍽️', 'Discount on daily feeding fees', 1),
('Classes', 2, '📚', 'Discount on daily classes fees', 1),
('Water', 2, '💧', 'Discount on water fees', 1),
('Breakfast', 2, '🥐', 'Discount on breakfast fees', 1),
('Transport', 2, '🚌', 'Discount on daily transport fees', 1);

-- Success message
SELECT 'Enterprise Discount System migration completed successfully!' AS Status;
