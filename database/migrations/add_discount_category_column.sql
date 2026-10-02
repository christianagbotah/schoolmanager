-- Add discount_category column to distinguish between invoice and daily fee discounts
-- This ensures proper separation of concerns:
-- 'invoice' - for billed items like school fees, admission fees, etc.
-- 'daily_fees' - for daily collections like feeding, classes, water, breakfast, etc.

ALTER TABLE invoice_discounts 
ADD COLUMN discount_category ENUM('invoice', 'daily_fees') NOT NULL DEFAULT 'invoice' 
AFTER discount_type;

-- Add index for better query performance
CREATE INDEX idx_discount_category ON invoice_discounts(discount_category, status);
