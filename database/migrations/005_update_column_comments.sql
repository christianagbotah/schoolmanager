-- ============================================================================
-- Migration: Update Column Comments for SSNIT Fields
-- Purpose: Update column comments to clarify SSNIT Tier 1 and Tier 2 structure
-- Spec: payroll-modernization-ssnit-fixes
-- Task: 3.2 Update column comments for SSNIT fields
-- Date: 2026-01-08
-- ============================================================================

USE schoolmanager;

-- Update ssnit column comment
-- SSNIT Tier 1 (13.5%) is an EMPLOYER contribution - NOT deducted from employee pay
ALTER TABLE pay_salary 
MODIFY COLUMN ssnit DOUBLE DEFAULT 0 
COMMENT 'SSNIT Tier 1 (13.5%) - Employer contribution, NOT deducted from employee';

-- Update tier2_contribution column comment  
-- SSNIT Tier 2 (5%) is an EMPLOYEE contribution - deducted from gross salary
ALTER TABLE pay_salary 
MODIFY COLUMN tier2_contribution DOUBLE DEFAULT 0 
COMMENT 'SSNIT Tier 2 (5%) - Employee contribution, deducted from gross salary';

-- ============================================================================
-- Verification Query
-- Run this to verify the changes:
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'pay_salary' 
--   AND COLUMN_NAME IN ('ssnit', 'tier2_contribution')
--   AND TABLE_SCHEMA = 'schoolmanager';
-- ============================================================================
