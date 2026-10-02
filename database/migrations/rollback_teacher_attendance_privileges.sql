-- ============================================================================
-- Rollback Migration: Teacher Attendance Privileges
-- Description: Rollback script to remove teacher_privileges table
-- Author: System
-- Date: 2026-05-15
-- ============================================================================

-- Backup existing data before rollback (optional)
-- Uncomment to create backup
/*
CREATE TABLE IF NOT EXISTS teacher_privileges_backup AS 
SELECT * FROM teacher_privileges;

SELECT COUNT(*) as backed_up_records FROM teacher_privileges_backup;
*/

-- Drop foreign key constraints first
ALTER TABLE teacher_privileges DROP FOREIGN KEY IF EXISTS fk_teacher_privileges_teacher;
ALTER TABLE teacher_privileges DROP FOREIGN KEY IF EXISTS fk_teacher_privileges_granted_by;
ALTER TABLE teacher_privileges DROP FOREIGN KEY IF EXISTS fk_teacher_privileges_revoked_by;

-- Drop the table
DROP TABLE IF EXISTS teacher_privileges;

-- Verify rollback
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher_privileges';
-- Should return empty result

-- Success message
SELECT 'Rollback completed successfully. teacher_privileges table has been removed.' AS status;
