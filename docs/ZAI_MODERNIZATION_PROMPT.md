# z.ai Master Implementation Brief — SchoolManager CI3 Modernization

## Mission

Modernize the existing SchoolManager CodeIgniter 3 application **only inside the SchoolManager working/deployment tree**, one page/workflow at a time, while using the legacy production application only as a read-only functional reference. The result must look and feel like a modern, professional, responsive enterprise school-management product **without changing existing business logic, calculations, permissions, workflow semantics, routes, posted field names, AJAX contracts, session behavior, or database meaning**.

This is an enhancement project, not a rewrite.

## CRITICAL PRODUCTION SAFETY BOUNDARY

`/home/lightworld/webapps/rochas` is a **live production directory and is permanently READ-ONLY for this modernization project**.

You may inspect files under `/home/lightworld/webapps/rochas` when necessary to understand legacy behavior or compare parity, but you must NEVER:
- edit, create, delete, rename, move, copy into, patch or format files there;
- run package installs, builds, migrations, seeders or code generators there;
- run Git operations that modify its working tree, index, branches or remotes;
- deploy, rsync, SCP or otherwise write application artifacts there;
- change permissions, ownership, environment/config files, uploads, caches, logs or runtime data there;
- execute SQL or maintenance commands against it for modernization purposes.

All implementation, generated files, Git changes, builds and deployments for this project must target **`/home/lightworld/webapps/schoolmanager` only**.

If any instruction, script or deployment configuration would write to `rochas`, stop that operation and redirect it to `schoolmanager`. Never use `rochas` as a deployment target, even temporarily.

## Authoritative project targets

- GitHub: `https://github.com/christianagbotah/schoolmanager.git`
- Framework: existing CodeIgniter 3 / PHP application. **Keep CodeIgniter 3.**
- VPS deployment directory: `/home/lightworld/webapps/schoolmanager`
- Read-only legacy production reference: `/home/lightworld/webapps/rochas` — **NEVER WRITE OR DEPLOY HERE**
- URL: `https://schoolmanager.lightworldtech.com`
- Production database name: `lightworld_schoolmanager_db`
- Production database user: `lightworld_db_user`
- Never place the production DB password or any other secret in Git.
- Database schema authority: the **redacted structure-only template derived from the owner's October 2, 2026 `schoolmanager_update.sql` upload**. Do not substitute an older SQL dump found inside the legacy source tree.

## Non-negotiable rules

1. **Do not migrate this project to Laravel, Next.js, React, Vue, Angular, CodeIgniter 4, or another backend framework.**
2. Preserve CI3 controllers, models, routes, sessions, role checks, business rules and request/response contracts unless a narrowly-scoped compatibility fix is necessary.
3. UI modernization must never silently remove a field, filter, action, calculation, validation rule, modal, permission, table column, bulk action, report option, print/export feature or workflow step.
4. Before changing a page, trace the complete legacy flow:
   - route;
   - controller method;
   - model methods;
   - view(s), partials and modal(s);
   - JavaScript/AJAX;
   - relevant CSS;
   - database tables, keys and settings;
   - role/permission gates;
   - redirects, flash messages and side effects.
5. Use that audit as the page's functional contract. Modernize presentation around it.
6. Do not "simplify" code by changing behavior merely because the old implementation looks unusual.
7. Query optimization is allowed only when result sets and business semantics remain identical. Prove this with tests or before/after result comparison.
8. Database changes must be migrations, reversible where practical, and must not be applied destructively to production without backup/rollback.
9. Never commit production SQL data, password hashes, emails, phone numbers, Ghana Card/SSNIT IDs, bank/mobile-money details, API tokens, SMTP passwords, DB passwords, uploaded documents, runtime logs or session data.
10. Keep the application working after every page/wave. Do not leave half-converted shells.

## Existing technology you may build on

The legacy tree already has Tailwind CSS 3.4 and Flowbite 2.5 package declarations. You may use those existing frontend dependencies incrementally inside the CI3 view layer, or improve the current CSS component system where that produces lower regression risk. Do not introduce a SPA architecture.

Prefer:
- reusable PHP view partials;
- shared design tokens;
- utility classes/component classes;
- progressive enhancement;
- accessible vanilla JS or existing project JS conventions;
- minimal dependencies.

Avoid loading two competing UI systems on the same page unless a temporary compatibility layer is required during migration.

## Required visual design system

Create a coherent enterprise-grade SchoolManager design system before mass page conversion.

