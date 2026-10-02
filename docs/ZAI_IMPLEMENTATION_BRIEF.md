# z.ai Implementation Brief — SchoolManager CI3 Modernization

## Mission

Modernize the existing **SchoolManager CodeIgniter 3 application in-place** into a polished, modern, responsive, professional school-management product while preserving its existing business logic, routes, permissions, forms, database behavior, reports, workflows, and user-visible outcomes.

This is **not a rewrite** and **not a framework migration**. Continue using the existing CodeIgniter 3/PHP application, its controllers, models, views, JavaScript, CSS, and existing database. Improve UI/UX progressively, one page/workflow at a time. Query and schema work is allowed only where it is proven safe, backward-compatible, migration-driven, and covered by tests.

Repository: `christianagbotah/schoolmanager`  
Production URL: `https://schoolmanager.lightworldtech.com`  
VPS deployment directory: `/home/lightworld/webapps/schoolmanager`  
Production database name: `lightworld_schoolmanager_db`  
Production DB user: `lightworld_db_user`  
**Never request, print, commit, log, or hard-code the DB password or any other secret.**

Before doing anything, read this file, `schema/SCHEMA_REVIEW.md`, `schema/redacted_schema_template.sql`, the existing routes, controllers, models, views, JS, config, and the relevant workflow end-to-end.

---

## Non-negotiable constraints

1. **Keep CodeIgniter 3.** Do not migrate to CI4, Laravel, React, Next.js, Vue, another PHP framework, or a SPA.
2. **Do not change business logic merely to modernize the UI.** The same actions must produce the same records, calculations, invoices, grades, attendance states, payroll outputs, permissions, reports, and redirects.
3. **Do not rename routes, controller methods, POST field names, AJAX response keys, session keys, database columns, or role identifiers unless a compatibility layer is added and regression-tested.**
4. **Study before editing.** For every page, trace:
   - route
   - controller method
   - model calls
   - view
   - included partials
   - page-specific JS/AJAX
   - permissions/role checks
   - tables/queries touched
   - downstream reports/exports
5. **Preserve all functionality.** Never remove an existing field, filter, action, bulk action, export, modal, report, permission, or workflow just because the screen looks crowded.
6. **UI modernization must be progressive and reversible.** Small PRs, page/workflow scoped.
7. **No production data in Git.** The supplied production dump contained real records. Only sanitized structure/templates belong in the repository.
8. **No secrets in Git.** Use environment/server configuration. Existing legacy secret-bearing config files are intentionally ignored.
9. **Do not run destructive schema changes directly on production.** Use versioned, idempotent migration scripts with rollback/verification notes.
10. **Do not deploy partially working pages.** Each PR must pass syntax checks and the relevant workflow smoke tests.

---

## Desired visual standard

The target is an enterprise-grade, modern school-management interface that feels cohesive and fast on desktop, tablet, and mobile.

Use the existing frontend stack and assets where practical. You may add lightweight compatible CSS/JS libraries when justified, but avoid replacing the application architecture.

### Global shell

Modernize the shared layout first:
- responsive left navigation with independent scroll
- mobile drawer behavior
- clear active parent/child nav state
- compact professional top bar
- breadcrumbs where helpful
- consistent page titles/subtitles/action areas
- consistent spacing scale, card radius, shadows, borders, typography
- accessible focus/hover/disabled states
- reusable button hierarchy: primary, secondary, neutral, danger, icon
- reusable badges/status pills
- consistent modal and side-sheet behavior
- toast/inline feedback instead of browser `alert()` where feasible without changing logic
- loading/skeleton/empty/error states
- consistent form validation styling
- WCAG-conscious contrast and keyboard navigation

Do not introduce visual gimmicks that make high-density administrative pages harder to use.

### Forms

- labels directly associated with controls
- logical field grouping
- desktop grid; clean single-column mobile layout
- filters should normally remain on one aligned row on desktop when space permits
- date fields fully clickable
- searchable selects where existing datasets justify them
- inline error/help text
- sticky/save action area only when it improves long forms
- confirmation for destructive or financially significant actions
- do not hide required legacy fields

### Tables and data-heavy pages

- clear header hierarchy
- sticky headers where useful
- horizontal overflow rather than truncated data
- row hover/focus
- compact but readable density
- responsive column priorities
- search/filter/sort controls aligned professionally
- pagination retained
- bulk actions retained
- exports retained
- action menus consolidated only if every existing action remains accessible
- numeric/money columns aligned consistently
- empty states must explain what the user can do next

### Dashboards/reports

- keep existing calculations exactly the same
- reorganize KPIs into responsive cards
- modernize charts without changing underlying numbers
- use consistent legends/tooltips/date ranges
- preserve print/export views
- do not replace audited financial/academic totals with client-side recalculations

---

## Page-by-page execution method

