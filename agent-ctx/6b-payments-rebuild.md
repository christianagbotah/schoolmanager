# Task 6b: Rebuild Payments Page with Improved UI/UX

## Context
- Read worklog.md to understand project history and patterns
- Read current payments page (681 lines) at /src/app/admin/payments/page.tsx
- Read students page at /src/app/admin/students/page.tsx for design reference
- Analyzed API routes: /api/admin/payments (GET with action=stats, POST), /api/admin/payments/[id] (GET, DELETE)

## Changes Made
- Completely rewrote /src/app/admin/payments/page.tsx (~560 lines)
- Page loads HTTP 200, no lint errors, no compilation errors

### 1. Enhanced Stat Cards (4 cards)
- Total Payments (GHS) — emerald icon, transaction count subtitle
- Today's Collections — sky icon, current date subtitle
- This Month — violet icon, month/year subtitle
- Payment Methods Breakdown — amber icon, shows Cash/MoMo/Cheque totals with colored dots
- All cards have loading skeletons

### 2. Clean Filter Bar
- Search input (student name, code, receipt) with 44px height
- Date range (start + end date inputs)
- Method filter dropdown
- Status filter dropdown
- Active filter badges with X dismiss buttons

### 3. Responsive Table / Cards
- Desktop: 8-column table (Student, Invoice, Receipt #, Amount, Method, Date, Status, Actions)
- Mobile: Card view with student info, amount, method badge, status badge, invoice/receipt/date details, View Receipt + Delete buttons

### 4. Payment Method Badges
- Cash=emerald (Banknote icon)
- Mobile Money=violet (Smartphone icon)
- Bank Transfer=sky (Building2 icon)
- Cheque=amber (FileText icon)
- Card=rose (CreditCard icon)

### 5. Record Payment Dialog
- Student search with avatar results list (44px touch targets)
- Selected student chip with Change button
- Invoice linking (optional, shows outstanding balance)
- Amount input with GHS prefix
- Method + Date grid
- Reference/Transaction ID field
- Loading spinner on submit

### 6. View Receipt Dialog
- Receipt-style layout with centered amount and status
- Details grid: Receipt #, Student, Student Code, Method, Invoice, Date, Term
- Print button and Close button
- Separators for visual grouping

### 7. Delete Confirmation
- AlertDialog with payment amount and student name highlighted
- Warning text about invoice update and receipt removal
- Loading spinner on delete

### 8. Loading & Empty States
- Skeleton stat cards during stats load
- Skeleton table rows during payments load
- Skeleton mobile cards during mobile load
- Empty state with icon, contextual message, and CTA button
- Filtered vs unfiltered different messaging

### 9. Other Improvements
- Currency changed from UGX to GHS
- All mobile buttons use min-h-[44px] for touch targets
- All filter inputs use min-h-[44px]
- Debounced search (400ms)
- Pagination shows "Showing X–Y of Z" format
- Hover shadow on stat cards
