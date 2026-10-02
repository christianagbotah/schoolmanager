-- ============================================================================
-- COMPLETE CURRICULUM TABLES MIGRATION (GES Standards)
-- ============================================================================
-- Purpose: Create all curriculum-related tables for GES curriculum alignment
-- Date: 2026-05-05
-- Tables: curriculum_strands, curriculum_sub_strands, curriculum_indicators
-- ============================================================================

-- ============================================================================
-- TABLE 1: curriculum_strands
-- ============================================================================
-- Purpose: Top-level curriculum organization (e.g., Number, Algebra, Geometry)

DROP TABLE IF EXISTS `curriculum_strands`;
CREATE TABLE IF NOT EXISTS `curriculum_strands` (
  `strand_id` INT NOT NULL AUTO_INCREMENT,
  `strand_code` VARCHAR(20) NOT NULL COMMENT 'Unique code for the strand (e.g., B1, B2)',
  `strand_name` VARCHAR(200) NOT NULL COMMENT 'Name of the strand (e.g., Number, Algebra)',
  `subject_id` INT NOT NULL COMMENT 'Reference to subject table',
  `class_category` VARCHAR(50) NOT NULL COMMENT 'Class level (e.g., Lower Primary, Upper Primary)',
  `description` TEXT COMMENT 'Detailed description of the strand',
  `display_order` INT DEFAULT 0 COMMENT 'Order for displaying strands',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`strand_id`),
  UNIQUE KEY `unique_strand` (`strand_code`, `subject_id`, `class_category`),
  KEY `idx_subject` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
COMMENT='GES Curriculum Strands - top-level curriculum organization';

-- ============================================================================
-- TABLE 2: curriculum_sub_strands
-- ============================================================================
-- Purpose: Sub-divisions within strands (e.g., Whole Numbers, Fractions)

DROP TABLE IF EXISTS `curriculum_sub_strands`;
CREATE TABLE IF NOT EXISTS `curriculum_sub_strands` (
  `sub_strand_id` INT NOT NULL AUTO_INCREMENT,
  `strand_id` INT NOT NULL COMMENT 'Reference to parent strand',
  `sub_strand_code` VARCHAR(20) NOT NULL COMMENT 'Unique code for the sub-strand (e.g., B1.1, B1.2)',
  `sub_strand_name` VARCHAR(200) NOT NULL COMMENT 'Name of the sub-strand (e.g., Whole Numbers)',
  `description` TEXT COMMENT 'Detailed description of the sub-strand',
  `display_order` INT DEFAULT 0 COMMENT 'Order for displaying sub-strands within strand',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_strand_id`),
  UNIQUE KEY `unique_sub_strand` (`sub_strand_code`, `strand_id`),
  KEY `idx_strand` (`strand_id`),
  CONSTRAINT `curriculum_sub_strands_ibfk_1` 
    FOREIGN KEY (`strand_id`) 
    REFERENCES `curriculum_strands` (`strand_id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
COMMENT='GES Curriculum Sub-Strands - subdivisions within strands';

-- ============================================================================
-- TABLE 3: curriculum_indicators
-- ============================================================================
-- Purpose: Specific learning outcomes within sub-strands

DROP TABLE IF EXISTS `curriculum_indicators`;
CREATE TABLE IF NOT EXISTS `curriculum_indicators` (
  `indicator_id` INT NOT NULL AUTO_INCREMENT,
  `sub_strand_id` INT NOT NULL COMMENT 'Reference to parent sub-strand',
  `indicator_code` VARCHAR(20) NOT NULL COMMENT 'Unique code for the indicator (e.g., B1.1.1.1)',
  `indicator_text` TEXT NOT NULL COMMENT 'Full text description of the learning indicator',
  `display_order` INT DEFAULT 0 COMMENT 'Order for displaying indicators within sub-strand',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`indicator_id`),
  UNIQUE KEY `unique_indicator` (`indicator_code`, `sub_strand_id`),
  KEY `idx_sub_strand` (`sub_strand_id`),
  CONSTRAINT `curriculum_indicators_ibfk_1` 
    FOREIGN KEY (`sub_strand_id`) 
    REFERENCES `curriculum_sub_strands` (`sub_strand_id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
COMMENT='GES Curriculum Learning Indicators - specific learning outcomes';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '=== VERIFICATION: Tables Created ===' AS info;

-- Check all three tables
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name IN ('curriculum_strands', 'curriculum_sub_strands', 'curriculum_indicators')
ORDER BY 
    CASE table_name
        WHEN 'curriculum_strands' THEN 1
        WHEN 'curriculum_sub_strands' THEN 2
        WHEN 'curriculum_indicators' THEN 3
    END;

-- Show table structures
SELECT '=== TABLE STRUCTURE: curriculum_strands ===' AS info;
DESCRIBE curriculum_strands;

SELECT '=== TABLE STRUCTURE: curriculum_sub_strands ===' AS info;
DESCRIBE curriculum_sub_strands;

SELECT '=== TABLE STRUCTURE: curriculum_indicators ===' AS info;
DESCRIBE curriculum_indicators;

-- Show foreign key relationships
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' AS info;

SELECT 
    CONCAT(TABLE_NAME, '.', COLUMN_NAME) AS from_column,
    CONCAT(REFERENCED_TABLE_NAME, '.', REFERENCED_COLUMN_NAME) AS to_column,
    CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('curriculum_sub_strands', 'curriculum_indicators')
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- ============================================================================
-- SAMPLE DATA (Optional - Uncomment to insert)
-- ============================================================================
/*
-- Sample Strand (Mathematics - Number)
INSERT INTO curriculum_strands (strand_code, strand_name, subject_id, class_category, description, display_order)
VALUES ('B1', 'Number', 1, 'Lower Primary', 'Understanding numbers and number operations', 1);

-- Sample Sub-Strand (Whole Numbers)
INSERT INTO curriculum_sub_strands (strand_id, sub_strand_code, sub_strand_name, description, display_order)
VALUES (1, 'B1.1', 'Whole Numbers', 'Counting, reading, and writing whole numbers', 1);

-- Sample Indicators
INSERT INTO curriculum_indicators (sub_strand_id, indicator_code, indicator_text, display_order)
VALUES 
(1, 'B1.1.1.1', 'Count and write numbers from 0 to 100', 1),
(1, 'B1.1.1.2', 'Identify place value of digits in numbers up to 100', 2),
(1, 'B1.1.1.3', 'Compare and order numbers up to 100', 3),
(1, 'B1.1.1.4', 'Round numbers to the nearest 10', 4);
*/

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
/*
CURRICULUM HIERARCHY:
1. Subject (e.g., Mathematics, English) - from existing subject table
2. Strand (e.g., Number, Algebra, Geometry) - curriculum_strands
3. Sub-Strand (e.g., Whole Numbers, Fractions) - curriculum_sub_strands
4. Indicator (e.g., B1.1.1.1 - Count 0-100) - curriculum_indicators

INTEGRATION POINTS:
- portfolio_headers: Links lesson notes to curriculum indicators
- sba_components: Links assessments to curriculum standards
- lesson_plans: Aligns lessons with curriculum requirements

BENEFITS:
- Curriculum coverage tracking
- Standards-based reporting
- GES compliance verification
- Learning outcome alignment
- Progress monitoring by standard

MAINTENANCE:
- Import curriculum data from GES curriculum documents
- Update when curriculum standards change
- Maintain display_order for proper sequencing
- Use CSV import for bulk data loading
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
