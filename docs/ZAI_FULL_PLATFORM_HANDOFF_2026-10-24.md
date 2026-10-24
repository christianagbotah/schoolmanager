# z.ai SchoolManager Source-Baseline Handoff

Date: 2026-10-24

## Purpose of this repository in the engagement

This repository, `christianagbotah/schoolmanager`, is the **mature legacy/behavioral baseline** for the iEduPro modernization programme.

The primary target repository is `christianagbotah/iedupro`, branch `zai/full-platform-reconciliation-20261024`. Read the canonical handoff there first:

`docs/ZAI_FULL_PLATFORM_HANDOFF_2026-10-24.md`

Use this SchoolManager branch in parallel while performing the full-platform reconciliation.

## Core rule

> SchoolManager defines proven workflow behavior and edge cases; iEduPro defines the forward architecture.

Do not port CodeIgniter 3/MySQL structural debt into the target. Extract the business rules, data semantics, permissions, reports and user workflows, then implement them in the target architecture.

## What to do in SchoolManager

Perform a systematic inventory of the current codebase and use it as evidence for the iEduPro parity matrix. Cover controllers, models, helpers/libraries, views, routes, database assumptions, AJAX endpoints, reports, exports, print views, role-specific flows and CI regression contracts.

For each workflow record:

- actor/role
- entry route/page
- controller/model methods
- tables/columns involved
- validation rules
- permission checks
- financial/academic side effects
- audit/logging expectations
- reports/exports/receipts
- error/empty states
- legacy quirks that should be retired rather than copied
- target iEduPro module/API/page/mobile destination

## Priority legacy domains to inspect deeply

- authentication, roles, permissions and profiles
- admin/head/teacher/class-teacher/subject-teacher/cashier/parent/student/accountant/librarian role experiences
- admissions and student lifecycle
- parent/guardian linking and family dashboard
- student profiles/information/promotion
- attendance and attendance-driven automations
- daily fees, wallet/prepayment, arrears, cashier/teacher collection, receipt/report flows
- invoice fees and finance/accounting
- expense/expenditure, budget and bank reconciliation
- assessments/exams/results/remarks/report cards
- KG/Nursery and JHS/WAEC grading semantics
- transport, driver/conductor and bus IN/OUT workflows
- payroll and Hubtel payout integration
- library, inventory/store and staff modules
- messaging, notifications and SMS automation
- settings, branding, system configuration and theme behavior
- reporting/export/printing
- sync/offline-related legacy behavior that remains relevant

## Ghana-specific behavior that must not be lost

- user-facing Ghana cedi symbol `₵` unless tenant configuration says otherwise
- feeding/classes daily fees
- optional breakfast
- weekly water where configured
- advance/prepaid daily-fee wallet
- arrears tracked by fee item
- deterministic smart allocation from a single cashier payment amount
- student payment without an invoice code where that workflow is supported
- teacher vs cashier collection boundaries
- bus attendance IN/OUT
- KG/Nursery special assessment behavior
- JHS/WAEC-oriented raw-score behavior where configured
- GPA/grade calculation rules
- Ghana Education Service lesson-note expectations where implemented

## Change policy for this repository

This branch is primarily an audit/reference branch. You may make targeted SchoolManager fixes only when they are needed to:

1. correct a proven bug/security defect in the currently used legacy product,
2. add a regression test that protects a business rule being migrated,
3. improve deployment/release reliability, or
4. produce audit/parity documentation.

Do not spend the engagement cosmetically rewriting the legacy UI if the equivalent target work belongs in iEduPro.

Do not delete working routes/features to simplify parity.

## Evidence and testing

When you infer a business rule, cite the exact code path/table or regression test that proves it. Distinguish:

- VERIFIED LEGACY BEHAVIOR
- TARGET ARCHITECTURE REQUIREMENT
- RECOMMENDATION
- INTENTIONALLY RETIRED LEGACY DEBT

Add focused regression tests around critical legacy semantics where practical before changing behavior.

Do not weaken existing CI gates.

## Expected output from this repository

Keep the authoritative parity matrix and final handover in `christianagbotah/iedupro`, but leave supporting SchoolManager audit notes under `docs/handover/legacy/` when useful.

At handover, another engineer must be able to answer:

- Which SchoolManager features exist in iEduPro?
- Which are partial or missing?
- Which legacy behaviors were intentionally retired and why?
- Which data transformations are required?
- Which exact tests prove the migrated behavior?
- Which remaining SchoolManager dependencies block decommissioning?

Work until the legacy surface is comprehensively examined, not until a convenient subset is mapped.
