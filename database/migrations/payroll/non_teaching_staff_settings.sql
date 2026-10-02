-- Add system settings for non-teaching staff code generation
-- Task 15.2: Update staff creation forms

INSERT INTO `settings` (`type`, `description`) 
SELECT 'non_teaching_staff_code_prefix', 'NTS-'
WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `type` = 'non_teaching_staff_code_prefix');

INSERT INTO `settings` (`type`, `description`) 
SELECT 'non_teaching_staff_code_format', '00001'
WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `type` = 'non_teaching_staff_code_format');