### Application shell
- Modern, clean header/topbar.
- Independently scrolling sidebar; main content must scroll separately.
- Sidebar supports logical groups, child menus, active states, badges and role-based visibility from existing logic.
- Collapsible sidebar on desktop; off-canvas drawer on small screens.
- Keep school identity dynamic: logo, school name and existing configurable branding/settings.
- Clear user/profile area and logout action.
- Global online/offline/sync indicator when sync work is enabled.

### Page layout
- Consistent page title, breadcrumb/context, description and primary action.
- Desktop max-width and spacing system suitable for information-dense school administration.
- Filters on one horizontal row where space permits; wrap cleanly on tablet/mobile.
- Keep primary action buttons aligned with filters where appropriate.
- No arbitrary whitespace or uneven card heights.
- Use responsive grids deliberately: KPI cards, forms, reports and dashboards should adapt without truncation.

### Tables
- Clean headers, row hover, sticky header where useful.
- Responsive horizontal overflow rather than clipped columns.
- Pagination for large datasets.
- Search, filters, sort and bulk actions must retain existing behavior.
- Keep important identity columns visible; use responsive detail drawers/cards only when necessary.
- Use compact but readable density.
- Empty/loading/error states must be professional and explicit.

### Forms
- Labels above or consistently paired with fields.
- Clear required/optional states and inline validation.
- Logical sections for long forms.
- Date fields fully clickable.
- Buttons aligned and responsive.
- Selects/autocomplete must retain posted values exactly.
- Do not rename HTML input names if backend logic depends on them.
- Destructive actions require clear confirmation.

### Modals/drawers
- Replace browser alerts/confirms with application modals where this can be done without changing backend behavior.
- Accessible focus handling, Escape/close support, scrolling body, responsive sizing.

### Feedback
- Toast/banner success and error feedback.
- Do not hide backend error messages; make them more specific where the server already provides detail.
- Skeleton/loading states for AJAX operations.

### Accessibility
- Semantic headings/labels.
- Keyboard navigation.
- Visible focus states.
- Meaningful button text/tooltips.
- Adequate contrast.
- ARIA only where native semantics are insufficient.

### Mobile
Every converted page must be usable at 360px width without action loss, hidden required fields, clipped modals or inaccessible tables.

## Page-by-page modernization method

For every page, follow this exact sequence:

1. **Legacy audit** — document controller/model/view/JS/CSS/tables/permissions and every action.
2. **Behavior checklist** — list what the old page can do.
3. **UI conversion** — modernize shell, hierarchy, filter/action row, cards/table/form/modal and responsive behavior.
4. **Behavior verification** — prove every old action still works.
5. **Query review** — inspect only queries used by that page and make safe improvements if justified.
6. **Sync review** — if the page mutates data, verify its writes participate correctly in the sync architecture.
7. **Regression tests** — role access, create/read/update/delete, validation, AJAX, print/export if applicable.
8. **Commit** — one coherent page/workflow change with a descriptive commit.
9. Continue to the next page without waiting for a general redesign at the end.

## Recommended implementation waves

Do not randomly redesign files. Work through coherent functional waves while still validating each page individually.

### Wave 0 — safety and baseline
- Secret scan and .gitignore.
- CI3 boot and environment config.
- Establish design tokens/components.
- Create smoke-test checklist.
- Capture existing route/page inventory.
- Create schema/sync audit report.
- No business-logic changes.

### Wave 1 — global shell/auth
- Login/forgot/reset flows.
- Header/topbar.
- Sidebar/navigation for every role.
- Footer.
- Dashboard shell.
- Common modals, alerts, pagination, table/form components.
- Error pages.

### Wave 2 — core school setup/master data
- Settings.
- Academic years/terms.
- Classes/sections/subjects.
- Departments/designations.
- School configuration.
- Roles/permissions where present.

### Wave 3 — people and admissions
- Admission.
- Students.
- Parents/guardians.
- Teachers.
- Employees/staff.
- HOD and role self-service pages.
- Alumni where present.

### Wave 4 — attendance and daily operations
- Student attendance.
- Staff attendance.
- Check-in/check-out.
- Transport/bus attendance.
- Daily-fee attendance-linked workflows.
- Logs and bulk actions.

### Wave 5 — fees/finance/cashier
- Billing/invoices.
- Student payments.
- Daily fee wallet/transactions.
- Discounts.
- Accounts/payables/receivables.
- Cashier views.
- Bank/reconciliation/expense/budget pages.
- Print/receipt/report flows.

