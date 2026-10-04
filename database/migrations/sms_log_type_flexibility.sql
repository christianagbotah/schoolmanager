-- Allow SMS log categories used by current and future senders.
ALTER TABLE `sms_log`
  MODIFY COLUMN `type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL;
