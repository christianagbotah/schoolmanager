-- ============================================================================
-- Migration: Teacher Attendance Privileges
-- Description: Create table to manage teacher privileges for attendance monitoring
-- Author: System
-- Date: 2026-05-15
-- ============================================================================

-- Create teacher_privileges table
CREATE TABLE IF NOT EXISTS `teacher_privileges` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` INT(11) NOT NULL COMMENT 'Foreign key to teacher table',
  `privilege_type` VARCHAR(50) NOT NULL DEFAULT 'attendance_monitoring' COMMENT 'Type of privilege granted',
  `granted_by` INT(11) NOT NULL COMMENT 'Admin ID who granted the privilege',
  `granted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when privilege was granted',
  `status` ENUM('active', 'revoked') NOT NULL DEFAULT 'active' COMMENT 'Current status of the privilege',
  `revoked_by` INT(11) NULL DEFAULT NULL COMMENT 'Admin ID who revoked the privilege',
  `revoked_at` DATETIME NULL DEFAULT NULL COMMENT 'Timestamp when privilege was revoked',
  `notes` TEXT NULL DEFAULT NULL COMMENT 'Additional notes about the privilege',
  PRIMARY KEY (`id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_privilege_type` (`privilege_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_granted_at` (`granted_at`),
  UNIQUE KEY `unique_active_privilege` (`teacher_id`, `privilege_type`, `status`),
  CONSTRAINT `fk_teacher_privileges_teacher` 
    FOREIGN KEY (`teacher_id`) 
    REFERENCES `teacher` (`teacher_id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_teacher_privileges_granted_by` 
    FOREIGN KEY (`granted_by`) 
    REFERENCES `admin` (`admin_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_teacher_privileges_revoked_by` 
    FOREIGN KEY (`revoked_by`) 
    REFERENCES `admin` (`admin_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores teacher privileges for various system features';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table creation
SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_COLLATION,
    TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher_privileges';

-- Verify indexes
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher_privileges'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verify foreign keys
SELECT 
    kcu.CONSTRAINT_NAME,
    kcu.COLUMN_NAME,
    kcu.REFERENCED_TABLE_NAME,
    kcu.REFERENCED_COLUMN_NAME,
    rc.DELETE_RULE,
    rc.UPDATE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
    AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE() 
  AND kcu.TABLE_NAME = 'teacher_privileges'
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================================
-- Test Data (Optional - for development/testing only)
-- ============================================================================

-- Uncomment below to insert test data
/*
-- Get a sample teacher ID and admin ID for testing
SET @test_teacher_id = (SELECT teacher_id FROM teacher LIMIT 1);
SET @test_admin_id = (SELECT admin_id FROM admin WHERE level = 1 LIMIT 1);

-- Insert test privilege
INSERT INTO teacher_privileges (teacher_id, privilege_type, granted_by, notes)
VALUES (@test_teacher_id, 'attendance_monitoring', @test_admin_id, 'Test privilege for development');

-- Verify test data
SELECT * FROM teacher_privileges;
*/

-- ============================================================================
-- Rollback Script
-- ============================================================================

/*
-- To rollback this migration, run the following:

-- Drop foreign key constraints first
ALTER TABLE teacher_privileges DROP FOREIGN KEY fk_teacher_privileges_teacher;
ALTER TABLE teacher_privileges DROP FOREIGN KEY fk_teacher_privileges_granted_by;
ALTER TABLE teacher_privileges DROP FOREIGN KEY fk_teacher_privileges_revoked_by;

-- Drop the table
DROP TABLE IF EXISTS teacher_privileges;

-- Verify rollback
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher_privileges';
-- Should return empty result
*/
