-- Fix existing discount profiles to use bill item IDs instead of slugified names
-- This updates profiles that were created with old system

-- Update profiles with specific bill items
UPDATE discount_profiles 
SET bill_item_ids = '1' 
WHERE discount_category = 'invoice' 
AND (bill_item_ids = 'school_fees' OR discount_type = 'school_fees');

UPDATE discount_profiles 
SET bill_item_ids = '8' 
WHERE discount_category = 'invoice' 
AND (bill_item_ids = 'boarding_admission_fee' OR discount_type = 'boarding_admission_fee');

UPDATE discount_profiles 
SET bill_item_ids = '9' 
WHERE discount_category = 'invoice' 
AND (bill_item_ids = 'day_student_admission_fee' OR discount_type = 'day_student_admission_fee');

UPDATE discount_profiles 
SET bill_item_ids = '12' 
WHERE discount_category = 'invoice' 
AND (bill_item_ids = 'arrears' OR discount_type = 'arrears');

UPDATE discount_profiles 
SET bill_item_ids = '14' 
WHERE discount_category = 'invoice' 
AND (bill_item_ids = 'uniform' OR discount_type = 'uniform');

-- Clear discount_type for invoice category (should only use bill_item_ids)
UPDATE discount_profiles 
SET discount_type = NULL 
WHERE discount_category = 'invoice';

-- Clear bill_item_ids for daily_fees category (should only use discount_type)
UPDATE discount_profiles 
SET bill_item_ids = NULL 
WHERE discount_category = 'daily_fees';