### Wave 6 — academics
- Exams.
- Exam categories.
- Marks entry.
- Portfolio assessment.
- Report cards.
- Grades/remarks.
- Syllabus/curriculum/lesson-note resources.
- Teacher academic pages.

### Wave 7 — operations
- Library.
- Inventory/assets/POS if present.
- Hostel/boarding.
- Transport.
- Visitor/discipline.
- Tasks/notices/calendar/communications.

### Wave 8 — reports/audit
- All report pages.
- Export/print flows.
- Audit logs.
- Operational dashboards.
- Large-table pagination and query tuning.

### Wave 9 — offline/online sync UX and hardening
- Sync center.
- Conflict review.
- Device status.
- Pending/failed queue.
- Manual retry.
- Connection status.
- Diagnostics safe for administrators.
- Full multi-device test suite.

## Query optimization rules

Optimization must be conservative and measurable.

### Allowed
- Replace obvious N+1 query loops with joins or batched `WHERE IN` queries.
- Select only required columns for heavy listings.
- Add pagination/server-side filtering to large tables.
- Add indexes proven useful by actual `EXPLAIN` plans and page query patterns.
- Add composite indexes in the same column order used by high-frequency filters/joins.
- Cache genuinely static/reference data with explicit invalidation.
- Reuse loaded settings/reference values instead of querying them repeatedly inside loops.
- Use CI Query Builder bindings/parameters instead of hand-built dynamic SQL.
- Wrap logically atomic multi-table writes in transactions once the participating tables support transactions.

### Forbidden
- Changing totals, rounding, fee allocation, attendance semantics, grading, invoice settlement or authorization rules in the name of optimization.
- Adding indexes blindly.
- Replacing a query whose duplicate/NULL behavior is not understood.
- Introducing stale caching for finance, attendance or permissions.
- Converting database engines directly on production without compatibility and rollback testing.

For every changed query record:
- old query shape;
- new query shape;
- expected result equivalence;
- `EXPLAIN` before/after;
- relevant index;
- rough timing on representative data.

## Bidirectional offline/online sync — existing foundation

The current codebase already contains sync-oriented controllers/models and the supplied schema contains sync metadata, queue, device, conflict, audit and failure structures. Treat that as an existing subsystem to **audit and harden**, not a reason to start over.

The uploaded schema audit found:
- 282 tables total;
- 243 explicitly InnoDB;
- 25 explicitly MyISAM;
- 94 tables with `sync_status`;
- about 93 tables with `version` / `last_modified_at`;
- only 2 table definitions with `sync_operation_type`;
- only a small number of tables with deletion/tombstone metadata.

These facts mean the database is partially prepared for sync but is not yet uniformly safe for true multi-device bidirectional operation.

## Required sync architecture

### 1. Define authority and topology

Preferred model:
- cloud SchoolManager server/database is the canonical shared authority;
- each school/local installation or browser/device can work temporarily offline;
- clients synchronize through authenticated HTTPS CI3 APIs;
- do **not** distribute direct remote MySQL credentials to clients/devices.

The existing direct local-MySQL-to-remote-MySQL sync path may remain temporarily behind a feature flag for compatibility, but the target architecture should be API-mediated.

### 2. Stable cross-device identity

Do not rely on auto-increment integer primary keys alone for records created offline.

Introduce a stable sync identity for mutable synchronizable entities, e.g.:
- `sync_uuid CHAR(36)` (or an equivalent compact UUID representation);
- unique index on `sync_uuid`.

Keep legacy integer IDs for application compatibility. Map integer IDs locally while `sync_uuid` is the cross-device identity.

### 3. Consistent metadata

For synchronizable mutable tables standardize, as appropriate:
- `sync_uuid`;
- `sync_status`;
- `version`;
- `last_modified_at` in UTC;
- `last_modified_by`;
- `device_id`;
- retry/error metadata where row-level status is genuinely needed.

Do not mechanically add all fields to immutable/cache/reference tables. First classify tables:
- authoritative reference;
- mutable master;
- transactional;
- append-only/audit;
- derived/cache;
- local-only/runtime.

### 4. Server-controlled versioning

A client must not be able to overwrite the canonical `version` arbitrarily.

For updates:
- client sends record identity + base version + mutation;
- server updates only when base version matches;
- server increments version atomically;
- stale updates become conflicts, not silent overwrites.

