-- ============================================================================
-- Payroll System Enhancements - Database Migration
-- ============================================================================
-- Description: Comprehensive database migration for payroll system enhancements
--              including security, approval workflows, tax automation, and audit trails
-- Author: Kiro AI Assistant
-- Date: June 3, 2026
-- Version: 1.0
-- ============================================================================

-- Set safe mode off for this migration
SET SQL_MODE='ALLOW_INVALID_DATES';

-- ============================================================================
-- TASK 1: Enhance pay_salary table
-- ============================================================================

-- Note: MySQL does not support IF NOT EXISTS with ALTER TABLE ADD COLUMN
-- If a column already exists, MySQL will return an error
-- Run this migration only once or check column existence before running

-- Add approval workflow status column
ALTER TABLE pay_salary 
  ADD COLUMN approval_status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'paid') 
    DEFAULT 'paid' 
    COMMENT 'Approval workflow status for payroll records'
    AFTER status;

-- Add timestamp columns for auditing
ALTER TABLE pay_salary 
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Record creation timestamp'
    AFTER approval_status;

ALTER TABLE pay_salary 
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
    COMMENT 'Record last update timestamp'
    AFTER created_at;

-- Add sync metadata columns for offline sync support
ALTER TABLE pay_salary 
  ADD COLUMN sync_status ENUM('synced', 'pending', 'conflict') 
    DEFAULT 'synced' 
    COMMENT 'Offline sync status'
    AFTER updated_at;

ALTER TABLE pay_salary 
  ADD COLUMN last_modified_at TIMESTAMP NULL 
    COMMENT 'Last modification timestamp for sync'
    AFTER sync_status;

ALTER TABLE pay_salary 
  ADD COLUMN device_id VARCHAR(100) NULL 
    COMMENT 'Device identifier for sync tracking'
    AFTER last_modified_at;

ALTER TABLE pay_salary 
  ADD COLUMN last_modified_by INT NULL 
    COMMENT 'User ID who last modified the record'
    AFTER device_id;

-- Fix data type inconsistencies
ALTER TABLE pay_salary 
  MODIFY COLUMN other_deductions DOUBLE DEFAULT 0 
    COMMENT 'Other deductions amount';

ALTER TABLE pay_salary 
  MODIFY COLUMN month VARCHAR(20) NOT NULL 
    COMMENT 'Payroll month name';

ALTER TABLE pay_salary 
  MODIFY COLUMN year INT NOT NULL 
    COMMENT 'Payroll year';

-- Add performance indexes
-- Note: MySQL does not support IF NOT EXISTS with CREATE INDEX
-- If an index already exists, MySQL will return an error
-- Check index existence before running or drop existing indexes first

CREATE INDEX idx_employee_month_year 
  ON pay_salary(employee_code, month, year);

CREATE INDEX idx_approval_status 
  ON pay_salary(approval_status);

CREATE INDEX idx_created_at 
  ON pay_salary(created_at);

-- Add unique constraint for duplicate prevention
-- Note: This will fail if duplicates exist - clean up duplicates first
-- If constraint already exists, MySQL will return an error
ALTER TABLE pay_salary 
  ADD CONSTRAINT uk_employee_month_year 
  UNIQUE (employee_code, month, year);

