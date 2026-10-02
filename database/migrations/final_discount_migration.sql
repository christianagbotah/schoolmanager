-- Add missing columns only

-- 1. Add fee_type, discount_method, discount_value to discount_profiles
ALTER TABLE `discount_profiles`
ADD COLUMN `fee_type` VARCHAR(50) NULL AFTER `discount_category`;

ALTER TABLE `discount_profiles`
ADD COLUMN `discount_method` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage' AFTER `fee_type`;

ALTER TABLE `discount_profiles`
ADD COLUMN `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `discount_method`;

-- 2. Add profile_id to invoice_discounts
ALTER TABLE `invoice_discounts`
ADD COLUMN `profile_id` INT(11) NULL AFTER `discount_category`;

-- 3. Add indexes
CREATE INDEX `idx_profile_category` ON `invoice_discounts`(`profile_id`, `discount_category`);

SELECT 'Migration completed' AS status;
