-- Private message/group attachment storage keys.
-- Original filenames remain display-only; bytes live outside the web root.
ALTER TABLE `message`
    ADD COLUMN IF NOT EXISTS `attached_file_storage_key` LONGTEXT NULL AFTER `attached_file_name`;

ALTER TABLE `group_message`
    ADD COLUMN IF NOT EXISTS `attached_file_storage_key` LONGTEXT NULL AFTER `attached_file_name`;