Create a living `docs/ui-modernization-inventory.md` before major UI work. Inventory every user-facing view and classify it by module, route, role, controller, view, status, and dependencies.

Then work in waves. **Do not mass-redesign hundreds of views in one PR.**

### Wave 0 — Baseline and design system
- map routes/controllers/views/models
- identify shared headers, sidebars, footers, modal partials, CSS and JS
- capture screenshots of representative pages
- document current behavior of shared components
- define CSS variables/tokens and reusable components compatible with existing views
- add a UI smoke-test checklist
- no business-logic changes

### Wave 1 — Authentication and shared shell
Login, password/reset screens if present, dashboard shell, navigation, headers, breadcrumbs, profile controls, global messages, shared modals.

### Wave 2 — Core people and academic setup
Students, admissions, parents/guardians, teachers/staff, classes, sections, subjects, academic year/term/semester, enrollment.

### Wave 3 — Attendance and daily operations
Student/staff attendance, transport IN/OUT where present, daily fees/feeding/classes/water/breakfast workflows, dashboards and operational reports.

### Wave 4 — Exams, assessment and reports
Exam setup, marks entry, portfolio/continuous assessment, aggregation, report cards, remarks, GPA/raw score rules already implemented, print/export.

### Wave 5 — Finance
Invoices, student accounts, daily-fee wallet/prepayments/arrears, payments, expenses, accounting, discounts, budgets, financial reports. This wave requires stronger regression tests because money is involved.

### Wave 6 — HR/payroll
Employees, payroll, pension/tax, leave, attendance, appraisal/training/disciplinary modules and reports.

### Wave 7 — Remaining modules
Library, inventory/POS, transport, hostel/boarding, messaging/notices, visitor tracking, settings, audit tools, sync administration, and every remaining routed page.

A page is not “done” until desktop/tablet/mobile behavior and the underlying action paths are tested.

---

## Business-logic preservation protocol

For each page PR, include a short contract table in the PR description:

| Contract | Before | After |
|---|---|---|
| Route(s) | unchanged | unchanged |
| Controller method(s) | list | unchanged unless explicitly documented |
| POST/AJAX fields | list | unchanged |
| Response keys | list | unchanged |
| Tables written | list | same |
| Permission checks | list | same |
| Redirect/flash behavior | list | same |
| Reports/exports impacted | list | verified |

If a UI refactor requires a backend change, explain why and prove compatibility with a test.

---

## Query optimization rules

Safe query optimization is encouraged, but correctness is more important than speed.

1. Identify slow pages from real timings/logs first.
2. Capture SQL and run `EXPLAIN`/row-count analysis before altering indexes or query shape.
3. Remove obvious N+1 loops by batching/joining while preserving result semantics.
4. Select only required columns on large tables when safe.
5. Add indexes only for demonstrated WHERE/JOIN/ORDER/GROUP access patterns.
6. Prefer composite indexes matching actual filters over many single-column indexes.
7. Paginate genuinely large grids; never silently cap results.
8. Avoid wrapping indexed columns in functions in WHERE clauses where practical.
9. Cache only data whose freshness semantics are understood.
10. Financial totals and academic aggregation must be checked against pre-change fixtures.
11. Never convert a LEFT JOIN to INNER JOIN, change grouping, deduplicate, reorder, or change null handling without proving equivalence.
12. Watch stored procedures/report queries for join multiplication. In particular, totals that join one charge row to multiple payment rows must aggregate each side before the join or otherwise prevent repeated charge amounts.
13. Add a short “before/after” measurement to query-performance PRs.

---

## Database/schema findings that must guide the work

The supplied 2026-10-02 MySQL dump already contains a partial sync architecture. Do not start another unrelated sync system.

Our structure audit found:
- approximately 268 table definitions
- a mix of InnoDB and 25 MyISAM definitions
- many tables already have `sync_status`, `last_modified_at`, `device_id`, `version`, retry/error fields
- only a subset has the complete metadata set, so coverage is inconsistent
- `sync_operation_type` is not uniformly present
- existing sync tables include device, metadata, conflict, deletion/tombstone, queue, audit, settings/metrics structures
- several legacy date/year fields use text types
- several monetary fields use `DOUBLE`
- the current queue/schema and some legacy sync code do not use one fully consistent contract

Do not “fix all 268 tables” in one migration. Build a sync table registry and phase tables by business criticality.

MyISAM is especially important: transactions used by sync code cannot provide atomic rollback on MyISAM tables. For sync-critical writable tables, plan a tested, staged conversion to InnoDB where compatible. Treat dumped view-like objects separately from real base tables.

Do not globally convert money `DOUBLE` to `DECIMAL` or text dates to typed dates as part of UI work. Audit, test, migrate module-by-module if needed.

---

## Offline/online bidirectional sync target

