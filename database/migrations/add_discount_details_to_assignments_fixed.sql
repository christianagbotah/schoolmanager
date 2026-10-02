-- Add missing discount detail columns to student_discount_assignments table
-- Run this migration to enable discount snapshots in assignments

ALTER TABLE `student_discount_assignments`
ADD COLUMN `discount_category` ENUM('invoice', 'daily_fees') NULL AFTER `profile_id`,
ADD COLUMN `discount_method` ENUM('percentage', 'fixed') NULL AFTER `discount_category`,
ADD COLUMN `discount_value` DECIMAL(10,2) NULL AFTER `discount_method`,
ADD COLUMN `discount_type` VARCHAR(255) NULL COMMENT 'For daily_fees: feeding,classes,water,etc' AFTER `discount_value`,
ADD COLUMN `bill_item_ids` TEXT NULL COMMENT 'For invoice: comma-separated IDs or *' AFTER `discount_type`;

-- Add index for better query performance
CREATE INDEX `idx_category_status` ON `student_discount_assignments`(`discount_category`, `status`, `is_active`);
