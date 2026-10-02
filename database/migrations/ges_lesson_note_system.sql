-- ============================================
-- GES-Compliant Lesson Note System Migration
-- ============================================
-- This migration creates ALL tables required for the GES lesson note system
-- including curriculum tables, lesson notes, junction tables, and reference data.
-- 
-- Requirements: 16.1-16.10, 3.1, 4.1, 5.1, 8.9, 17.7, 18.1
-- 
-- Database: schoolmanager
-- Tables verified:
-- - teacher.teacher_id (INT) - primary key
-- - class.class_id (INT) - primary key
-- - subject.subject_id (INT) - primary key
-- - admin.admin_id (INT) - primary key
-- 
-- BEFORE RUNNING: Delete existing curriculum tables if they exist:
-- DROP TABLE IF EXISTS curriculum_learning_indicators;
-- DROP TABLE IF EXISTS curriculum_content_standards;
-- DROP TABLE IF EXISTS curriculum_sub_strands;
-- DROP TABLE IF EXISTS curriculum_strands;
-- DROP TABLE IF EXISTS core_competencies;
-- ============================================

-- ============================================
-- STEP 0: Drop existing tables (run this first if needed)
-- ============================================

DROP TABLE IF EXISTS lesson_note_indicators;
DROP TABLE IF EXISTS lesson_note_competencies;
DROP TABLE IF EXISTS lesson_note_resources;
DROP TABLE IF EXISTS lesson_note_assessments;
DROP TABLE IF EXISTS lesson_note_references;
DROP TABLE IF EXISTS lesson_note_revisions;
DROP TABLE IF EXISTS lesson_note_notifications;
DROP TABLE IF EXISTS hod_subjects;
DROP TABLE IF EXISTS lesson_notes;
DROP TABLE IF EXISTS teaching_resources_master;
DROP TABLE IF EXISTS assessment_methods_master;
DROP TABLE IF EXISTS curriculum_learning_indicators;
DROP TABLE IF EXISTS curriculum_content_standards;
DROP TABLE IF EXISTS curriculum_sub_strands;
DROP TABLE IF EXISTS curriculum_strands;
DROP TABLE IF EXISTS core_competencies;

-- ============================================
-- STEP 1: Create Curriculum Tables
-- ============================================

