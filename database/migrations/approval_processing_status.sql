-- Approval workflow transient state support.
-- Both handlers mark a row as processing while applying financial changes.
ALTER TABLE `invoice_modification_requests`
  MODIFY COLUMN `status` enum('pending','processing','approved','declined') NOT NULL DEFAULT 'pending';

ALTER TABLE `receipt_modification_requests`
  MODIFY COLUMN `status` enum('pending','processing','approved','rejected','revoked') NOT NULL DEFAULT 'pending';

-- Receipt approval revocation is a first-class audited action.
ALTER TABLE `receipt_modification_audit`
  MODIFY COLUMN `action` enum('edit','delete','revoke') NOT NULL;
