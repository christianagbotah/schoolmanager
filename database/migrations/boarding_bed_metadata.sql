-- Boarding bed metadata parity migration
-- Aligns boarding_bed with the live Boarding Beds form/controller.
ALTER TABLE `boarding_bed`
  ADD COLUMN IF NOT EXISTS `bed_number` varchar(50) NULL AFTER `bed_code`,
  ADD COLUMN IF NOT EXISTS `bed_type` varchar(50) NULL AFTER `bed_number`,
  ADD COLUMN IF NOT EXISTS `bed_description` text NULL AFTER `bed_type`;

-- Make bed assignment changes transactional with the InnoDB enroll table.
ALTER TABLE `boarding_bed` ENGINE=InnoDB;
