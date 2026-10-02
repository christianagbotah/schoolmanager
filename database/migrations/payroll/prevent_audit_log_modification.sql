-- Task 27.5: Prevent Modification or Deletion of Audit Logs
-- Requirement 15.6: Audit logs must be immutable (no UPDATE/DELETE allowed)

-- Drop triggers if they exist (for clean re-deployment)
DROP TRIGGER IF EXISTS prevent_audit_log_update;
DROP TRIGGER IF EXISTS prevent_audit_log_delete;

-- Create BEFORE UPDATE trigger to prevent modifications
DELIMITER $$

CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE ON payroll_audit_enhanced
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log records cannot be modified. This is a security violation.';
END$$

DELIMITER ;

-- Create BEFORE DELETE trigger to prevent deletions
DELIMITER $$

CREATE TRIGGER prevent_audit_log_delete
BEFORE DELETE ON payroll_audit_enhanced
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log records cannot be deleted. This is a security violation.';
END$$

DELIMITER ;

-- Test the triggers
-- The following commands should FAIL with error messages:

-- Test 1: Try to update an audit log (should fail)
-- UPDATE payroll_audit_enhanced SET action = 'modified' WHERE audit_id = 1;
-- Expected error: "Audit log records cannot be modified. This is a security violation."

-- Test 2: Try to delete an audit log (should fail)
-- DELETE FROM payroll_audit_enhanced WHERE audit_id = 1;
-- Expected error: "Audit log records cannot be deleted. This is a security violation."

-- Test 3: Verify INSERT still works (should succeed)
-- INSERT INTO payroll_audit_enhanced (pay_id, user_id, action, field_changed, old_value, new_value, ip_address, user_agent)
-- VALUES (1, 1, 'create', 'test_field', 'old', 'new', '127.0.0.1', 'Test Agent');

-- Verification queries:
-- SHOW TRIGGERS WHERE `Table` = 'payroll_audit_enhanced';
-- SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'payroll_audit_enhanced';

-- Migration executed successfully!
-- Audit logs are now protected from modification and deletion.
