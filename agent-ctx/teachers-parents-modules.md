# Teachers & Parents Modules Enhancement — CI3 Parity

## Task Summary
Enhanced the Teachers and Parents modules to achieve full CI3 parity by augmenting existing API routes with missing functionality and fixing data flow issues.

## Work Done

### 1. Teachers API Enhancement
**Files Modified:**
- `src/app/api/admin/teachers/route.ts` — Enhanced GET to support `department` and `designation` filters; Added `social_links` JSON serialization to POST create handler
- `src/app/api/admin/teachers/[id]/route.ts` — Added `social_links` and `blood_group` fields to PUT update handler

**Specific Changes:**
- GET endpoint now reads `department` and `designation` query params and applies `department_id`/`designation_id` filters to the Prisma where clause
- POST/PUT now serialize social links (facebook, twitter, linkedin) as JSON array of objects matching CI3's `[{facebook, twitter, linkedin}]` format
- PUT now updates `blood_group` field from request body

### 2. Parents API Enhancement
**Files Modified:**
- `src/app/api/admin/parents/route.ts` — Enhanced GET to support `classId` filter for class-based parent filtering; Added `father_name`, `father_phone`, `mother_name`, `mother_phone` fields to POST create handler
- `src/app/api/admin/parents/[id]/route.ts` — Added `father_name`, `father_phone`, `mother_name`, `mother_phone` fields to PUT update handler

**Specific Changes:**
- GET endpoint now reads `classId` query param, looks up enrollments for that class, and filters parents by linked parent IDs
- POST/PUT now persist father and mother contact information from the Prisma schema

### 3. Classes API Fix
**File Modified:**
- `src/app/api/classes/route.ts` — Added `limit` query param support and conditional `{ classes: [...] }` response format

**Specific Changes:**
- When `limit` param is provided, the response wraps results in `{ classes: [...] }` to match the parents page's expected format (`d.classes || []`)
- Limit param constrains the `take` clause in the Prisma query

### 4. Existing Pages (No Changes Needed)
The existing frontend pages were already comprehensive:
- **Teachers page** (`src/app/admin/teachers/page.tsx`) — Full table with search/filter, stat cards, add/edit dialog with Personal/Professional/Account/Social sections, view modal, block/unblock, CSV export, mobile card view
- **Parents page** (`src/app/admin/parents/page.tsx`) — Full table with search/class filter, stat cards, add/edit dialog, view modal, block/unblock, mobile card view

### Lint Status
- All modified API files pass lint with zero errors/warnings
- Pre-existing lint errors in other files are unrelated to these changes
