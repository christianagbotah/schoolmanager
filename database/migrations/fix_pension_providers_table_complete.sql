-- Complete fix for pension_tier2_providers table
-- Adds missing description column and updates column order

-- Add description column if it doesn't exist
ALTER TABLE `pension_tier2_providers` 
ADD COLUMN IF NOT EXISTS `description` TEXT NULL DEFAULT NULL COMMENT 'Provider description' AFTER `provider_code`;

-- Note: contact_email and contact_phone already exist, so we don't need to add them again
-- The table now has: provider_email, provider_phone (old) AND contact_email, contact_phone (new)
