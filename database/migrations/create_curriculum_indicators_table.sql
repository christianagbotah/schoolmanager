-- ============================================================================
-- CURRICULUM INDICATORS TABLE MIGRATION
-- ============================================================================
-- Purpose: Create curriculum_indicators table for GES curriculum alignment
-- Date: 2026-05-05
-- Dependencies: curriculum_sub_strands table must exist
-- ============================================================================

-- Check if curriculum_sub_strands exists (dependency)
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK: curriculum_sub_strands table exists'
        ELSE 'ERROR: curriculum_sub_strands table does not exist - create it first!'
    END AS dependency_check
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'curriculum_sub_strands';

-- ============================================================================
-- CREATE TABLE: curriculum_indicators
-- ============================================================================

CREATE TABLE IF NOT EXISTS `curriculum_indicators` (
  `indicator_id` INT NOT NULL AUTO_INCREMENT,
  `sub_strand_id` INT NOT NULL,
  `indicator_code` VARCHAR(20) NOT NULL COMMENT 'Unique code for the indicator (e.g., B1.1.1.1)',
  `indicator_text` TEXT NOT NULL COMMENT 'Full text description of the learning indicator',
  `display_order` INT DEFAULT 0 COMMENT 'Order for displaying indicators within a sub-strand',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`indicator_id`),
  UNIQUE KEY `unique_indicator` (`indicator_code`, `sub_strand_id`),
  KEY `idx_sub_strand` (`sub_strand_id`),
  CONSTRAINT `curriculum_indicators_ibfk_1` 
    FOREIGN KEY (`sub_strand_id`) 
    REFERENCES `curriculum_sub_strands` (`sub_strand_id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
COMMENT='GES Curriculum Learning Indicators - specific learning outcomes within sub-strands';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if table was created successfully
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS: curriculum_indicators table created'
        ELSE '❌ FAILED: curriculum_indicators table not created'
    END AS creation_status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'curriculum_indicators';

-- Show table structure
DESCRIBE curriculum_indicators;

-- Show indexes
SHOW INDEX FROM curriculum_indicators;

-- Show foreign keys
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'curriculum_indicators'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
/*
CURRICULUM HIERARCHY:
1. Subject (e.g., Mathematics, English)
2. Strand (e.g., Number, Algebra, Geometry)
3. Sub-Strand (e.g., Whole Numbers, Fractions, Decimals)
4. Indicator (e.g., B1.1.1.1 - Count and write numbers 0-100)

EXAMPLE DATA:
INSERT INTO curriculum_indicators (sub_strand_id, indicator_code, indicator_text, display_order)
VALUES 
(1, 'B1.1.1.1', 'Count and write numbers from 0 to 100', 1),
(1, 'B1.1.1.2', 'Identify place value of digits in numbers up to 100', 2),
(1, 'B1.1.1.3', 'Compare and order numbers up to 100', 3);

INTEGRATION:
- Used in portfolio_headers for GES lesson notes
- Links learning activities to specific curriculum indicators
- Enables curriculum coverage tracking and reporting
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
