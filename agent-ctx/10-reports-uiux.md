---
Task ID: 10
Agent: Reports UI/UX Builder
Task: Rebuild Reports pages with improved UI/UX

Work Log:
- Read worklog.md to understand project patterns and previous UI rebuilds (students, teachers, classes, notices, payments pages)
- Read all 4 current report pages: annual (304 lines), weekly (322 lines), termly (346 lines), finance (727 lines)
- Studied reference pages: library page, students page for consistent UI patterns
- All 4 pages already used DashboardLayout - verified and kept

**Annual Report Page** (annual/page.tsx):
- Added enhanced header with FileBarChart icon, title, description
- Added Export CSV button alongside Print button (44px touch targets)
- Added CSV export function with full report data (summary, enrollment, financial, academic)
- Added hover shadow effects on stat cards
- Added hover effects on enrollment/financial chart bars (opacity transition, tooltip)
- Added proper empty states with centered icon + message for enrollment, financial, academic sections
- Added loading skeletons for secondary stat cards row
- Added responsive mobile card view for Class Performance table (cards with icon, name, student count, score badge, chevron)
- Added footer count "X classes" in class performance section
- Added flex-shrink-0 to prevent icon squishing on small screens

**Weekly Report Page** (weekly/page.tsx):
- Added enhanced header with CalendarDays icon, title, description
- Added Export CSV button with comprehensive report data export
- Replaced bare date inputs with proper Week selector dropdown (auto-generates 12 weeks back)
- Added "Custom Range..." option that reveals date pickers
- Added "Filters" label with icon above filter controls
- Added min-h-[44px] to all select triggers and date inputs for 44px touch targets
- Added proper empty states for attendance chart, performers, financial sections
- Added responsive mobile card view for Top Performers (ranked circles with gold/silver/bronze)
- Added responsive mobile card view for Bottom Performers (red-themed)
- Replaced flat financial summary with rounded-xl bordered cards (sky/emerald/amber)
- Added min-h-[52px] for mobile performer cards

**Termly Report Page** (termly/page.tsx):
- Added enhanced header with FileBarChart icon, title, description
- Added Export CSV button with full ranking table + subject averages + pass rates
- Disabled Export/Print buttons when no class selected
- Added proper empty state with rounded-2xl icon container + descriptive text
- Added Top 3 Students highlight cards (gold/silver/bronze with Award/Medal/Trophy icons)
- First place card gets special gradient from-amber-50-to-white border-amber-200 styling
- Added responsive mobile card view for Student Rankings:
  - Shows rank circle, name, code, average badge, chevron
  - Shows subject scores as compact tag chips (max 6, then "+N more")
- Added min-h-[60px] for mobile ranking cards
- Added footer with student count + class average + pass rate
- Added proper empty states for subject averages and pass rate sections
- Added flex-shrink-0 to prevent label squishing in progress bars

**Finance Report Page** (finance/page.tsx):
- Added enhanced header with FileBarChart icon, title, description
- Added Print button with print-friendly summary (hidden div for print only)
- Added proper filter labels ("Year", "Term") with min-h-[44px] touch targets
- Redesigned stat cards with border-l-4 colored left borders (matching annual/weekly pattern)
- Added hover shadow effects on stat cards
- Updated TabsList to match library page style (rounded-xl, emerald-600 active state)
- Added proper empty states for all charts (centered icon + message)
- Added responsive mobile card view for Aging Report:
  - AlertCircle icon in red-50 background
  - Student name, code, days, amount, aging badge
  - min-h-[60px] for touch targets
- Added responsive mobile card view for Outstanding by Class:
  - DollarSign icon in red-50 background
  - Class name, amount, chevron
  - min-h-[52px] for touch targets
- Added footer count in outstanding section
- Added min-h-[44px] for invoice status cards and daily fee items
- Removed unused Separator import
- Added print-only summary section with financial data grid and aging data grid

**All pages**: Zero lint errors in modified files (verified via `bun run lint`)
**All data fetching logic preserved**: All API endpoints, parameters, state management, and data transformations kept identical

Stage Summary:
- 4 report pages rebuilt with consistent modern UI/UX
- Responsive desktop table / mobile card views on all tabular data
- Enhanced headers with icons, descriptions, and action buttons (Export CSV + Print)
- Proper empty states with centered icons and helpful messages on all sections
- Loading skeletons for all data sections
- 44px+ touch targets on all interactive elements (buttons, selects, date inputs, cards)
- Hover effects (shadow, opacity) on cards and chart bars
- Top 3 student highlight cards (termly report)
- Week selector with custom range option (weekly report)
- Print-friendly layouts with dedicated print header blocks
- All existing data fetching/display logic preserved
- Zero lint errors
