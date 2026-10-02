-- ============================================================================
-- Add employment_category field to staff tables
-- ============================================================================
-- Task: 15.1 - Add employment_category field to staff tables
-- Requirements: 1.1, 1.2, 1.3
-- ============================================================================

-- Add employment_category to teacher table (if it doesn't exist)
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacher' 
     AND COLUMN_NAME = 'employment_category') = 0,
    'ALTER TABLE teacher ADD COLUMN employment_category ENUM(''teacher'', ''administrator'', ''non_teaching_staff'') DEFAULT ''teacher'' COMMENT ''Employment category for staff member'' AFTER online_status',
    'SELECT "Column employment_category already exists in teacher" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add employment_category to admin table (if it doesn't exist)
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'admin' 
     AND COLUMN_NAME = 'employment_category') = 0,
    'ALTER TABLE admin ADD COLUMN employment_category ENUM(''teacher'', ''administrator'', ''non_teaching_staff'') DEFAULT ''administrator'' COMMENT ''Employment category for administrative staff'' AFTER online_status',
    'SELECT "Column employment_category already exists in admin" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing teacher records to have employment_category = 'teacher'
UPDATE teacher 
SET employment_category = 'teacher' 
WHERE employment_category IS NULL OR employment_category = '';

-- Update existing admin records to have employment_category = 'administrator'
UPDATE admin 
SET employment_category = 'administrator' 
WHERE employment_category IS NULL OR employment_category = '';

-- Add index on employment_category in pay_salary for performance
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'pay_salary' 
     AND INDEX_NAME = 'idx_employment_category') = 0,
    'CREATE INDEX idx_employment_category ON pay_salary(employment_category)',
    'SELECT "Index idx_employment_category already exists" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Verification Queries
-- ============================================================================

SELECT 
  'employment_category field added to teacher' AS verification,
  COUNT(*) AS count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher'
  AND COLUMN_NAME = 'employment_category';

SELECT 
  'employment_category field added to admin' AS verification,
  COUNT(*) AS count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin'
  AND COLUMN_NAME = 'employment_category';

SELECT 
  'Teacher records updated' AS verification,
  COUNT(*) AS count
FROM teacher 
WHERE employment_category = 'teacher';

SELECT 
  'Admin records updated' AS verification,
  COUNT(*) AS count
FROM admin 
WHERE employment_category = 'administrator';

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 
  'Employment Category Field Migration Completed Successfully' AS status,
  NOW() AS completed_at;
