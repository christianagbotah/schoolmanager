-- GES Lesson Note Templates System
-- Allows teachers to create and reuse lesson note templates
-- Created: May 2, 2026

-- Templates table
CREATE TABLE IF NOT EXISTS `lesson_note_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `description` text,
  `subject_id` int(11) DEFAULT NULL COMMENT 'NULL = available for all subjects',
  `class_id` int(11) DEFAULT NULL COMMENT 'NULL = available for all classes',
  
  -- Template content (JSON structure matching lesson note fields)
  `teaching_methods` text COMMENT 'JSON array of teaching methods',
  `learning_activities` text COMMENT 'JSON array of learning activities',
  `assessment_methods` text COMMENT 'JSON array of assessment methods',
  `resources` text COMMENT 'JSON array of resources',
  `differentiation_strategies` text,
  `homework_assignment` text,
  `reflection_notes` text,
  
  -- Template metadata
  `is_public` tinyint(1) DEFAULT 0 COMMENT '1 = shared with all teachers, 0 = private',
  `usage_count` int(11) DEFAULT 0 COMMENT 'Number of times template has been used',
  `is_active` tinyint(1) DEFAULT 1,
  
  -- Audit fields
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  
  PRIMARY KEY (`template_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_subject` (`subject_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_public` (`is_public`, `is_active`),
  KEY `idx_usage` (`usage_count`),
  
  CONSTRAINT `fk_template_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_template_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_template_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template tags for categorization
CREATE TABLE IF NOT EXISTS `lesson_note_template_tags` (
  `tag_id` int(11) NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(100) NOT NULL,
  `tag_color` varchar(7) DEFAULT '#667eea' COMMENT 'Hex color code',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `uk_tag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS `lesson_note_template_tag_assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uk_template_tag` (`template_id`, `tag_id`),
  KEY `idx_template` (`template_id`),
  KEY `idx_tag` (`tag_id`),
  
  CONSTRAINT `fk_tta_template` FOREIGN KEY (`template_id`) REFERENCES `lesson_note_templates` (`template_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tta_tag` FOREIGN KEY (`tag_id`) REFERENCES `lesson_note_template_tags` (`tag_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template favorites (teachers can favorite templates for quick access)
CREATE TABLE IF NOT EXISTS `lesson_note_template_favorites` (
  `favorite_id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uk_teacher_template` (`teacher_id`, `template_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_template` (`template_id`),
  
  CONSTRAINT `fk_favorite_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorite_template` FOREIGN KEY (`template_id`) REFERENCES `lesson_note_templates` (`template_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tags
INSERT INTO `lesson_note_template_tags` (`tag_name`, `tag_color`) VALUES
('Group Work', '#10b981'),
('Individual Study', '#3b82f6'),
('Practical Activity', '#f59e0b'),
('Discussion', '#8b5cf6'),
('Assessment', '#ef4444'),
('Project-Based', '#ec4899'),
('Technology-Enhanced', '#06b6d4'),
('Differentiated', '#84cc16'),
('Inquiry-Based', '#f97316'),
('Collaborative', '#14b8a6')
ON DUPLICATE KEY UPDATE tag_name = tag_name;

-- Insert sample public templates (created by system admin)
-- Note: These will need to be inserted with actual teacher_id after system setup