### 5. Change feed/cursor

Timestamp-only pull can miss or duplicate changes due to clock skew and equal timestamps.

Add a monotonic server change sequence / change-log concept, e.g.:
- `sync_change_log.change_seq BIGINT AUTO_INCREMENT`;
- table;
- sync UUID;
- operation;
- canonical version;
- changed_at UTC;
- source device.

Each device stores its last acknowledged server cursor.

### 6. Deletions

True bidirectional sync must propagate deletes.

Use either:
- soft deletion fields on suitable business tables; or
- a central `sync_tombstones` table.

A tombstone must include identity, table/entity, version, deleted_at, source device and enough retention time for offline devices to observe it.

Never silently hard-delete a record on one side and expect timestamp pull to discover it.

### 7. Idempotency

Every queued client mutation needs a unique mutation/idempotency key. Retrying after a timeout must not create a duplicate payment, attendance row, invoice, mark or other transaction.

Server stores processed mutation IDs and returns the original result for duplicates.

### 8. Conflict policy by domain

Do not use one global "last write wins" rule.

Examples:
- immutable financial ledger/audit records: append-only; corrections via reversal/void, not overwrite;
- payment/invoice settlement: server transaction + strict version/idempotency rules;
- settings/reference values: usually server-authoritative unless explicitly editable offline;
- attendance: merge based on business key and explicit field semantics;
- descriptive student/profile data: optimistic version conflict; manual merge where both sides changed;
- audit logs: append-only;
- derived caches: regenerate; do not sync unless necessary.

Use `sync_conflicts` for real user-reviewable conflicts and provide a professional admin UI.

### 9. Do not use REPLACE semantics for normal sync upserts

The existing sync API contains a `REPLACE INTO` style path. MySQL REPLACE can delete the old row and insert a new one, which can disrupt foreign keys, audit history, timestamps and related records.

Replace it with deliberate logic:
- INSERT when entity does not exist;
- version-checked UPDATE when it exists;
- conflict when base version is stale;
- transaction around dependent operations.

Keep compatibility tests proving results are unchanged.

### 10. Transactional safety and MyISAM

MyISAM does not provide transactional behavior or foreign-key enforcement. Audit all 25 MyISAM tables and classify them.

For tables participating in atomic financial/attendance/sync workflows, plan tested InnoDB migrations. Do not mass-convert blindly. Verify:
- indexes;
- row size;
- default values;
- full-text needs;
- query behavior;
- backup/restore;
- application compatibility.

### 11. Device security

The current device-ID/token concept can remain but harden it:
- generate high-entropy tokens;
- store only token hashes server-side;
- show token only at enrollment/rotation;
- HTTPS only;
- device ACTIVE/INACTIVE/BLOCKED state;
- rotation/revocation;
- rate limits;
- audit failed auth;
- never log raw tokens;
- never store production DB credentials in browser storage.

### 12. Browser offline experience

Because this remains CI3, add offline capability progressively rather than replacing the UI framework.

Use:
- Service Worker for application shell/static assets;
- IndexedDB for offline read models and pending mutations;
- a client-side outbox;
- reconnect detection;
- background/manual sync where browser support allows;
- a visible offline banner;
- pending change count;
- "Sync now";
- last successful sync;
- conflict/failure badges.

Do not promise every report works offline if its data was never cached. Make offline availability explicit per module.

### 13. Attachments

Do not embed large files in SQL sync JSON.

For photos/documents:
- local pending attachment record;
- content hash;
- metadata sync;
- separate authenticated upload;
- retry/resume;
- server returns canonical file reference;
- mutation becomes complete only after required attachment linkage succeeds.

### 14. Referential ordering

Push dependencies in an explicit order or resolve by sync UUID:
- reference/master records before children;
- student/parent before enrollment/attendance/payment children;
- invoice before invoice-dependent records, etc.

Pull can be batched by cursor but local application must apply changes transactionally in dependency-safe groups.

### 15. Offline sync tests

Build automated integration tests with at least two independent clients/devices plus a server dataset.

Mandatory scenarios:
- create offline then sync;
- update offline then sync;
- create then update repeatedly before first sync;
- delete offline;
- same record updated by two devices;
- stale base version;
- duplicate retry after lost response;
- network drop halfway through a batch;
- client clock wrong by hours/days;
- auto-increment IDs collide but UUIDs do not;
- parent/child records created offline;
- duplicate attendance attempt;
- duplicate payment attempt;
- concurrent payment against same outstanding invoice;
- conflict resolution local/remote/merged;
- blocked/revoked device;
- attachment interrupted and resumed;
- pull interrupted and resumed from cursor;
- 10k+ pending changes in batches;
- data checksum/reconciliation after sync.

