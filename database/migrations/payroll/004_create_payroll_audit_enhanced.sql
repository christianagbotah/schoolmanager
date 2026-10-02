-- ============================================================================
-- Enhanced Payroll Audit Logging System
-- Creates table for comprehensive audit trail of all payroll changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_audit_enhanced (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pay_id INT NOT NULL,
    user_id INT NOT NULL,
    action ENUM('create', 'update', 'delete', 'approve', 'reject', 'submit', 'reopen') NOT NULL,
    field_changed VARCHAR(100) NULL COMMENT 'Field name that was changed (null for whole record actions)',
    old_value TEXT NULL COMMENT 'Previous value before change',
    new_value TEXT NULL COMMENT 'New value after change',
    ip_address VARCHAR(45) NULL COMMENT 'IP address of user making the change',
    user_agent VARCHAR(255) NULL COMMENT 'Browser user agent string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pay_id (pay_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_field_changed (field_changed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Enhanced audit log for all payroll changes with field-level tracking';

-- Note: Foreign key to pay_salary is NOT added to allow audit logs to persist
-- even if the payroll record is deleted (soft delete pattern)
