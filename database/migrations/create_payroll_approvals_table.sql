-- Migration: Create payroll_approvals table
-- Purpose: Support approval workflow for payroll processing
-- Requirements: 13.1, 13.6, 13.7, 14.7
-- Date: 2026-06-03

-- Create payroll_approvals table
CREATE TABLE IF NOT EXISTS `payroll_approvals` (
  `approval_id` INT NOT NULL AUTO_INCREMENT,
  `pay_id` INT NOT NULL,
  `approver_user_id` INT NOT NULL,
  `approver_role` VARCHAR(50) NOT NULL,
  `action` ENUM('approved', 'rejected', 'submitted') NOT NULL,
  `comments` TEXT NULL,
  `action_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`approval_id`),
  
  -- Foreign key to pay_salary table
  CONSTRAINT `fk_payroll_approvals_pay_id` 
    FOREIGN KEY (`pay_id`) 
    REFERENCES `pay_salary`(`pay_id`) 
    ON DELETE CASCADE,
  
  -- Index on pay_id for efficient lookups of approval history
  INDEX `idx_pay_id` (`pay_id`),
  
  -- Index on action_date for date-range queries and reporting
  INDEX `idx_action_date` (`action_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Add comment to table
ALTER TABLE `payroll_approvals` COMMENT = 'Tracks approval workflow for payroll records - HR submission, manager approval/rejection, and finance payment confirmation';
