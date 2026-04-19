# Task: Rebuild Subjects and Attendance pages with CI3 parity

## Summary of Changes

### PART 1: Subjects Module

#### Files Modified:

**1. `src/app/admin/subjects/page.tsx`** — Complete rewrite to match CI3 `subject.php`
- **Added tabs UI**: "Subject List" and "Add Subject" tabs matching CI3's two-tab layout
- **Subject List tab**: 
  - Class filter dropdown at top (matching CI3 class selector)
  - Table columns simplified to match CI3: Class, Subject Name, Teacher, Options
  - Shows "Core" badge for core subjects (status=1)
  - Mobile card view with edit/delete actions
  - Import section at bottom: "Import All Subjects" (mass) and "Copy Subjects to Another Class"
- **Add Subject tab**:
  - Class selector required before adding subjects
  - Bulk Excel import section (template download, file choose, upload) matching CI3
  - Multi-row subject form matching CI3's `subjects_table`: name + teacher dropdown per row
  - Add Row / Remove Row functionality
  - Save All Subjects button for bulk create
- **Edit Dialog**: Name, Teacher dropdown, "Core subject" checkbox (matching CI3 `modal_edit_subject.php`)
- **Removed**: Stat cards (not in CI3), search bar (CI3 uses class filter only)
- **Kept**: Delete confirmation dialog

**2. `src/app/api/admin/subjects/import/route.ts`** — Enhanced to support mass import
- Added `action=mass` mode: imports all subjects from previous academic year for all classes (matching CI3 `do_subjects_import_mass`)
- Added `action=copy` mode: existing class-to-class copy (CI3 `do_subjects_import`)
- Added `getPreviousYear()` helper for year format parsing

**3. `src/app/api/admin/subjects/[id]/route.ts`** — Fixed PUT handler
- Made `class_id` optional in edit (matching CI3 where class_id is hidden in edit form)
- Graceful handling when only `name`, `teacher_id`, `status` are sent

### PART 2: Attendance Module

#### Files Modified:

**4. `src/app/admin/attendance/page.tsx`** — Enhanced to match CI3 attendance views
- **Added student search filter**: Search by name or code (matching CI3 `initSearchFilter()`)
- **Added "Mark All Absent" button**: alongside "Select All Present" (matching CI3's "Mark All Absent" button)
- **Renamed "Mark All Present"** to "Select All Present" to match CI3 wording
- **Student table** now uses `filteredStudents` instead of raw `students` for search filtering
- **Added `X` icon import** from lucide-react for the absent button
- **Mobile view** also respects the search filter

#### Files Not Modified (already at CI3 parity):

**5. `src/app/admin/attendance/report/page.tsx`** — Already matches CI3 `attendance/report.php`:
- Report type filter (Analytics Summary / Monthly Grid)
- Class, Section, Status filters
- Date range and Monthly fields
- Stats grid (Total Days, Present, Absent, Average)
- Trend chart (weekly bars) and Status Breakdown
- Student details table with badges
- Export CSV and Print functionality

**6. `src/app/(dashboard)/attendance/page.tsx`** — Already matches CI3 `students_daily_attendance.php`:
- Role-based views (Admin/Teacher vs Student/Parent)
- Class/Section/Date selector
- Per-student attendance marking (Present/Absent/Late buttons)
- Student/Parent calendar view
- Already has "All Present" and "All Absent" buttons

### CI3 Features Not Ported (by design):
- **Fee collection** in `manage_attendance_view.php`: Complex school-specific daily fee tracking (feeding, breakfast, classes, water, transport) with discount profiles — this is business logic specific to the CI3 deployment, not attendance functionality
- **Excel bulk import**: Template generation and file parsing — placeholders added, full implementation requires server-side Excel processing
- **Select2/jQuery dependencies**: Replaced with native shadcn/ui Select components
