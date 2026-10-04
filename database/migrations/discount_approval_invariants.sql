-- Discount approval invariants
-- Pending assignments must not be active, and invoice-discount replacement intent
-- must be explicit so approval can apply the replacement atomically.
ALTER TABLE `invoice_discounts`
  ADD COLUMN IF NOT EXISTS `replacement_discount_id` int(11) NULL AFTER `profile_id`;

ALTER TABLE `student_discount_assignments`
  MODIFY `is_active` tinyint(1) DEFAULT 0;

UPDATE `student_discount_assignments`
SET `is_active` = 0
WHERE `status` = 'pending' AND `is_active` <> 0;
