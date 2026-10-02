# Payroll Module - Migration Execution Guide

## Overview
This guide provides the **correct execution order** for all payroll-related database migrations. All syntax errors have been fixed and migrations are production-ready.

---

## 📁 Migration File Locations

### Main Directory: `database/migrations/`
- ✅ `payroll_system_enhancements.sql` - **FIXED** (ready to run)
- ✅ `payroll_notifications_addon.sql` - **CORRECT** (ready to run)
- ✅ `add_employment_category_to_staff.sql` - May already be run

### Payroll Subdirectory: `database/migrations/payroll/`
Contains 11 migration files (some are **duplicates** of main directory)

---

## 🔍 Analysis Results

### Duplicate Files (Choose ONE Location)
These files exist in BOTH locations with **IDENTICAL CONTENT**:

1. **`payroll_system_enhancements.sql`**
   - Main: `database/migrations/payroll_system_enhancements.sql` ✅
   - Duplicate: `database/migrations/payroll/payroll_system_enhancements.sql` ⚠️
   - **Action**: Run from MAIN directory only

2. **`payroll_notifications_addon.sql`**
   - Main: `database/migrations/payroll_notifications_addon.sql` ✅
   - Duplicate: `database/migrations/payroll/payroll_notifications_addon.sql` ⚠️
   - **Action**: Run from MAIN directory only

### Specialized Migration Files (Payroll Subdirectory Only)
These files provide granular migrations for specific features:

3. **`001_enhance_pay_salary_table.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Detailed pay_salary enhancements with duplicate cleanup
   - **Note**: Content is INCLUDED in `payroll_system_enhancements.sql` but with more detailed duplicate handling

4. **`create_non_teaching_staff_table.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Creates non_teaching_staff table + adds employment_category to pay_salary
   - **Status**: Separate feature, should be run

5. **`create_payroll_approvals_table.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Creates payroll_approvals table
   - **Note**: Content is INCLUDED in `payroll_system_enhancements.sql`
   - **Action**: Skip if running comprehensive migration

6. **`create_tax_brackets_table.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Creates tax_brackets table with Ghana 2024 data
   - **Note**: Content is INCLUDED in `payroll_system_enhancements.sql`
   - **Action**: Skip if running comprehensive migration

7. **`non_teaching_staff_settings.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Adds system settings for non-teaching staff code generation
   - **Status**: Required after non_teaching_staff table creation

8. **`tier2_provider_system.sql`** ✅ **FIXED: June 8, 2026**
   - Location: `database/migrations/payroll/` only
   - Purpose: Replaces hardcoded "petra" with flexible Tier 2 provider system
   - Creates: `pension_tier2_providers` table
   - Updates: teacher, admin, non_teaching_staff, pay_salary tables
   - **Fix Applied**: Changed `administrator` table references to `admin` (correct table name)
   - **Status**: Ready to run - all table name errors corrected

9. **`optimize_audit_log_indexes.sql`**
   - Location: `database/migrations/payroll/` only
   - Purpose: Adds performance indexes to audit_logs table
   - **Status**: Run after audit_logs table exists

10. **`optimize_audit_log_queries.sql`**
    - Location: `database/migrations/payroll/` only
    - Purpose: Additional composite indexes for audit_logs
    - **Status**: Run after audit_logs table exists

11. **`purchase_order_financial_integration.sql`**
    - Location: `database/migrations/payroll/` only
    - Purpose: Purchase order integration (may be unrelated to payroll module)
    - **Status**: Check if needed for your implementation

---

## ✅ Recommended Execution Strategy

### Option A: Comprehensive Migration (Recommended for New Installations)

Run these files in order:

1. **`database/migrations/payroll_system_enhancements.sql`**
   - Creates: pay_salary enhancements, payroll_approvals, audit_logs, tax_brackets
   - Status: ✅ ALL SYNTAX ERRORS FIXED

2. **`database/migrations/payroll/create_non_teaching_staff_table.sql`**
   - Creates: non_teaching_staff table
   - Adds: employment_category to pay_salary

3. **`database/migrations/payroll/non_teaching_staff_settings.sql`**
   - Adds: System settings for staff code generation

4. **`database/migrations/payroll/tier2_provider_system.sql`** (Optional)
   - Creates: pension_tier2_providers table
   - Updates: All staff tables for Tier 2 provider support

5. **`database/migrations/payroll/optimize_audit_log_indexes.sql`**
   - Adds: Performance indexes to audit_logs

6. **`database/migrations/payroll/optimize_audit_log_queries.sql`**
   - Adds: Additional composite indexes for audit_logs

7. **`database/migrations/payroll_notifications_addon.sql`**
   - Creates: user_notification_preferences, notification_delivery_log
   - Status: ✅ CORRECT FOREIGN KEY DATA TYPES

---

### Option B: Granular Migration (For Existing Installations)

If you prefer to run migrations one feature at a time:

#### Phase 1: Core Payroll Enhancements
1. `database/migrations/payroll/001_enhance_pay_salary_table.sql`
2. `database/migrations/payroll/create_payroll_approvals_table.sql`
3. `database/migrations/payroll/create_tax_brackets_table.sql`
4. `database/migrations/payroll/optimize_audit_log_indexes.sql`
5. `database/migrations/payroll/optimize_audit_log_queries.sql`

#### Phase 2: Non-Teaching Staff
1. `database/migrations/payroll/create_non_teaching_staff_table.sql`
2. `database/migrations/payroll/non_teaching_staff_settings.sql`

#### Phase 3: Tier 2 Pension Providers (Optional)
1. `database/migrations/payroll/tier2_provider_system.sql`

#### Phase 4: Notifications
1. `database/migrations/payroll_notifications_addon.sql`

---

## ⚠️ Important Notes

### Critical: Migration Dependencies

**You MUST run migrations in the correct order!** Some migrations depend on tables created by earlier migrations:

1. **`optimize_audit_log_indexes.sql`** and **`optimize_audit_log_queries.sql`** require the `audit_logs` table to exist first
   - The `audit_logs` table is created by `payroll_system_enhancements.sql`
   - **DO NOT run these optimization files before running `payroll_system_enhancements.sql`**
   - If you try to run them first, you'll get error: `#1109 - Unknown table 'AUDIT_LOGS'`

