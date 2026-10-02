-- ============================================================
-- SIMPLE FIX: Add missing columns to non_teaching_staff table
-- Date: 2026-06-13
-- INSTRUCTIONS: Copy and paste this ENTIRE file into phpMyAdmin SQL tab
-- ============================================================

-- Add position column (if you get "Duplicate column" error, that's OK - skip to next)
ALTER TABLE `non_teaching_staff` 
ADD COLUMN `position` VARCHAR(100) NULL 
COMMENT 'Staff position/role (Driver, Cook, Cleaner, etc.)';

-- Add qualification column (if you get "Duplicate column" error, that's OK - skip to next)
ALTER TABLE `non_teaching_staff` 
ADD COLUMN `qualification` VARCHAR(200) NULL 
COMMENT 'Educational qualifications';

-- Copy existing designation values to position for backward compatibility
UPDATE `non_teaching_staff` 
SET `position` = `designation` 
WHERE `position` IS NULL AND `designation` IS NOT NULL;

-- Add index for faster queries on position
ALTER TABLE `non_teaching_staff` 
ADD INDEX `idx_position` (`position`);

-- Display success message
SELECT 'SUCCESS: Columns added to non_teaching_staff table!' AS Status;
