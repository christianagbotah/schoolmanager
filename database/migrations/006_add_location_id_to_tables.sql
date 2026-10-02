-- Migration: 006_add_location_id_to_tables
-- Description: Adds location_id column to all sync-enabled tables for location-based filtering
-- Created: 2024-01-20
-- Requirements: Requirement 7, 11 - Location Registry, Data Partitioning

-- This script adds location_id to sync-enabled tables
-- Run this after creating the location_registry table

-- Core Tables
ALTER TABLE `student` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `parent` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `enroll` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `teacher` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Academic Tables
ALTER TABLE `class` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `section` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `subject` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Financial Tables
ALTER TABLE `invoice` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `payment` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `daily_fee_wallet` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `daily_fee_transactions` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Attendance Tables
ALTER TABLE `attendance` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Exam Tables
ALTER TABLE `exam` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `exam_marks` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `grade` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Discount Tables
ALTER TABLE `discount_profiles` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `student_discount_assignments` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `discount_categories` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `discount_profile_rules` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;
ALTER TABLE `discount_rule_applications` ADD COLUMN IF NOT EXISTS `location_id` INT NULL AFTER `device_id`;

-- Add indexes for location_id
CREATE INDEX IF NOT EXISTS `idx_student_location` ON `student` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_parent_location` ON `parent` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_enroll_location` ON `enroll` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_admin_location` ON `admin` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_teacher_location` ON `teacher` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_class_location` ON `class` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_section_location` ON `section` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_subject_location` ON `subject` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_invoice_location` ON `invoice` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_payment_location` ON `payment` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_attendance_location` ON `attendance` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_exam_location` ON `exam` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_exam_marks_location` ON `exam_marks` (`location_id`);

-- Update existing records to set location_id based on device_id
-- This maps existing device_id values to the location_registry

-- First, ensure the default location exists
INSERT IGNORE INTO `location_registry` (`location_name`, `device_id`, `status`, `priority`)
SELECT 'Default Location', `description`, 'active', 1
FROM `settings` WHERE `type` = 'device_id';

-- Then update all tables to link to the default location
UPDATE `student` s
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `parent` p
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `enroll` e
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `admin` a
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `teacher` t
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `invoice` i
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `payment` p
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

UPDATE `attendance` a
SET `location_id` = (SELECT `id` FROM `location_registry` ORDER BY `id` LIMIT 1)
WHERE `location_id` IS NULL;

-- Note: Foreign key constraints are NOT added to avoid breaking existing data
-- The location_id column is informational and used for filtering
-- Add foreign keys manually if strict referential integrity is required
