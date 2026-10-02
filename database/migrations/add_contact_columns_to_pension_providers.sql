-- Add contact columns to pension_tier2_providers table
-- This fixes the "Undefined array key 'contact_email'" and "Undefined array key 'contact_phone'" errors

ALTER TABLE `pension_tier2_providers` 
ADD COLUMN `contact_email` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Provider contact email address' AFTER `description`,
ADD COLUMN `contact_phone` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Provider contact phone number' AFTER `contact_email`;
