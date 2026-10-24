# Legacy Evidence Pack — SchoolManager for iEduPro Reconciliation

This directory is the legacy-side evidence pack for the iEduPro full-platform reconciliation
(`zai/full-platform-reconciliation-20261024`).

## Contents

| File | Domain |
|------|--------|
| `PARITY_MATRIX.md` | Master control matrix: verified legacy behavior (VLB), target architecture requirements (TAR), recommendations (REC), intentionally retired legacy debt (IRLD), data migration map, test evidence inventory |
| `01-auth-rbac-profiles.md` | Authentication, roles, permissions, profiles, session security |
| `02-admission-students-parents.md` | Admissions, student lifecycle, parent/guardian linking, enrollment, promotion |
| `03-attendance-transport.md` | Attendance statuses, attendance→fee automation, bus IN/OUT, transport billing |
| `04-exams-grading-reports.md` | Exam setup, marks, result processing, KG/Nursery + JHS/WAEC grading, remarks, online exams, lesson notes, verification |
| `05-finance-invoices-accounting.md` | Invoices, discounts, accounting generations, expenses/budgets/bank-rec, payment gateways, public invoices, currency |
| `06-payroll-ops-comms-settings.md` | Payroll + Hubtel payout, library, inventory, dining, boarding, insurance, SMS/comms, settings, crons |

## Method

Every claim is cited `file:line`. Where behavior is locked by an automated test, the test file is named.
The Ghana-specific daily-fee semantics (wallet algebra, smart allocation, weekly water, per-leg
transport, collection boundaries, retroactive opt-ins) are additionally pinned by
`tests/daily-fee-wallet-semantics.test.js` with CI gate `.github/workflows/daily-fee-wallet-semantics.yml`.

## Status

Legacy side: complete for this engagement's audit scope (12 domains).
iEduPro side: pending repository access; `PARITY_MATRIX.md` status column will be moved to
`iedupro/docs/handover/PARITY_MATRIX.md` and maintained there as the live tracking surface.
