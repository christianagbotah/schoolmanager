-- ============================================================================
-- ENTERPRISE DISCOUNT PROFILE SYSTEM - DATABASE MIGRATION
-- Version: 2.0.0
-- Date: 2025-12-23
-- ============================================================================

-- 1. Fix discount_profiles - Add created_by column
ALTER TABLE discount_profiles 
ADD COLUMN created_by INT NOT NULL DEFAULT 1 AFTER is_active;

-- 2. Fix student_discount_assignments - Add missing columns
ALTER TABLE student_discount_assignments
ADD COLUMN deactivated_at INT NULL AFTER is_active,
ADD COLUMN deactivated_by INT NULL AFTER deactivated_at,
ADD COLUMN notes TEXT AFTER deactivated_by;

-- Verify changes
SELECT 'Migration completed successfully' as status;
