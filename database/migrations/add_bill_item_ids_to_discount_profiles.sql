-- Add bill_item_ids column for storing invoice item IDs
-- discount_type will be used for daily_fees (feeding, classes, water, etc.)
-- bill_item_ids will be used for invoice (1,3,5,12 from bill_item table)
-- Special value: '*' means ALL invoice items (dynamic)

ALTER TABLE discount_profiles 
ADD COLUMN bill_item_ids VARCHAR(255) NULL AFTER discount_type,
ADD INDEX idx_bill_item_ids (bill_item_ids);

-- Update existing records to use appropriate column based on category
UPDATE discount_profiles 
SET bill_item_ids = discount_type, discount_type = NULL 
WHERE discount_category = 'invoice';
