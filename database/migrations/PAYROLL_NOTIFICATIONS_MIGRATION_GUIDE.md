# Payroll Notifications Migration Guide

## Migration File to Use

**CORRECT FILE**: `database/migrations/payroll_notifications_addon.sql`

**DO NOT USE**:
- ❌ `payroll_notifications_schema.sql` - Tries to recreate existing notifications table
- ❌ `payroll_notifications_schema_FIXED.sql` - Drops existing table

## What This Migration Does

This migration creates **ONLY 2 NEW TABLES**:

1. **`user_notification_preferences`** - Stores SMS opt-in/opt-out settings per user
2. **`notification_delivery_log`** - Audit log for all notification delivery attempts

It **DOES NOT** modify the existing `notifications` table (which is already in production).

## Fixed Foreign Key Compatibility Issues

### Issue #1: user_notification_preferences.user_id
**Error**: `#3780 - Referencing column 'user_id' and referenced column 'admin_id' are incompatible`

**Root Cause**: Original migration used `INT UNSIGNED` but `admin.admin_id` is `INT` (signed)

**Fix**: Changed `user_id INT NOT NULL` to match `admin.admin_id` data type exactly

### Issue #2: notification_delivery_log.notification_id
**Error**: `#3780 - Referencing column 'notification_id' and referenced column 'notification_id' are incompatible`

**Root Cause**: Original migration used `BIGINT UNSIGNED` but existing `notifications.notification_id` has different type

**Fix**: Changed to `INT NOT NULL` (most common type in this codebase)

## Deployment Steps

### Step 1: Run the Migration
1. Open phpMyAdmin
2. Select your database
3. Click "SQL" tab
4. Copy and paste the ENTIRE contents of `payroll_notifications_addon.sql`
5. Click "Go" to execute

### Step 2: Verify Success
After running the migration, you should see:
- ✅ Query returned 4 result sets
- ✅ Last result: "Payroll Notification Addon Migration Completed Successfully"
- ✅ 2 new tables created: `user_notification_preferences`, `notification_delivery_log`
- ✅ 2 foreign keys created

### Step 3: If Error #3780 STILL Occurs on notification_id

This means the existing `notifications.notification_id` is NOT `INT`. Follow these steps:

1. **Check the actual data type**:
   ```sql
   DESCRIBE notifications;
   ```
   Look at the `notification_id` row and note the exact `Type` (e.g., `BIGINT`, `INT UNSIGNED`, etc.)

2. **Update the migration file**:
   - Open `payroll_notifications_addon.sql`
   - Find line 48: `notification_id INT NOT NULL`
   - Change `INT` to match the EXACT type from step 1
   - Examples:
     - If notifications uses `BIGINT` → change to `notification_id BIGINT NOT NULL`
     - If notifications uses `INT UNSIGNED` → change to `notification_id INT UNSIGNED NOT NULL`
     - If notifications uses `BIGINT UNSIGNED` → change to `notification_id BIGINT UNSIGNED NOT NULL`

3. **Drop the failed table and re-run**:
   ```sql
   DROP TABLE IF EXISTS notification_delivery_log;
   ```
   Then re-run the entire migration file.

## Alternative: Skip Foreign Key for notification_delivery_log

If you want to proceed without the foreign key constraint (not recommended but functional):

```sql
-- Modified notification_delivery_log without foreign key
CREATE TABLE IF NOT EXISTS `notification_delivery_log` (
    `log_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `notification_id` INT NOT NULL COMMENT 'Related notification ID (references notifications.notification_id)',
    `channel` VARCHAR(20) NOT NULL,
    `recipient` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `error_message` TEXT DEFAULT NULL,
    PRIMARY KEY (`log_id`),
    INDEX `idx_notification_id` (`notification_id`),
    INDEX `idx_channel` (`channel`),
    INDEX `idx_status` (`status`),
    INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Impact**: The system will still work, but orphaned records in `notification_delivery_log` won't be automatically deleted when a notification is deleted.

## Migration File Order (Complete System)

For a fresh installation, run migrations in this order:

1. `add_employment_category_to_staff.sql` - Adds employment_category field
2. `payroll_system_enhancements.sql` - Creates payroll_approvals, audit_logs, tax_brackets
3. `payroll_notifications_addon.sql` - **THIS FILE** - Creates notification preferences and delivery log

## Troubleshooting

### Error: "Table 'user_notification_preferences' already exists"
**Solution**: The migration was already run. Skip step 1 or drop the tables first:
```sql
DROP TABLE IF EXISTS notification_delivery_log;
DROP TABLE IF EXISTS user_notification_preferences;
```

### Error: "Cannot add foreign key constraint"
**Possible Causes**:
1. Data type mismatch (see Step 3 above)
2. Referenced table/column doesn't exist
3. Existing data violates constraint (orphaned records)

**Diagnosis**:
```sql
-- Check if notifications table exists
SHOW TABLES LIKE 'notifications';

-- Check notifications structure
DESCRIBE notifications;

-- Check admin structure  
DESCRIBE admin;

-- Look for orphaned test data
SELECT COUNT(*) FROM user_notification_preferences WHERE user_id NOT IN (SELECT admin_id FROM admin);
```

### Error: "Key column doesn't exist in table"
**Solution**: Check spelling and exact column names:
```sql
SHOW COLUMNS FROM notifications;
SHOW COLUMNS FROM admin;
```

## Success Indicators

After successful migration:
- ✅ 2 new tables exist
- ✅ Can insert test preference: `INSERT INTO user_notification_preferences (user_id, sms_enabled) VALUES (1, 0);`
- ✅ Can insert test log: `INSERT INTO notification_delivery_log (notification_id, channel, recipient, status) VALUES (1, 'sms', '+233123456789', 'sent');`
- ✅ Foreign keys enforce referential integrity

## Next Steps

After successful migration:
1. Proceed to **Task 2** (Checkpoint - Verify database migrations)
2. Continue with backend testing tasks
3. Run integration tests

## Need Help?

If you encounter errors:
1. Copy the EXACT error message (including error number)
2. Run `DESCRIBE notifications;` and provide the output
3. Run `DESCRIBE admin;` and provide the output
4. Share which SQL statement failed
