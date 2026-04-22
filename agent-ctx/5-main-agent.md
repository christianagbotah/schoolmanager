---
Task ID: 5
Agent: Main Agent
Task: Build Detailed Reports and Auto Billing System modules

Work Log:
- Analyzed existing project structure, schema (models), and coding patterns
- Identified all relevant database models: exam, exam_marks, mark, grade, student, school_class, section, subject, enroll, invoice, payment, receipts, expense, bill_category, daily_fee_transactions, attendance, terminal_reports, fee_structures, transport_auto_billing, penalty
- Created 4 report API routes and 4 report pages + 1 auto-billing API route and 1 auto-billing page (10 files total)

Files Created:
- `/src/app/api/admin/reports/weekly/route.ts` - GET weekly academic summary (attendance, fees, discipline, performers)
- `/src/app/api/admin/reports/annual/route.ts` - GET annual report (enrollment, financials, academic performance)
- `/src/app/api/admin/reports/cumulative/route.ts` - GET cumulative student performance across terms
- `/src/app/api/admin/reports/termly/route.ts` - GET termly report (subject averages, rankings, pass rates)
- `/src/app/admin/reports/weekly/page.tsx` - Weekly Report page with date range picker, class filter, summary cards, attendance bar chart, top/bottom performers table, print support
- `/src/app/admin/reports/annual/page.tsx` - Annual Report page with year selector, school overview cards, enrollment trend chart, income vs expenses chart, class performance table, grade distribution
- `/src/app/admin/reports/cumulative/page.tsx` - Cumulative Report page with student/class selector, subject-wise cumulative scores table with trend arrows, grade distribution chart, term progression charts
- `/src/app/admin/reports/termly/page.tsx` - Termly Report page with term/class/year selectors, class average by subject bars, student ranking table, pass rate per subject
- `/src/app/api/admin/auto-billing/route.ts` - GET/POST/PUT auto-billing (list configs, generate invoices, update settings)
- `/src/app/admin/auto-billing/page.tsx` - Auto Billing Dashboard with summary cards, configuration form, preview dialog, confirmation dialog, settings editor, recent billing runs table

Key Features:
- All API routes use `import { db } from '@/lib/db'`
- All pages use `'use client'` directive
- shadcn/ui components (Card, Table, Select, Button, Badge, Dialog, AlertDialog, Skeleton)
- CSS-based charts only (no recharts) - bar charts, horizontal progress bars, stacked bars
- Responsive design with mobile-first approach
- Print support with @media print CSS on all report pages
- Loading/error states with skeletons and toast notifications
- Auto-billing has preview-before-generate workflow with confirmation dialog
- No schema modifications made - all models already existed

Build verified: All 10 new files pass ESLint with zero errors. Dev server running cleanly.