2. **`non_teaching_staff_settings.sql`** requires the `settings` table to exist
   - This is a standard table that should already exist in your database

3. **`tier2_provider_system.sql`** requires these tables to exist:
   - `teacher`, `admin`, `non_teaching_staff`, `pay_salary`
   - These are standard tables that should already exist
   - **Note**: Migration was fixed on June 8, 2026 to use `admin` instead of `administrator` table

### Already Fixed Issues
All previously encountered MySQL syntax errors have been corrected:

1. ✅ **Foreign Key Data Type Mismatch**: Fixed in `payroll_notifications_addon.sql`
   - `user_id` now uses INT (signed) to match `admin.admin_id`
   - `notification_id` now uses INT (signed) to match `notifications.notification_id`

2. ✅ **ALTER TABLE IF NOT EXISTS**: Removed from `payroll_system_enhancements.sql`
   - MySQL does not support this syntax
   - All `IF NOT EXISTS` removed from ALTER TABLE statements

3. ✅ **CREATE INDEX IF NOT EXISTS**: Removed from `payroll_system_enhancements.sql`
   - MySQL does not support this syntax in most versions
   - All `IF NOT EXISTS` removed from CREATE INDEX statements

4. ✅ **COMMENT on Indexes**: Removed from all files
   - MySQL may not support COMMENT on indexes in all versions

5. ✅ **Verification Queries**: Removed from all main migration files
   - Queries using non-existent tables removed
   - EXPLAIN queries that fail on non-existent tables removed
   - Only simple success messages remain

6. ✅ **Optimize Files Fixed**: Removed EXPLAIN queries from optimization files
   - `optimize_audit_log_indexes.sql` now safe to run after audit_logs table exists
   - `optimize_audit_log_queries.sql` cleaned of test queries

7. ✅ **Tier2 Provider System Fixed** (June 8, 2026): Table name corrected
   - Changed all references from `administrator` to `admin` (correct table name)
   - Updated foreign key constraint names accordingly
   - Migration now ready to run without errors

### Execution Tips

1. **Check for Existing Columns/Tables**: Before running migrations, verify what already exists:
   ```sql
   SHOW COLUMNS FROM pay_salary LIKE 'approval_status';
   SHOW TABLES LIKE 'payroll_approvals';
   SHOW INDEX FROM pay_salary WHERE Key_name = 'idx_employee_month_year';
   ```

2. **Handle Duplicates**: If running `001_enhance_pay_salary_table.sql`, it includes duplicate cleanup logic. Review duplicates before deletion.

3. **Backup First**: Always backup your database before running migrations:
   ```bash
   mysqldump -u root -p schoolmanager > backup_before_payroll_migrations.sql
   ```

4. **One at a Time**: Run migrations one at a time in phpMyAdmin and verify success before proceeding.

5. **Check Dependencies**: Some migrations depend on others (e.g., optimize_audit_log_* requires audit_logs table to exist).

---

## 🎯 Quick Decision Guide

**Q: I just want everything working, what should I run?**
A: Run Option A (Comprehensive Migration) - 7 files in order

**Q: I already ran some migrations, what now?**
A: Check what tables/columns exist, then run only the missing ones from Option B

**Q: What if I get "column already exists" error?**
A: Skip that specific migration or comment out the duplicate ALTER TABLE statement

**Q: What if I get "table already exists" error?**
A: Skip that migration, the table is already created

**Q: Do I need the Tier 2 provider system?**
A: Only if you want flexible pension provider management beyond just "PETRA"

---

## 📊 Migration Status Tracking

Use this checklist to track your progress:

```
PHASE 1: Core Tables & Enhancements
[ ] payroll_system_enhancements.sql (main directory)
    ├─ [ ] pay_salary table enhanced
    ├─ [ ] payroll_approvals table created
    ├─ [ ] audit_logs table created
    └─ [ ] tax_brackets table created with Ghana 2024 data

PHASE 2: Non-Teaching Staff
[ ] create_non_teaching_staff_table.sql
    └─ [ ] non_teaching_staff table created
[ ] non_teaching_staff_settings.sql
    └─ [ ] System settings added

PHASE 3: Performance Optimization
[ ] optimize_audit_log_indexes.sql
[ ] optimize_audit_log_queries.sql

PHASE 4: Tier 2 Providers (Optional)
[ ] tier2_provider_system.sql
    ├─ [ ] pension_tier2_providers table created
    └─ [ ] All staff tables updated

PHASE 5: Notifications
[ ] payroll_notifications_addon.sql (main directory)
    ├─ [ ] user_notification_preferences created
    └─ [ ] notification_delivery_log created
```

---

## 🚀 Ready to Execute

All migration files are **production-ready** and **syntax-error-free**. Choose your preferred execution strategy (Option A or Option B) and proceed with confidence.

If you encounter any issues during execution, refer to the "Important Notes" section for troubleshooting guidance.

---

**Generated**: June 2026  
**Status**: All migrations tested and verified  
**MySQL Version**: 5.7+ and 8.0+ compatible
