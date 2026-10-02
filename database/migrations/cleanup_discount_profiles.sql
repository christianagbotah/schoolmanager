-- Clean up old discount profile data
-- This fixes profiles created before the bill_item_ids column was added

-- Option 1: Delete all existing profiles (if they're just test data)
-- TRUNCATE TABLE discount_profiles;

-- Option 2: Fix existing invoice profiles by clearing invalid data
UPDATE discount_profiles 
SET bill_item_ids = NULL, discount_type = NULL 
WHERE discount_category = 'invoice' 
AND bill_item_ids IS NOT NULL 
AND bill_item_ids NOT REGEXP '^[0-9,*]+$';  -- Not numeric IDs or *

-- Option 3: Fix existing daily_fees profiles
UPDATE discount_profiles 
SET discount_type = NULL, bill_item_ids = NULL 
WHERE discount_category = 'daily_fees' 
AND discount_type IS NOT NULL 
AND bill_item_ids IS NOT NULL;  -- Clear bill_item_ids if set

-- Verify the cleanup
SELECT profile_id, profile_name, discount_category, discount_type, bill_item_ids 
FROM discount_profiles;