-- Curriculum Strands Table
-- Requirements: 16.3
CREATE TABLE curriculum_strands (
    strand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL COMMENT 'References subject.subject_id',
    class_level VARCHAR(50) NULL COMMENT 'Class level this strand applies to',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_subject_class (subject_id, class_level),
    UNIQUE KEY unique_strand_subject (name, subject_id, class_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Curriculum Sub-Strands Table
-- Requirements: 16.4
CREATE TABLE curriculum_sub_strands (
    sub_strand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    strand_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_strand (strand_id),
    UNIQUE KEY unique_sub_strand (name, strand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Curriculum Content Standards Table
-- Requirements: 16.5
CREATE TABLE curriculum_content_standards (
    content_standard_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL COMMENT 'e.g., B4.1.1.1',
    description TEXT NOT NULL,
    sub_strand_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sub_strand (sub_strand_id),
    UNIQUE KEY unique_standard (code, sub_strand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Curriculum Learning Indicators Table
-- Requirements: 16.6
CREATE TABLE curriculum_learning_indicators (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL COMMENT 'e.g., B4.1.1.1.1',
    description TEXT NOT NULL,
    content_standard_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_content_standard (content_standard_id),
    UNIQUE KEY unique_indicator (code, content_standard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Core Competencies Reference Table
-- Requirements: 16.9, 3.1
CREATE TABLE core_competencies (
    competency_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 2: Create Lesson Notes Table
-- ============================================

-- Requirements: 16.1, 16.2
CREATE TABLE lesson_notes (
    lesson_note_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL COMMENT 'References teacher.teacher_id',
    class_id INT NOT NULL COMMENT 'References class.class_id',
    subject_id INT NOT NULL COMMENT 'References subject.subject_id',
    strand_id INT NULL COMMENT 'References curriculum_strands.strand_id',
    sub_strand_id INT NULL COMMENT 'References curriculum_sub_strands.sub_strand_id',
    content_standard_id INT NULL COMMENT 'References curriculum_content_standards.content_standard_id',
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    week_number TINYINT NOT NULL COMMENT '1-12',
    term TINYINT NOT NULL COMMENT '1-3',
    lesson_date DATE NOT NULL,
    
    -- Lesson Content
    lesson_objectives TEXT NULL,
    lesson_activities TEXT NULL,
    lesson_content LONGTEXT NULL,
    
    -- File Attachments
    file_path VARCHAR(500) NULL,
    file_name VARCHAR(255) NULL,
    file_type VARCHAR(50) NULL,
    
    -- Status and Workflow
    status ENUM('draft', 'pending', 'hod_reviewed', 'revision_requested', 'approved', 'declined') DEFAULT 'pending',
    feedback TEXT NULL COMMENT 'Feedback from admin/HOD',
    
    -- HOD Review
    hod_id INT NULL COMMENT 'References teacher.teacher_id (HOD)',
    hod_review_date DATETIME NULL,
    hod_feedback TEXT NULL,
    
    -- Admin Review
    admin_id INT NULL COMMENT 'References admin.admin_id',
    admin_review_date DATETIME NULL,
    
    -- Copy Reference
    source_lesson_note_id INT NULL COMMENT 'Reference to original if copied',
    
    -- Version Control
    version INT DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_teacher (teacher_id),
    INDEX idx_class_subject (class_id, subject_id),
    INDEX idx_status (status),
    INDEX idx_week_term (week_number, term),
    INDEX idx_date (lesson_date),
    INDEX idx_strand (strand_id),
    INDEX idx_sub_strand (sub_strand_id),
    INDEX idx_content_standard (content_standard_id),
    INDEX idx_hod (hod_id),
    INDEX idx_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: Create Junction Tables
-- ============================================

-- Lesson Note Indicators Junction Table
-- Requirements: 16.7
CREATE TABLE lesson_note_indicators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    indicator_id INT NOT NULL COMMENT 'References curriculum_learning_indicators.indicator_id',
    
    INDEX idx_lesson_note (lesson_note_id),
    INDEX idx_indicator (indicator_id),
    UNIQUE KEY unique_note_indicator (lesson_note_id, indicator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Note Competencies Junction Table
-- Requirements: 16.8
CREATE TABLE lesson_note_competencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    competency_id INT NOT NULL COMMENT 'References core_competencies.competency_id',
    
    INDEX idx_lesson_note (lesson_note_id),
    INDEX idx_competency (competency_id),
    UNIQUE KEY unique_note_competency (lesson_note_id, competency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Note Resources Table (TLRs)
-- Requirements: 4.4
CREATE TABLE lesson_note_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    resource_details TEXT NULL,
    quantity VARCHAR(50) NULL,
    is_custom TINYINT DEFAULT 0 COMMENT '1 if custom entry, 0 if from predefined list',
    
    INDEX idx_lesson_note (lesson_note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Note Assessments Table
-- Requirements: 5.5
CREATE TABLE lesson_note_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    method_name VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    is_custom TINYINT DEFAULT 0 COMMENT '1 if custom entry, 0 if from predefined list',
    
    INDEX idx_lesson_note (lesson_note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Note References Table
-- Requirements: 6.5
CREATE TABLE lesson_note_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NULL,
    publisher VARCHAR(255) NULL,
    year INT NULL,
    page_numbers VARCHAR(50) NULL,
    url VARCHAR(500) NULL,
    reference_type ENUM('primary', 'supplementary') DEFAULT 'supplementary',
    
    INDEX idx_lesson_note (lesson_note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Create Supporting Tables
-- ============================================

-- Lesson Note Revisions Table
-- Requirements: 18.1
CREATE TABLE lesson_note_revisions (
    revision_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_note_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'References teacher.teacher_id or admin.admin_id based on user_type',
    user_type ENUM('teacher', 'hod', 'admin') NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'create, update, submit, endorse, approve, decline, request_revision',
    changed_fields JSON NULL COMMENT 'JSON object of changed fields',
    feedback TEXT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_lesson_note (lesson_note_id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Note Notifications Table
-- Requirements: 17.7
CREATE TABLE lesson_note_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'References teacher.teacher_id or admin.admin_id based on user_type',
    user_type ENUM('teacher', 'hod', 'admin') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) DEFAULT 'lesson_note',
    reference_id INT NOT NULL COMMENT 'lesson_note_id',
    is_read TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id, user_type),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HOD Subject Assignments Table
-- Requirements: 10.8
CREATE TABLE hod_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL COMMENT 'HOD teacher ID - references teacher.teacher_id',
    subject_id INT NOT NULL COMMENT 'References subject.subject_id',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NOT NULL COMMENT 'Admin user ID - references admin.admin_id',
    
    UNIQUE KEY unique_hod_subject (teacher_id, subject_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_assigned_by (assigned_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teaching Resources Master Table
-- Requirements: 4.1
CREATE TABLE teaching_resources_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NULL COMMENT 'visual, audio, manipulative, digital, etc.',
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assessment Methods Master Table
-- Requirements: 5.1
CREATE TABLE assessment_methods_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 5: Add Foreign Key Constraints
-- ============================================

-- Foreign keys for curriculum tables
ALTER TABLE curriculum_strands
    ADD CONSTRAINT fk_cs_subject FOREIGN KEY (subject_id) 
        REFERENCES subject(subject_id) ON DELETE CASCADE;

ALTER TABLE curriculum_sub_strands
    ADD CONSTRAINT fk_css_strand FOREIGN KEY (strand_id) 
        REFERENCES curriculum_strands(strand_id) ON DELETE CASCADE;

ALTER TABLE curriculum_content_standards
    ADD CONSTRAINT fk_ccs_sub_strand FOREIGN KEY (sub_strand_id) 
        REFERENCES curriculum_sub_strands(sub_strand_id) ON DELETE CASCADE;

ALTER TABLE curriculum_learning_indicators
    ADD CONSTRAINT fk_cli_content_standard FOREIGN KEY (content_standard_id) 
        REFERENCES curriculum_content_standards(content_standard_id) ON DELETE CASCADE;

-- Foreign keys for lesson_notes
ALTER TABLE lesson_notes
    ADD CONSTRAINT fk_ln_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teacher(teacher_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ln_class FOREIGN KEY (class_id) 
        REFERENCES class(class_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ln_subject FOREIGN KEY (subject_id) 
        REFERENCES subject(subject_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ln_strand FOREIGN KEY (strand_id) 
        REFERENCES curriculum_strands(strand_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ln_sub_strand FOREIGN KEY (sub_strand_id) 
        REFERENCES curriculum_sub_strands(sub_strand_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ln_content_standard FOREIGN KEY (content_standard_id) 
        REFERENCES curriculum_content_standards(content_standard_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ln_hod FOREIGN KEY (hod_id) 
        REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ln_admin FOREIGN KEY (admin_id) 
        REFERENCES admin(admin_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ln_source FOREIGN KEY (source_lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE SET NULL;

-- Foreign keys for lesson_note_indicators
ALTER TABLE lesson_note_indicators
    ADD CONSTRAINT fk_lni_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_lni_indicator FOREIGN KEY (indicator_id) 
        REFERENCES curriculum_learning_indicators(indicator_id) ON DELETE CASCADE;

-- Foreign keys for lesson_note_competencies
ALTER TABLE lesson_note_competencies
    ADD CONSTRAINT fk_lnc_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_lnc_competency FOREIGN KEY (competency_id) 
        REFERENCES core_competencies(competency_id) ON DELETE CASCADE;

-- Foreign keys for lesson_note_resources
ALTER TABLE lesson_note_resources
    ADD CONSTRAINT fk_lnr_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE;

-- Foreign keys for lesson_note_assessments
ALTER TABLE lesson_note_assessments
    ADD CONSTRAINT fk_lna_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE;

-- Foreign keys for lesson_note_references
ALTER TABLE lesson_note_references
    ADD CONSTRAINT fk_lnref_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE;

-- Foreign keys for lesson_note_revisions
ALTER TABLE lesson_note_revisions
    ADD CONSTRAINT fk_lnrrev_lesson_note FOREIGN KEY (lesson_note_id) 
        REFERENCES lesson_notes(lesson_note_id) ON DELETE CASCADE;

-- Foreign keys for hod_subjects
ALTER TABLE hod_subjects
    ADD CONSTRAINT fk_hs_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teacher(teacher_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_hs_subject FOREIGN KEY (subject_id) 
        REFERENCES subject(subject_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_hs_admin FOREIGN KEY (assigned_by) 
        REFERENCES admin(admin_id) ON DELETE CASCADE;

-- ============================================
-- STEP 6: Seed Data
-- ============================================

-- Seed GES Core Competencies
-- Requirements: 3.1
INSERT INTO core_competencies (name, description, display_order) VALUES
('Critical Thinking and Problem Solving', 'Ability to analyze, evaluate, and solve problems creatively', 1),
('Creativity and Innovation', 'Ability to generate new ideas and apply them practically', 2),
('Communication', 'Ability to express ideas clearly and listen effectively', 3),
('Collaboration', 'Ability to work effectively with others toward common goals', 4),
('Cultural Identity and Global Citizenship', 'Understanding of cultural heritage and global perspectives', 5),
('Personal Development and Leadership', 'Self-management and ability to guide others', 6),
('Digital Literacy', 'Ability to use digital technologies effectively and responsibly', 7),
('Citizenship', 'Understanding of rights, responsibilities, and civic engagement', 8);

-- Seed Teaching Resources (TLRs)
-- Requirements: 4.1
INSERT INTO teaching_resources_master (name, category, display_order) VALUES
('Textbook', 'print', 1),
('Charts', 'visual', 2),
('Flashcards', 'visual', 3),
('Manipulatives', 'physical', 4),
('Digital Resources', 'digital', 5),
('Real Objects', 'physical', 6),
('Pictures', 'visual', 7),
('Videos', 'audio-visual', 8),
('Worksheets', 'print', 9),
('Whiteboard', 'visual', 10),
('Chalkboard', 'visual', 11),
('Models', 'physical', 12),
('Computers', 'digital', 13),
('Projector', 'audio-visual', 14),
('Audio Materials', 'audio', 15);

-- Seed Assessment Methods
-- Requirements: 5.1
INSERT INTO assessment_methods_master (name, description, display_order) VALUES
('Observation', 'Watching students during activities to assess understanding', 1),
('Written Exercise', 'Written tests or exercises to evaluate knowledge', 2),
('Oral Questions', 'Verbal questioning to check comprehension', 3),
('Project Work', 'Extended project-based assessment', 4),
('Group Work', 'Collaborative assessment in groups', 5),
('Practical Activity', 'Hands-on practical assessment', 6),
('Peer Assessment', 'Students assess each other''s work', 7),
('Self Assessment', 'Students assess their own work', 8),
('Quiz', 'Short informal test', 9),
('Test', 'Formal examination', 10),
('Class Exercise', 'In-class practice exercises', 11),
('Homework', 'Take-home assignments', 12),
('Presentation', 'Student presentations', 13),
('Portfolio', 'Collection of student work over time', 14);

-- ============================================
-- END OF MIGRATION
-- ============================================
