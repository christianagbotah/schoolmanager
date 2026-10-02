-- ============================================================================
-- Create non_teaching_staff table
-- ============================================================================
-- Task: 15.1 - Create separate table for non-teaching staff
-- Requirements: 1.1, 1.2, 1.3
-- ============================================================================

-- Create non_teaching_staff table with structure similar to teacher and admin
CREATE TABLE IF NOT EXISTS non_teaching_staff (
  staff_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY 
    COMMENT 'Primary key for non-teaching staff',
  
  staff_code VARCHAR(50) NOT NULL UNIQUE
    COMMENT 'Unique staff code for identification',
  
  name LONGTEXT 
    COMMENT 'Full name (legacy field)',
  
  first_name VARCHAR(255) 
    COMMENT 'First name',
  
  other_name VARCHAR(255) 
    COMMENT 'Middle name',
  
  last_name VARCHAR(255) 
    COMMENT 'Last name',
  
  birthday LONGTEXT 
    COMMENT 'Date of birth',
  
  sex LONGTEXT 
    COMMENT 'Gender',
  
  religion LONGTEXT 
    COMMENT 'Religion',
  
  blood_group LONGTEXT 
    COMMENT 'Blood group',
  
  address LONGTEXT 
    COMMENT 'Physical address',
  
  phone LONGTEXT 
    COMMENT 'Phone number',
  
  email LONGTEXT 
    COMMENT 'Email address',
  
  password LONGTEXT 
    COMMENT 'Hashed password for portal access',
  
  ssnit_id VARCHAR(50) 
    COMMENT 'SSNIT number for pension',
  
  ghana_card_id VARCHAR(50) 
    COMMENT 'Ghana Card ID',
  
  petra_id VARCHAR(50) 
    COMMENT 'PETRA ID',
  
  tin VARCHAR(50)
    COMMENT 'Tax Identification Number',
  
  account_number VARCHAR(30) 
    COMMENT 'Bank account number',
  
  account_details LONGTEXT 
    COMMENT 'Bank account details (JSON)',
  
  authentication_key LONGTEXT 
    COMMENT 'Authentication key for sessions',
  
  designation VARCHAR(255) 
    COMMENT 'Job title/designation',
  
  department VARCHAR(100)
    COMMENT 'Department (e.g., Maintenance, Kitchen, Security)',
  
  employment_date DATE
    COMMENT 'Date of employment',
  
  employment_type ENUM('permanent', 'contract', 'casual') DEFAULT 'permanent'
    COMMENT 'Type of employment',
  
  social_links MEDIUMTEXT 
    COMMENT 'Social media links (JSON)',
  
  show_on_website INT DEFAULT 0 
    COMMENT 'Show on school website',
  
  read_notice_ids VARCHAR(255) 
    COMMENT 'Read notice IDs',
  
  block_limit INT DEFAULT 0 
    COMMENT 'Block limit for portal access',
  
  active_status ENUM('1', '0') DEFAULT '1' 
    COMMENT 'Active status',
  
  online_status ENUM('1', '0') DEFAULT '0' 
    COMMENT 'Online status',
  
  employment_category ENUM('teacher', 'administrator', 'non_teaching_staff') DEFAULT 'non_teaching_staff'
    COMMENT 'Employment category - always non_teaching_staff for this table',
  
  -- Sync metadata columns for offline sync support
  sync ENUM('yes', 'no') DEFAULT 'yes'
    COMMENT 'Include in sync',
  
  sync_status ENUM('PENDING', 'SYNCED', 'FAILED', 'MANUAL_REVIEW') DEFAULT 'SYNCED'
    COMMENT 'Sync status',
  
  last_modified_at TIMESTAMP NULL
    COMMENT 'Last modification timestamp',
  
  last_modified_by INT NULL
    COMMENT 'User ID who last modified',
  
  device_id VARCHAR(50) NULL
    COMMENT 'Device ID for sync tracking',
  
  version INT DEFAULT 0
    COMMENT 'Version number for conflict resolution',
  
  retry_count INT DEFAULT 0
    COMMENT 'Sync retry count',
  
  sync_error TEXT NULL
    COMMENT 'Last sync error message',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    COMMENT 'Record creation timestamp',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    COMMENT 'Record update timestamp',
  
  INDEX idx_staff_code (staff_code),
  INDEX idx_active_status (active_status),
  INDEX idx_employment_category (employment_category),
  INDEX idx_sync_status (sync_status),
  INDEX idx_department (department)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Non-teaching staff records for payroll and HR management';

-- ============================================================================
-- Remove employment_category from teacher and admin tables
-- (Since we're using separate tables, this field is redundant)
-- ============================================================================

-- Check and remove from teacher table
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacher' 
     AND COLUMN_NAME = 'employment_category') > 0,
    'ALTER TABLE teacher DROP COLUMN employment_category',
    'SELECT "Column employment_category does not exist in teacher" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and remove from admin table
SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'admin' 
     AND COLUMN_NAME = 'employment_category') > 0,
    'ALTER TABLE admin DROP COLUMN employment_category',
    'SELECT "Column employment_category does not exist in admin" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Ensure pay_salary has employment_category field
-- ============================================================================

SET @query = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'pay_salary' 
     AND COLUMN_NAME = 'employment_category') = 0,
    'ALTER TABLE pay_salary ADD COLUMN employment_category VARCHAR(20) DEFAULT NULL COMMENT ''Employment category: teacher, administrator, or non_teaching_staff'' AFTER employee_code',
    'SELECT "Column employment_category already exists in pay_salary" AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
  'non_teaching_staff table created' AS verification,
  COUNT(*) AS count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'non_teaching_staff';

SELECT 
  'employment_category removed from teacher' AS verification,
  COUNT(*) AS count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teacher'
  AND COLUMN_NAME = 'employment_category';

SELECT 
  'employment_category removed from admin' AS verification,
  COUNT(*) AS count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin'
  AND COLUMN_NAME = 'employment_category';

SELECT 
  'employment_category exists in pay_salary' AS verification,
  COUNT(*) AS count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'pay_salary'
  AND COLUMN_NAME = 'employment_category';

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 
  'Non-Teaching Staff Table Migration Completed Successfully' AS status,
  NOW() AS completed_at;
