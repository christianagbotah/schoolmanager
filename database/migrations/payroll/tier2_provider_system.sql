-- ============================================================================
-- TIER 2 PENSION PROVIDER SYSTEM MIGRATION
-- ============================================================================
-- Purpose: Replace hardcoded "petra" with flexible Tier 2 provider system
-- Date: June 4, 2026
-- Related: PAYROLL_TIER2_AND_EDIT_FIXES.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create pension_tier2_providers table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pension_tier2_providers` (
  `provider_id` int(11) NOT NULL AUTO_INCREMENT,
  `provider_name` varchar(100) NOT NULL COMMENT 'Name of Tier 2 pension provider',
  `provider_code` varchar(20) NOT NULL COMMENT 'Short code for provider',
  `provider_address` text DEFAULT NULL,
  `provider_phone` varchar(50) DEFAULT NULL,
  `provider_email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`provider_id`),
  UNIQUE KEY `provider_code` (`provider_code`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tier 2 pension provider companies';

-- ----------------------------------------------------------------------------
-- STEP 2: Insert default Ghana Tier 2 providers
-- ----------------------------------------------------------------------------

INSERT INTO `pension_tier2_providers` (`provider_name`, `provider_code`, `is_active`) VALUES
('Enterprise Trustees Limited', 'ENTERPRISE', 1),
('Petra Trust Company Limited', 'PETRA', 1),
('Glico Pensions', 'GLICO', 1),
('SAS Capital', 'SAS', 1),
('Dalex Pension Trust', 'DALEX', 1),
('SSNIT', 'SSNIT', 1);

-- ----------------------------------------------------------------------------
-- STEP 3: Migrate teacher table from petra_id to tier2 provider system
-- ----------------------------------------------------------------------------

-- First, add the new columns
ALTER TABLE `teacher` 
ADD COLUMN `tier2_provider_id` int(11) DEFAULT NULL COMMENT 'FK to pension_tier2_providers' AFTER `account_number`,
ADD COLUMN `tier2_member_id` varchar(50) DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider' AFTER `tier2_provider_id`,
ADD KEY `tier2_provider_id` (`tier2_provider_id`);

-- Migrate existing petra_id data to tier2_member_id
UPDATE `teacher` t
SET t.tier2_provider_id = (SELECT provider_id FROM pension_tier2_providers WHERE provider_code = 'PETRA' LIMIT 1),
    t.tier2_member_id = t.petra_id
WHERE t.petra_id IS NOT NULL AND t.petra_id != '';

-- Drop the old petra_id column
ALTER TABLE `teacher` DROP COLUMN `petra_id`;

-- Add foreign key constraint
ALTER TABLE `teacher`
ADD CONSTRAINT `teacher_tier2_provider_fk` 
  FOREIGN KEY (`tier2_provider_id`) 
  REFERENCES `pension_tier2_providers` (`provider_id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 4: Migrate admin table from petra_id to tier2 provider system
-- ----------------------------------------------------------------------------

-- First, add the new columns
ALTER TABLE `admin` 
ADD COLUMN `tier2_provider_id` int(11) DEFAULT NULL COMMENT 'FK to pension_tier2_providers' AFTER `account_number`,
ADD COLUMN `tier2_member_id` varchar(50) DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider' AFTER `tier2_provider_id`,
ADD KEY `tier2_provider_id` (`tier2_provider_id`);

-- Migrate existing petra_id data to tier2_member_id
UPDATE `admin` a
SET a.tier2_provider_id = (SELECT provider_id FROM pension_tier2_providers WHERE provider_code = 'PETRA' LIMIT 1),
    a.tier2_member_id = a.petra_id
WHERE a.petra_id IS NOT NULL AND a.petra_id != '';

-- Drop the old petra_id column
ALTER TABLE `admin` DROP COLUMN `petra_id`;

-- Add foreign key constraint
ALTER TABLE `admin`
ADD CONSTRAINT `admin_tier2_provider_fk` 
  FOREIGN KEY (`tier2_provider_id`) 
  REFERENCES `pension_tier2_providers` (`provider_id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 5: Add tier2_provider_id and tier2_member_id to non_teaching_staff table
-- Note: This table may not have petra_id column, so just add new columns
-- ----------------------------------------------------------------------------

ALTER TABLE `non_teaching_staff` 
ADD COLUMN `tier2_provider_id` int(11) DEFAULT NULL COMMENT 'FK to pension_tier2_providers' AFTER `account_number`,
ADD COLUMN `tier2_member_id` varchar(50) DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider' AFTER `tier2_provider_id`,
ADD KEY `tier2_provider_id` (`tier2_provider_id`);

ALTER TABLE `non_teaching_staff`
ADD CONSTRAINT `non_teaching_staff_tier2_provider_fk` 
  FOREIGN KEY (`tier2_provider_id`) 
  REFERENCES `pension_tier2_providers` (`provider_id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 6: Update pay_salary table
-- Rename petra → tier2_contribution and add tier2_provider_id
-- ----------------------------------------------------------------------------

-- Rename petra column to tier2_contribution
ALTER TABLE `pay_salary` 
CHANGE COLUMN `petra` `tier2_contribution` DOUBLE NOT NULL DEFAULT 0 
COMMENT 'SSNIT Tier 2 contribution amount';

-- Add tier2_provider_id to track which provider this contribution is for
ALTER TABLE `pay_salary` 
ADD COLUMN `tier2_provider_id` int(11) DEFAULT NULL 
COMMENT 'FK to pension_tier2_providers' AFTER `tier2_contribution`,
ADD KEY `tier2_provider_id` (`tier2_provider_id`);

ALTER TABLE `pay_salary`
ADD CONSTRAINT `pay_salary_tier2_provider_fk` 
  FOREIGN KEY (`tier2_provider_id`) 
  REFERENCES `pension_tier2_providers` (`provider_id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 7: Migration for existing data (if needed)
-- Set default Petra provider for existing records with tier2_contribution > 0
-- ----------------------------------------------------------------------------

-- Get Petra provider_id
SET @petra_id = (SELECT provider_id FROM pension_tier2_providers WHERE provider_code = 'PETRA' LIMIT 1);

-- Update existing pay_salary records that have tier2_contribution > 0
UPDATE `pay_salary` 
SET `tier2_provider_id` = @petra_id 
WHERE `tier2_contribution` > 0 
  AND `tier2_provider_id` IS NULL;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Run after migration to verify)
-- ----------------------------------------------------------------------------

-- Verify pension_tier2_providers table created
-- SELECT * FROM pension_tier2_providers;

-- Verify teacher table columns added
-- SHOW COLUMNS FROM teacher LIKE 'tier2%';

-- Verify admin table columns added
-- SHOW COLUMNS FROM admin LIKE 'tier2%';

-- Verify non_teaching_staff table columns added
-- SHOW COLUMNS FROM non_teaching_staff LIKE 'tier2%';

-- Verify pay_salary table updated
-- SHOW COLUMNS FROM pay_salary LIKE 'tier2%';

-- Check foreign key constraints
-- SELECT 
--   TABLE_NAME, 
--   CONSTRAINT_NAME, 
--   REFERENCED_TABLE_NAME 
-- FROM information_schema.KEY_COLUMN_USAGE 
-- WHERE REFERENCED_TABLE_NAME = 'pension_tier2_providers';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
