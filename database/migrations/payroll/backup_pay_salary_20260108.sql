-- ============================================================================
-- Payroll Data Backup - Task 3.3
-- ============================================================================
-- Purpose: Create a safety backup of existing payroll data before applying
--          SSNIT calculation fixes
-- Created: 2026-01-08
-- Spec: payroll-modernization-ssnit-fixes
-- ============================================================================

-- Create backup table with all existing data
CREATE TABLE pay_salary_backup_20260108 AS SELECT * FROM pay_salary;

-- Verify backup was created successfully
SELECT 
    'Backup Created' AS status,
    COUNT(*) AS total_records,
    MIN(pay_id) AS min_pay_id,
    MAX(pay_id) AS max_pay_id,
    COUNT(DISTINCT employee_code) AS unique_employees,
    COUNT(DISTINCT CONCAT(month, '-', year)) AS unique_months
FROM pay_salary_backup_20260108;

-- Show sample of backed up data
SELECT 
    pay_id,
    employee_code,
    month,
    year,
    basic_salary,
    gross_salary,
    net_salary,
    approval_status
FROM pay_salary_backup_20260108
ORDER BY pay_id DESC
LIMIT 5;