The application already includes sync controllers/services/models plus IndexedDB/offline JS and a service worker. Strengthen and consolidate those pieces rather than bolting on another incompatible subsystem.

### Required architecture

Use an **offline-first outbox + server change-feed** model:

1. Browser writes supported offline mutations to IndexedDB immediately.
2. Every queued mutation gets a stable UUID/idempotency key, device ID, user/tenant/school context, entity/table, operation, local timestamp, expected version and payload.
3. When online, client pushes outbox items in ordered batches.
4. Server validates authentication, authorization, table allowlist, fields and versions.
5. Server applies each mutation idempotently inside a transaction for transactional tables.
6. Server records the canonical result/change event and returns server version/cursor.
7. Client pulls changes after a **server-issued cursor/watermark**, not only “client timestamp > last sync.”
8. Client applies remote changes to its local cache and acknowledges the new cursor.
9. Deletes propagate through tombstones/soft-delete events, not silent hard-delete disappearance.
10. Conflicts are deterministic and auditable; manual-review conflicts are surfaced in the existing conflict UI.

### Do not rely on clock time alone

A `last_modified_at > last_sync` protocol can miss or duplicate changes because of clock skew and same-timestamp writes. Introduce a monotonic server change sequence/cursor (or a deterministic `server_changed_at + primary_key` cursor) while retaining legacy timestamps for compatibility.

### Idempotency and identity

Retries must never create duplicate admissions, payments, attendance records, marks, invoices, wallet movements, or fee collections.

Add a mutation UUID/idempotency key to the sync transport and server ledger. Existing numeric auto-increment PKs may remain for compatibility. If offline creation can happen on more than one device, add a stable `sync_uuid`/origin mapping rather than relying on locally generated integer PKs.

### Device authentication

Audit the existing device registration/verification flow. A device must have revocable credentials; never treat `device_id` by itself as authentication. Store only a hash of device tokens if server-side storage is needed. Support revoke/rotate/status. A global sync API key, if retained, is an application credential—not sufficient per-device identity.

### Dynamic table safety

Any endpoint/service that accepts a table name or field list from the client must enforce a server-side allowlist sourced from sync metadata. Never execute arbitrary dynamic table/field names supplied by a client.

### Authorization

Each sync mutation must run under the authenticated user's role/school/tenant scope and pass the same business authorization as the online operation. Offline mode must not become a bypass around CI3 permission checks.

### Conflict rules

Define policy by domain rather than one universal timestamp winner:
- immutable financial ledger/payment events: append/idempotent, never “last writer wins”
- attendance: unique business key + explicit correction event/version
- exam marks: optimistic version + authorized conflict resolution
- profiles/settings: version-based merge or latest authorized change as appropriate
- deletions: tombstone + authorization
- master/reference data: server authoritative unless explicitly editable offline

Log both versions, resolver, strategy, timestamps and resolution.

### Browser storage

Consolidate the currently fragmented IndexedDB usage into one versioned storage abstraction:
- `entities` or domain stores
- `outbox`
- `sync_state`
- `conflicts`
- optional attachment queue

Do not cache passwords, session cookies, sensitive auth material, or unnecessary PII.

### Service worker

Upgrade the service worker deliberately:
- versioned static asset cache
- network-first for dynamic authenticated pages/APIs unless a safe offline representation exists
- cache-first/stale-while-revalidate only for static versioned assets
- do not cache login responses or private API responses indiscriminately
- safe cache invalidation on deployment
- offline fallback page/status
- background sync when supported, but always retain online-event/manual retry fallback

### Attachments

Photos/documents require a separate queued upload protocol:
- local blob reference
- size/type validation
- idempotent upload token
- retry/resume policy
- associate only after server confirms upload
- do not embed large base64 blobs in ordinary record JSON

### Sync UI

Create a compact global sync indicator:
- Online / Offline
- Syncing
- Pending count
- Last successful sync
- Failed/conflict count
- Retry action
- “View sync details”

Never block normal offline work merely because the server is unreachable when that workflow is explicitly offline-enabled.

---

## Sync rollout order

Do not enable offline writes everywhere at once.

1. **Read-only offline shell/reference data**
2. **Attendance**
3. **Daily operational fees/collections** only after idempotency and accounting tests
4. **Admissions/student records**
5. **Exam marks**
6. Other modules after domain-specific conflict rules exist
7. High-risk accounting/payroll operations last, and only if business rules permit offline mutation

For each module, specify:
- offline-readable data
- offline-writable actions
- natural/business unique key
- conflict strategy
- delete policy
- idempotency rule
- authorization rule
- reconciliation report

---

## Sync tests that are mandatory

