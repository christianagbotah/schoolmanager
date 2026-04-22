# Task: Rebuild Expenses, Messages, Notices with CI3 Parity

## CI3 Source Files Analyzed

### Expenses
- `ci3-source/.../expense.php` — Main expense list with DataTable, filters, stats
- `ci3-source/.../expense_add.php` — Bulk add form with per-row fields
- `ci3-source/.../expense_category.php` — Category grid with stats, search, CRUD

### Messages
- `ci3-source/.../message.php` — Main wrapper with SMS + In-App tabs
- `ci3-source/.../message_home.php` — Empty state (select conversation)
- `ci3-source/.../message_new.php` — Compose form (recipient optgroups, message, file)
- `ci3-source/.../message_read.php` — Thread view with reply + file attachment
- `ci3-source/.../group_message.php` — Group sidebar with CRUD

### Notices
- `ci3-source/.../noticeboard.php` — Running/Archived tabs + Create form
- `ci3-source/.../noticeboard_edit.php` — Edit form
- `ci3-source/.../modal_edit_notice.php` — Modal edit form
- `ci3-source/.../running_noticeboard.php` — Running table (title, date, actions)
- `ci3-source/.../archived_noticeboard.php` — Archived table (title, date, actions)

## Next.js Files Changed

### 1. `src/app/admin/expenses/page.tsx`
**Changes:**
- Reordered desktop table columns to match CI3 order: **Date → Title → Category → Method → Amount → Status → Actions** (was: Title → Category → Amount → Date → Method → Status)
- Made Date column first with `whitespace-nowrap` for better scanning
- Changed Amount cell from `font-medium` to `font-semibold` for CI3-style emphasis
- No other changes needed — page already had all CI3 features (filter by date range, category filter, status filter, search, add/edit/delete dialogs, category breakdown summary, pagination, mobile view)

### 2. `src/app/admin/expenses/categories/page.tsx`
**Changes:**
- Added **4 stat cards** matching CI3 (Total Categories, Active, Total Expenses, Most Used) — previously had 3 (Total Categories, Total Expenses, Total Spent)
- Added **Active Categories** stat (categories with expenseCount > 0)
- Added **Most Used** stat showing the category name with most expenses
- Added **back arrow button** linking to `/admin/expenses` for navigation
- Updated subtitle to match CI3 phrasing ("Organize and manage your expenditure categories")
- Added `min-h-[44px]` to New Category button for touch targets
- Changed stat card style from `border-l-4` to consistent icon+label style matching other pages
- Removed unused imports (`DollarSign`), added new icons (`ArrowLeft`, `Receipt`, `CheckCircle`)

### 3. `src/app/admin/messages/page.tsx`
**No changes needed.** Already has full CI3 parity:
- SMS tab with Individual/Bulk/Custom number types ✅
- Phone simulator preview ✅
- Bill Reminder button ✅
- In-App tab with thread list sidebar, search, message bubbles ✅
- Compose dialog with recipient optgroups (student/teacher/parent) ✅
- Reply with file attachment ✅
- Group messaging tab with sidebar, create, detail view ✅
- Delete confirmation dialogs ✅
- Character/SMS count for SMS ✅

### 4. `src/app/admin/notices/page.tsx`
**No changes needed.** Already has full CI3 parity plus enhancements:
- Running/Archived/All tabs ✅ (CI3 has Running/Archived only — extra tab is enhancement)
- Add/Edit dialog with all CI3 fields (title, notice, event date, image) ✅
- SMS toggle with target selection ✅
- Email toggle ✅
- Show on Website toggle ✅
- Visibility roles selection ✅
- Start date / End date ✅
- Archive/Restore actions ✅
- View detail dialog ✅
- Date range filter ✅
- Search ✅
- Stat cards ✅
- Delete confirmation ✅

## API Routes Verified (no changes needed)
- `/api/expenses` — GET (list with filters/search/pagination) + POST (create)
- `/api/expense-categories` — GET (list with counts) + POST (create)
- `/api/admin/expenses/categories` — GET/POST/PUT/DELETE (full CRUD)
- `/api/admin/messages` — GET (threads, messages, recipients, groups) + POST (send/reply/create group) + DELETE
- `/api/admin/notices` — GET (list with filters) + POST (create) + PUT (update) + DELETE (archive/restore/hard delete)

## Summary
The existing Next.js pages already had excellent CI3 parity. The main gaps were:
1. **Expenses table column order** didn't match CI3 (Date should be first) — **Fixed**
2. **Categories stats** were only 3 instead of CI3's 4 — **Fixed**
3. **Categories page** lacked navigation back to expenses — **Fixed**
4. **Messages and Notices** pages already had full CI3 parity with no changes needed
