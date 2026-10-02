-- ============================================================================
-- COMPLETE ENTERPRISE DISCOUNT PROFILE SYSTEM - DATABASE MIGRATION
-- Version: 2.0.0
-- Date: 2025-12-23
-- ============================================================================

-- 1. Create discount_profiles table
CREATE TABLE IF NOT EXISTS `discount_profiles` (
  `profile_id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_name` varchar(100) NOT NULL,
  `discount_type` varchar(50) NOT NULL COMMENT 'school_fees, admission_fees, pta_fees, feeding, classes, etc.',
  `discount_category` enum('invoice','daily_fees') NOT NULL DEFAULT 'invoice',
  `discount_method` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` int(11) NOT NULL,
  `updated_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`profile_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_category` (`discount_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create student_discount_assignments table
CREATE TABLE IF NOT EXISTS `student_discount_assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `assigned_at` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deactivated_at` int(11) DEFAULT NULL,
  `deactivated_by` int(11) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_profile` (`profile_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_assignment_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_profile` FOREIGN KEY (`profile_id`) REFERENCES `discount_profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add discount_category to existing invoice_discounts table (if not exists)
ALTER TABLE `invoice_discounts` 
ADD COLUMN IF NOT EXISTS `discount_category` enum('invoice','daily_fees') NOT NULL DEFAULT 'invoice' AFTER `discount_type`,
ADD COLUMN IF NOT EXISTS `profile_id` int(11) DEFAULT NULL AFTER `discount_category`,
ADD INDEX IF NOT EXISTS `idx_discount_category` (`discount_category`, `status`),
ADD INDEX IF NOT EXISTS `idx_profile_id` (`profile_id`);

-- 4. Insert sample discount profiles
INSERT INTO `discount_profiles` (`profile_name`, `discount_type`, `discount_category`, `discount_method`, `discount_value`, `description`, `is_active`, `created_by`, `created_at`) VALUES
('Full School Fees Waiver', 'school_fees', 'invoice', 'percentage', 100.00, 'Complete waiver of school fees for scholarship students', 1, 1, UNIX_TIMESTAMP()),
('50% School Fees Discount', 'school_fees', 'invoice', 'percentage', 50.00, 'Half price on school fees', 1, 1, UNIX_TIMESTAMP()),
('Full Feeding Discount', 'feeding', 'daily_fees', 'percentage', 100.00, 'Free feeding for beneficiaries', 1, 1, UNIX_TIMESTAMP()),
('Staff Child Discount', 'school_fees', 'invoice', 'percentage', 30.00, 'Discount for children of staff members', 1, 1, UNIX_TIMESTAMP());

-- Verify migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as profile_count FROM discount_profiles;