Automate scenarios for:
- create offline -> reconnect -> one server row only
- update same record on two devices -> deterministic conflict
- same mutation retried 5 times -> applied once
- network dies after server commit but before client response -> retry remains safe
- pull interrupted mid-batch -> resume without loss/duplicate
- delete offline -> tombstone reaches other clients
- two events with identical timestamps -> neither is skipped
- device clock deliberately wrong -> sync still correct
- revoked device -> push denied
- unauthorized table/field -> denied
- queue contains malformed JSON -> item fails without poisoning batch
- MyISAM/transaction-sensitive table -> either migrated or explicitly excluded
- concurrent daily-fee/payment operation -> balances reconcile
- offline attachment -> eventually linked exactly once
- logout/user switch -> no cross-user offline queue leakage

Add a diagnostics page/report that reconciles pending, failed, conflicted and orphaned mutations.

---

## Query/schema hardening specifically for sync

Create versioned migrations, not ad-hoc ALTERs. Standardize a canonical sync contract for tables that are actually opted in.

Recommended fields for an opted-in mutable entity, adapted to existing naming:
- stable sync UUID where offline creation requires it
- `sync_status`
- `last_modified_at`
- `last_modified_by`
- `device_id`
- integer `version`
- retry/error metadata where kept on the entity
- optional `deleted_at`/tombstone mechanism

Recommended indexes must be based on actual query patterns, commonly:
- unique sync UUID
- `(last_modified_at, primary_key)` or server sequence
- `(sync_status, last_modified_at)`
- business uniqueness keys needed for idempotency

Do not add redundant indexes blindly.

---

## Security cleanup

Before each deployment:
- repository secret scan
- no production SQL data
- no SMTP/DB/API passwords
- no user-uploaded private documents
- no debug dumps
- no writable executable upload paths
- escape output in views where legacy code prints user-controlled values
- keep CSRF protections working with AJAX/offline replay
- parameterize queries/use Query Builder
- validate uploads and generated filenames
- retain role/permission checks in redesigned pages

Any legacy credential discovered in source must be moved to environment/server config and rotated outside Git.

---

## Git and PR workflow

Work from `main`, but implement each wave/page on a feature branch.

Suggested naming:
- `ui/shell-modernization`
- `ui/students-index`
- `ui/admission-form`
- `perf/student-list-query`
- `sync/core-contract`
- `sync/attendance-offline`

Every PR must contain:
1. scope
2. screenshots before/after for UI work
3. behavior contract
4. controller/model/view files inspected
5. tests performed
6. DB migration notes if any
7. query timing/EXPLAIN if performance changed
8. mobile/tablet/desktop verification
9. rollback note

Do not combine unrelated pages into one giant PR.

---

## CI expectations

At minimum add/retain checks for:
- PHP syntax on application PHP files
- forbidden secret patterns
- no committed production SQL/data/uploads
- migration lint/safety checks
- basic route/controller smoke tests where feasible
- JavaScript syntax/build check if assets use a build step
- targeted regression tests added as modules are modernized

Do not make CI “green” by deleting failing tests or weakening assertions.

---

## Deployment expectations

Target: `/home/lightworld/webapps/schoolmanager`

Prepare a safe GitHub Actions deployment flow only after the baseline is verified. It must:
- deploy only from approved main commits
- never commit or echo secrets
- keep server-only config/secrets outside the repository
- preserve writable runtime/upload directories
- preserve environment-specific database configuration
- install dependencies from lockfiles as needed
- run non-destructive preflight checks
- support rollback
- take/verify DB backup before schema migrations
- apply migrations explicitly and fail closed
- perform a post-deploy health/smoke check against `https://schoolmanager.lightworldtech.com`

Do not deploy a database migration just because it exists in a UI PR.

---

## Definition of done for a modernized page

A page is complete only when:
- all old capabilities are present
- role permissions behave the same
- create/edit/delete flows work
- validation and flash/AJAX feedback work
- filters/search/pagination/export work
- no data is visually truncated
- desktop/tablet/mobile are usable
- keyboard/focus states are reasonable
- no new console/PHP errors
- query count/performance did not regress materially
- relevant regression checks pass
- screenshot evidence is attached to PR

---

## First work to perform

1. Audit the repo and create `docs/ui-modernization-inventory.md`.
2. Produce a route -> controller -> model -> view -> table dependency map.
3. Identify the shared shell/theme assets and propose the small reusable CI3-compatible design system.
4. Audit existing sync code and reconcile it against `schema/SCHEMA_REVIEW.md`; produce `docs/sync-gap-analysis.md`.
5. Do **not** begin broad schema changes.
6. Implement the shared shell as the first visual PR.
7. Then modernize pages one workflow at a time using the waves above.
8. In parallel, build sync contract/tests behind feature flags before enabling offline writes for additional modules.
9. Report any place where preserving legacy logic conflicts with security, data integrity or reliable sync; propose the smallest compatible fix and test it before coding.

The guiding principle is: **modernize the experience, preserve the proven school logic, and harden the data/sync layer incrementally without replatforming the product.**
