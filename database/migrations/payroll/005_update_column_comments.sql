-- ============================================================================
-- Update Column Comments for SSNIT Fields
-- Clarifies the purpose and calculation of SSNIT Tier 1 and Tier 2
-- ============================================================================

-- Update ssnit column comment (Tier 1 - Employer Contribution)
-- Note: Using DOUBLE to match existing column type
ALTER TABLE pay_salary 
MODIFY COLUMN ssnit DOUBLE DEFAULT 0 
    COMMENT 'SSNIT Tier 1 (13.5% of basic salary) - Employer contribution, NOT deducted from employee';

-- Update tier2_contribution column comment (Tier 2 - Employee Contribution)
ALTER TABLE pay_salary 
MODIFY COLUMN tier2_contribution DOUBLE DEFAULT 0 
    COMMENT 'SSNIT Tier 2 (5% of basic salary) - Employee contribution, deducted from gross salary';

-- Update gross_salary column comment for clarity
ALTER TABLE pay_salary 
MODIFY COLUMN gross_salary DOUBLE DEFAULT 0 
    COMMENT 'Gross Salary = Basic Salary + All Allowances';

-- Update net_salary column comment to emphasize Tier 1 exclusion
ALTER TABLE pay_salary 
MODIFY COLUMN net_salary DOUBLE DEFAULT 0 
    COMMENT 'Net Salary = Gross - (Tier 2 + Other Deductions). Tier 1 is NOT subtracted';

-- Update basic_salary column comment
ALTER TABLE pay_salary 
MODIFY COLUMN basic_salary DOUBLE NOT NULL 
    COMMENT 'Basic monthly salary (base for SSNIT calculations)';

-- ============================================================================
-- Verification Query
-- Run this to verify the changes:
--
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'pay_salary' 
--   AND COLUMN_NAME IN ('ssnit', 'tier2_contribution', 'basic_salary', 'gross_salary', 'net_salary')
--   AND TABLE_SCHEMA = DATABASE()
-- ORDER BY ORDINAL_POSITION;
-- ============================================================================