## Sync schema migrations to design, not blindly apply

Create migration proposals for:
- `sync_uuid` on classified synchronizable entities;
- `sync_change_log`;
- `sync_tombstones`;
- `sync_mutation_receipts` / idempotency registry;
- per-device cursor/state;
- missing indexes for sync queries;
- server-side version increment mechanism;
- selective MyISAM to InnoDB conversion.

First generate a migration impact report showing affected tables and code paths. Apply to a copy/staging database and run regression/sync tests before production.

## Sync UI

Create an administrator Sync Center that shows:
- connection state;
- device ID/name/status;
- last successful sync;
- last attempted sync;
- pending pushes;
- pending pulls if tracked;
- failed mutations;
- conflict count;
- retry count;
- progress;
- "Sync now";
- safe diagnostics;
- conflict resolution workflow;
- recent sync audit events.

Normal users should see only a small non-disruptive connectivity/pending indicator unless their role needs more.

## Data/security cleanup

Before any repository import or deployment:
- remove live DB config;
- provide `database.example.php` / environment-driven config;
- remove SMTP secrets;
- remove production SQL data;
- exclude `uploads/`, logs, cache, sessions, backups, ZIP archives, vendor/node_modules if dependencies are reproducible;
- scan history before pushing secrets;
- rotate any credential found in plaintext in the legacy archive.

Do not commit the DB password requested for `lightworld_db_user`; configure it directly on the VPS/environment.

## Deployment discipline

Target:
`/home/lightworld/webapps/schoolmanager`

Do not deploy by overwriting production blindly.

Before first live deployment:
1. archive the current deployment if one exists;
2. back up the database;
3. confirm PHP/extensions and writable directories;
4. install Composer/npm dependencies only if needed;
5. configure environment secrets outside Git;
6. run PHP syntax checks;
7. run smoke tests;
8. deploy;
9. verify login, dashboard, a representative CRUD page, AJAX, upload, print/export and role access;
10. retain an immediate rollback path.

Subsequent deployments should be Git-based and reproducible.

## Git workflow

- `main` must remain deployable.
- Use focused branches/PRs for high-risk sync/schema work.
- Small page-by-page UI commits are preferred.
- Commit message examples:
  - `refactor(ui): modernize admin students page without behavior changes`
  - `perf(db): batch class lookup on attendance listing`
  - `feat(sync): add server cursor and mutation idempotency`
- Never combine an unrelated business-rule change with a UI refactor.

## Testing / acceptance criteria for each page

A page is not "done" because it looks modern.

It is done only when:
- all prior actions are still present;
- role access is unchanged;
- create/edit/delete behavior matches legacy;
- calculations match legacy;
- filters/search/pagination work;
- validation works;
- AJAX endpoints still receive expected payloads;
- mobile layout is usable;
- no console/PHP errors;
- no new N+1 regression;
- printed/exported output still works if applicable;
- database writes have correct sync metadata/outbox behavior where required.

## Required reporting back to the owner

After every converted page/workflow, report:
1. page/workflow;
2. legacy files audited;
3. files changed;
4. UI/UX improvements;
5. logic explicitly preserved;
6. query changes, if any;
7. schema/sync changes, if any;
8. tests run and results;
9. deployment status;
10. next page.

For the first pass, also produce:
- full route/page inventory by role;
- design-system inventory;
- sync table classification matrix;
- MyISAM migration-risk report;
- missing-index/query hot-spot report;
- secret/security audit;
- prioritized page modernization queue.

## Definition of success

The final product should still be recognizably the same SchoolManager business system internally, with the same workflows and logic, but with:
- consistent enterprise-grade UX/UI;
- responsive layouts across all roles;
- clearer forms, filters, tables, reports and dashboards;
- safer/faster database access where measured;
- no committed secrets or production user data;
- robust offline/online synchronization with idempotency, versioned conflict handling and deletion propagation;
- a professional sync experience;
- reproducible Git/VPS deployment.

Start with Wave 0, audit before editing, and proceed page-by-page. Do not wait for permission between ordinary pages once the constraints above are satisfied; stop only for a genuine functional ambiguity, destructive production migration, or secret/credential requirement.
