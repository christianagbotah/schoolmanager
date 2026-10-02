-- ============================================================================
-- UPDATE DISCOUNT SYSTEM FOR CATEGORY SEPARATION
-- Adds discount_category and related fields to existing tables
-- ============================================================================

-- 1. Add discount_category to discount_profiles
ALTER TABLE `discount_profiles` 
ADD COLUMN `discount_category` ENUM('invoice','daily_fees') NOT NULL DEFAULT 'invoice' AFTER `discount_type`;

ALTER TABLE `discount_profiles`
ADD COLUMN `fee_type` VARCHAR(50) NULL AFTER `discount_category`;

ALTER TABLE `discount_profiles`
ADD COLUMN `discount_method` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage' AFTER `fee_type`;

ALTER TABLE `discount_profiles`
ADD COLUMN `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `discount_method`;

ALTER TABLE `discount_profiles`
ADD COLUMN `created_by` INT(11) NULL AFTER `is_active`;

-- 2. Add missing columns to student_discount_assignments
ALTER TABLE `student_discount_assignments`
ADD COLUMN `deactivated_at` INT(11) NULL AFTER `is_active`;

ALTER TABLE `student_discount_assignments`
ADD COLUMN `deactivated_by` INT(11) NULL AFTER `deactivated_at`;

ALTER TABLE `student_discount_assignments`
ADD COLUMN `notes` TEXT NULL AFTER `deactivated_by`;

-- 3. Add discount_category to invoice_discounts
ALTER TABLE `invoice_discounts`
ADD COLUMN `discount_category` ENUM('invoice','daily_fees') NOT NULL DEFAULT 'invoice' AFTER `discount_type`;

ALTER TABLE `invoice_discounts`
ADD COLUMN `profile_id` INT(11) NULL AFTER `discount_category`;

-- 4. Add indexes for performance
CREATE INDEX `idx_discount_category` ON `discount_profiles`(`discount_category`, `is_active`);
CREATE INDEX `idx_profile_category` ON `invoice_discounts`(`profile_id`, `discount_category`);

-- Verify
SELECT 'Migration completed successfully' AS status;