-- ============================================================================
-- TASK 2.1: Create payroll_approvals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_approvals (
  approval_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY 
    COMMENT 'Primary key for approval records',
  
  pay_id INT NOT NULL 
    COMMENT 'Foreign key to pay_salary table',
  
  approver_user_id INT NOT NULL 
    COMMENT 'User ID of the approver',
  
  approver_role VARCHAR(50) NOT NULL 
    COMMENT 'Role of the approver at time of action',
  
  action ENUM('approved', 'rejected', 'submitted') NOT NULL 
    COMMENT 'Approval action taken',
  
  comments TEXT NULL 
    COMMENT 'Optional comments or rejection reason',
  
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Timestamp when action was taken',
  
  FOREIGN KEY (pay_id) REFERENCES pay_salary(pay_id) ON DELETE CASCADE,
  INDEX idx_pay_id (pay_id),
  INDEX idx_action_date (action_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Tracks approval workflow history for payroll records';

-- ============================================================================
-- TASK 2.2: Create audit_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY 
    COMMENT 'Primary key for audit log entries',
  
  user_id INT NOT NULL 
    COMMENT 'User who performed the action',
  
  module VARCHAR(50) NOT NULL 
    COMMENT 'Module name (e.g., payroll, staff, student)',
  
  action VARCHAR(50) NOT NULL 
    COMMENT 'Action performed (create, update, delete, view)',
  
  record_id VARCHAR(100) NULL 
    COMMENT 'Identifier of the affected record',
  
  before_data TEXT NULL 
    COMMENT 'JSON snapshot of data before change',
  
  after_data TEXT NULL 
    COMMENT 'JSON snapshot of data after change',
  
  ip_address VARCHAR(45) NULL 
    COMMENT 'IP address of the user (supports IPv6)',
  
  user_agent VARCHAR(255) NULL 
    COMMENT 'Browser/device user agent string',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Timestamp when action occurred',
  
  INDEX idx_module_action (module, action),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Immutable audit trail for all payroll operations';

-- ============================================================================
-- TASK 2.3: Create tax_brackets table and insert Ghana 2024 tax data
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_brackets (
  bracket_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY 
    COMMENT 'Primary key for tax bracket records',
  
  country VARCHAR(50) DEFAULT 'Ghana' 
    COMMENT 'Country for which tax bracket applies',
  
  bracket_name VARCHAR(100) NOT NULL 
    COMMENT 'Descriptive name for the tax bracket',
  
  min_income DECIMAL(15,2) NOT NULL 
    COMMENT 'Minimum annual income for this bracket',
  
  max_income DECIMAL(15,2) NULL 
    COMMENT 'Maximum annual income for this bracket (NULL = no upper limit)',
  
  tax_rate DECIMAL(5,2) NOT NULL 
    COMMENT 'Tax rate as percentage (e.g., 17.5 for 17.5%)',
  
  fixed_amount DECIMAL(15,2) DEFAULT 0 
    COMMENT 'Fixed tax amount from previous brackets',
  
  is_active TINYINT(1) DEFAULT 1 
    COMMENT 'Whether this bracket is currently active',
  
  effective_from DATE NOT NULL 
    COMMENT 'Date when this bracket becomes effective',
  
  effective_to DATE NULL 
    COMMENT 'Date when this bracket expires (NULL = no expiry)',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Record creation timestamp',
  
  INDEX idx_effective_dates (effective_from, effective_to),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Progressive tax brackets for automated PAYE calculation';

-- Insert Ghana 2024 progressive tax brackets (Annual amounts in GHS)
-- Based on Ghana Revenue Authority tax tables
INSERT INTO tax_brackets 
  (bracket_name, min_income, max_income, tax_rate, fixed_amount, effective_from) 
VALUES
  ('First Bracket - Tax Free', 0.00, 5880.00, 0.00, 0.00, '2024-01-01'),
  ('Second Bracket - 5%', 5880.01, 8040.00, 5.00, 0.00, '2024-01-01'),
  ('Third Bracket - 10%', 8040.01, 11160.00, 10.00, 108.00, '2024-01-01'),
  ('Fourth Bracket - 17.5%', 11160.01, 49560.00, 17.5, 420.00, '2024-01-01'),
  ('Fifth Bracket - 25%', 49560.01, 240000.00, 25.00, 7140.00, '2024-01-01'),
  ('Sixth Bracket - 30%', 240000.01, 600000.00, 30.00, 54750.00, '2024-01-01'),
  ('Seventh Bracket - 35%', 600000.01, NULL, 35.00, 162750.00, '2024-01-01')
ON DUPLICATE KEY UPDATE 
  bracket_name = VALUES(bracket_name),
  tax_rate = VALUES(tax_rate),
  fixed_amount = VALUES(fixed_amount);

-- ============================================================================
-- Data Migration and Cleanup
-- ============================================================================

-- Set default approval_status for existing records to 'paid'
UPDATE pay_salary 
SET approval_status = 'paid' 
WHERE approval_status IS NULL;

-- Set sync_status to 'synced' for existing records
UPDATE pay_salary 
SET sync_status = 'synced' 
WHERE sync_status IS NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 
  'Payroll System Enhancements Migration Completed Successfully' AS status,
  NOW() AS completed_at;
