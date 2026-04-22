# Task 13a: Rebuild Messages, SMS, and Dormitory Pages

## Work Log
- Read worklog.md and analyzed existing pages
- Studied library page as design reference pattern
- Read all 3 existing pages: messages, sms, dormitory
- Key issues found:
  - Messages/SMS use `useToast` instead of `toast` from sonner
  - Dormitory does NOT use DashboardLayout (has custom header/footer)
  - All 3 need stat card pattern matching library page
  - All 3 need tab styling update to match library
  - Dormitory uses sky/blue gradient (needs removal)

## Design Pattern (from library page)
- DashboardLayout wrapper
- Header: h1 + subtitle + action button (no gradient icon)
- Stat cards: 2x4 grid, icon with colored bg, xl font-bold, 10px sub-value
- Tabs: bg-white border border-slate-200 p-1 rounded-xl
- Search: pl-10 min-h-[44px] bg-slate-50
- Empty state: Card py-16 with icon in rounded-2xl container
- toast from 'sonner'
