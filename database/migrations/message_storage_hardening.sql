-- Private messaging storage hardening.
-- Run once after deploying the corresponding controller/model changes.
ALTER TABLE `message` ENGINE=InnoDB;

ALTER TABLE `message`
  ADD KEY `idx_message_thread_code` (`message_thread_code`(64)),
  ADD KEY `idx_message_sender` (`sender`(64)),
  ADD KEY `idx_message_read_status` (`read_status`);

ALTER TABLE `message_thread`
  ADD UNIQUE KEY `uq_message_thread_code` (`message_thread_code`(64)),
  ADD KEY `idx_message_thread_sender` (`sender`(64)),
  ADD KEY `idx_message_thread_receiver` (`reciever`(64)),
  ADD KEY `idx_message_thread_last_timestamp` (`last_message_timestamp`(32));
