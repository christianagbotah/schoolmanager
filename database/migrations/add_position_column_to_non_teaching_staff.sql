-- Migration: Add position column to non_teaching_staff table
-- Date: 2026-06-13
-- Purpose: Store staff position/role separate from designation field

-- Add position column after designation
ALTER TABLE `non_teaching_staff` 
ADD COLUMN `position` VARCHAR(100) NULL AFTER `designation`;

-- Copy existing designation values to position for backward compatibility
UPDATE `non_teaching_staff` 
SET `position` = `designation` 
WHERE `position` IS NULL AND `designation` IS NOT NULL;

-- Add index for faster queries
ALTER TABLE `non_teaching_staff` 
ADD INDEX `idx_position` (`position`);

-- Migration complete
