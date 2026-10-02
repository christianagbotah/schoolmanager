-- Lesson Note Templates Table
-- Allows teachers to create reusable templates for lesson notes

CREATE TABLE IF NOT EXISTS `lesson_note_templates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL COMMENT 'Teacher who created the template',
  `template_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL COMMENT 'NULL = all subjects',
  `class_id` int(11) DEFAULT NULL COMMENT 'NULL = all classes',
  `tags` varchar(500) DEFAULT NULL COMMENT 'Comma-separated tags',
  
  -- Template Content Fields
  `topic_template` varchar(500) DEFAULT NULL,
  `objectives_template` text DEFAULT NULL,
  `introduction_template` text DEFAULT NULL,
  `content_template` text DEFAULT NULL,
  `conclusion_template` text DEFAULT NULL,
  `assessment_template` text DEFAULT NULL,
  `homework_template` text DEFAULT NULL,
  
  -- Sharing and Usage
  `is_shared` tinyint(1) DEFAULT 0 COMMENT '1 = shared with other teachers',
  `usage_count` int(11) DEFAULT 0 COMMENT 'Number of times used',
  `last_used_at` datetime DEFAULT NULL,
  
  -- Timestamps
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`template_id`),
  KEY `idx_school` (`school_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_subject` (`subject_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_shared` (`is_shared`),
  
  CONSTRAINT `fk_template_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_template_teacher` FOREIGN KEY (`created_by`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_template_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_template_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for full-text search on template name and tags
ALTER TABLE `lesson_note_templates` ADD FULLTEXT KEY `ft_search` (`template_name`, `tags`, `description`);

-- Track which lesson notes were created from templates
ALTER TABLE `lesson_notes` 
ADD COLUMN `template_id` int(11) DEFAULT NULL COMMENT 'Template used to create this note' AFTER `copied_from_id`,
ADD KEY `idx_template` (`template_id`),
ADD CONSTRAINT `fk_lesson_note_template` FOREIGN KEY (`template_id`) REFERENCES `lesson_note_templates` (`template_id`) ON DELETE SET NULL;

-- Sample templates for common lesson types
INSERT INTO `lesson_note_templates` 
(`school_id`, `created_by`, `template_name`, `description`, `tags`, `topic_template`, `objectives_template`, `introduction_template`, `content_template`, `conclusion_template`, `assessment_template`, `homework_template`, `is_shared`) 
VALUES
(1, 1, 'Standard Lesson Plan', 'A general-purpose template suitable for most subjects and topics', 'general,standard,basic', 
'Introduction to [TOPIC]', 
'By the end of this lesson, students will be able to:
1. Understand the key concepts of [TOPIC]
2. Apply knowledge to solve problems
3. Demonstrate understanding through practical activities',
'Begin with a question or real-world example to engage students and connect to prior knowledge.',
'1. Present main concepts with clear explanations
2. Provide examples and demonstrations
3. Guide students through practice activities
4. Facilitate group discussions or pair work',
'Summarize key points learned
Review objectives and assess understanding
Preview next lesson',
'Formative: Observation during activities, questioning
Summative: Exit ticket or quick quiz',
'Complete practice exercises
Read assigned materials
Prepare for next lesson',
1),

(1, 1, 'Practical/Hands-On Lesson', 'Template for lessons involving experiments, demonstrations, or practical activities', 'practical,experiment,hands-on,activity',
'Practical Activity: [TOPIC]',
'Students will:
1. Conduct a practical activity related to [TOPIC]
2. Observe and record results
3. Analyze findings and draw conclusions',
'Safety briefing and materials preparation
Demonstrate the activity
Explain expected outcomes',
'1. Students work in groups to complete the activity
2. Teacher circulates to provide guidance
3. Students record observations and data
4. Class discussion of results',
'Groups present findings
Compare results across groups
Discuss what was learned',
'Practical skills demonstration
Observation records
Group presentations',
'Write up practical report
Answer reflection questions
Research related topics',
1),

(1, 1, 'Problem-Solving Lesson', 'Template for mathematics and science problem-solving lessons', 'problem-solving,mathematics,science,critical-thinking',
'Problem Solving: [TOPIC]',
'Students will:
1. Identify problem-solving strategies
2. Apply methods to solve [TOPIC] problems
3. Explain their reasoning and solutions',
'Present a challenge problem
Discuss what makes it challenging
Activate prior knowledge',
'1. Model problem-solving process (think-aloud)
2. Provide guided practice with scaffolding
3. Students work independently or in pairs
4. Share different solution methods',
'Compare solution strategies
Identify common errors
Reinforce key concepts',
'Problem-solving accuracy
Explanation of reasoning
Use of appropriate strategies',
'Complete problem set
Create own similar problems
Explain solutions in writing',
1);
