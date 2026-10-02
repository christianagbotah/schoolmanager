# Wave 0 Baseline Report — Safety & System Audit

Generated 2026-10-03 from `main` @ `249ff7a` (clean tree, up to date with origin).
Wave 0 scope per `docs/ZAI_MODERNIZATION_PROMPT.md`: secret scan, .gitignore, CI3 boot/config
verification, design tokens, smoke-test checklist, route/page inventory, schema/sync audit,
**no business-logic changes**.

Companion documents produced in this wave:
- `docs/ui-modernization-inventory.md` — 399-page inventory, shell map, priorities
- `docs/sync-gap-analysis.md` — sync architecture audit, classification matrix, hardening backlog
- `assets/css/design-system.css` — design tokens + opt-in `sm-` components (NOT yet linked — zero runtime risk)

---

## 1. Repository & environment

| Item | Value |
|---|---|
| Repo | `christianagbotah/schoolmanager` (clone at `/home/z/my-project/schoolmanager`) |
| Branch | `main`, clean, up-to-date with origin |
| CI3 version | `system/` present, `index.php` front controller |
| Production DB (target) | `lightworld_schoolmanager_db` / `lightworld_db_user` — password server-side only |
| Schema authority | `schema/schoolmanager_schema_redacted.sql` (2026-10-02 structure-only, 282 tables) |
| Deploy target | `/home/lightworld/webapps/schoolmanager` — **`/home/lightworld/webapps/rochas` is never accessed** |
| Local tooling note | No PHP runtime in the current sandbox; PHP syntax checks deferred to CI/CD pipeline (GitHub Actions) or the VPS deploy preflight |

## 2. Secret scan results (scan script: `scripts/secret_scan.sh` pattern, run against full tree)

| Check | Result |
|---|---|
| Live `database.php` / `email.php` / `emailerror.php` committed | **PASS** — only `*.example.php` templates tracked |
| `.env` with real values | **PASS** — only `.env.example` with `replace_me` placeholders |
| API keys / SMTP passwords / tokens in source | **PASS** — none found |
| Production SQL data committed | **PASS** — `application/schoolmanager.sql` is a legacy structure+trigger dump (274 CREATE TABLE, 1 INSERT which is a TRIGGER body, no row data). Per contract it is NOT the schema authority; candidate for removal in a later cleanup commit (flagged, not removed in Wave 0 to keep the diff zero-behavior) |
| `uploads/`, cache, logs, sessions, vendor, node_modules | **PASS** — excluded by `.gitignore` |
| Backup/junk files tracked | **FLAG** — 9 files (see §3) |

### Security observations (preserved as-is; owner decisions required)

1. **Bulk-import default password `'123456'`** (`Admin.php:4783,22636-22637`, mirrored in `Admin_backup.php`).
   Legacy business behavior — intentionally NOT changed during UI work. Recommend an owner-level
   policy change outside the modernization contract.
2. **CI3 `encryption_key` hardcoded** in `application/config/config.php` — standard CI3 practice;
   rotating it invalidates sessions. Suggest env-override support in a later hardening pass only.
3. Sync-security gaps (device token not verified; unauthenticated `cache_data`; REPLACE INTO;
   missing table allowlists) — full detail and fix plan in `docs/sync-gap-analysis.md` §2/§8.
   These are behavior-affecting fixes that must ship as separately tested PRs, not folded into UI work.

## 3. Repository hygiene candidates (no behavior change, propose for owner approval)

- `application/controllers/Admin.php.backup`, `Admin.php.bak`, `Admin_backup.php`
- `application/controllers/Fee_collection.php.backup_20260928_123603/14`
- `application/views/backend/admin/fee_collection_portal.php.backup_20260928_123614`
- `application/views/backend/admin/navigation.php.backup`
- `application/views/backend/admin/student_marksheet.php.backup_before_restore`
- `application/views/backend/teacher/student_marksheet.php.backup`
- `assets/js/zurb-responsive-tables/javascripts/app.js.orig`
- Junk-name controllers: `get_bulk_invoices_function.php`, `getValue())`, `result_array()`,
  plus `.txt` method notes in `controllers/`

Removal was deferred at Wave 0 (include/require verification pass needed first) and completed in
commit `2554715` after that verification.

**Owner verification (2026-10-03):** the integration-fragment removals in `2554715` are accepted
and classified as **retired integration fragments — functionality already integrated or
superseded by active implementation.** Do not restore them and do not create duplicate copies
under `docs/legacy-reference/`. Verified by the owner:

| Retired fragment | Superseded by (active implementation) |
|---|---|
| `controllers/Student_termly_bill.php` | newer Admin terminal-bills workflow |
| `models/Finance_model_extended.php` | `Finance_model.php` (extensions integrated) |
| `controllers/Admin_credit_methods.php` | `Admin.php` (credit methods integrated) |
| `controllers/Admin_credit_integration.php` | `Admin.php` (credit methods integrated) |
| `controllers/transaction_sync_handlers.php` | `Sync_financial` / `Sync_daily_fees` / `Sync_server` architecture |
| `controllers/api/Sync_additional_methods.php` | active Sync/API controllers |
| `views/backend/admin/credit_integration_hooks.php` | instruction/template fragment; functionality already incorporated |

Deletion rule going forward: never treat "no grep references" alone as proof that a CI3
controller/model/view is unused — fragment-method integration in target files and supersession
by newer workflows must be verified as well.

## 4. CI3 boot & environment config

- `application/config/config.php`: dynamic base_url from `$_SERVER['HTTP_HOST']`; sessions in DB
  (`ci_sessions`, 7200s); `encryption_key` present; hooks/migrations files exist.
- `application/config/database.example.php`: safe template; real `database.php` git-ignored. ✅
- `application/config/sync.php`: feature flags (`sync_enabled`, `bidirectional_sync_enabled`,
  `auto_inject_sync_columns`, `offline_mode_enabled`), timing, retry caps.
- `.env.example`: `APP_ENV/APP_URL/DB_*/MAIL_*/SYNC_API_KEY/SYNC_DEVICE_ID` — server-side provisioning documented.
- Routes: `default_controller = login`; public verify route (`verify/(:any)/(:any)/(:any)`);
  sync route cluster; admin/* mapping routes for configurable items (interest_items,
  head_teacher_remarks, teacher_remarks_templates), daily fee/transport routes. Full map in §5 of inventory doc.

## 5. Smoke-test checklist (per-wave, per-page)

**Environment preflight (every deployment)**
- [ ] `git status` clean on `main`; `git pull` verified
- [ ] PHP syntax check across `application/` (`php -l` loop in CI)
- [ ] No new files under `uploads/`, `application/logs/`, `application/cache/` in the diff
- [ ] `database.php` / `email.php` unchanged and present on server (not in repo)

**Auth & session**
- [ ] Login as each role: admin, teacher, student, parent, accountant, cashier, hod, librarian, employee, conductor
- [ ] Wrong-password shows legacy error; account-block flow intact
- [ ] Session timeout/idle logout unchanged (`idle_user_logged_out.php`)

**Shell (Wave 1 critical — run for every role)**
- [ ] Sidebar renders with school logo + dynamic name from `settings`
- [ ] Active menu highlighting correct per page (PHP conditions preserved)
- [ ] Sidebar collapse (desktop) and off-canvas (mobile 360px) both work
- [ ] Topbar: notifications, term/session context, profile, logout
- [ ] Flash `flash_message` / `error_message` surface via toastr exactly as before
- [ ] No JS console errors; jQuery/DataTables/Select2 initializers still run

**Page families (each converted page)**
- [ ] All legacy fields/filters/buttons present (behavior checklist comparison)
- [ ] Create/Edit/Delete/View flows identical (same POST fields, same redirects)
- [ ] AJAX endpoints receive identical payloads and response keys
- [ ] Pagination, search, sort, bulk actions, exports (CSV/PDF/print) work
- [ ] Print views render identically (they must remain untouched by shell changes)
- [ ] Responsive: 360px usable, tables scroll horizontally, modals fit
- [ ] Role-gating identical (unauthorized access still denied)

**Sync (after any sync-touching PR)**
- [ ] Sync dashboard loads for admin; status AJAX responds
- [ ] Manual sync trigger works; progress updates; conflicts page loads
- [ ] Offline banner does not appear spuriously when online

**Finance/attendance/exam pages additionally**
- [ ] Before/after query result equivalence proof attached to PR
- [ ] Money totals, attendance states, grade calculations byte-identical on fixtures

## 6. Design system status

`assets/css/design-system.css` created (tokens + `sm-` opt-in components):
colors, typography, spacing, radius, shadows, layout metrics, z-index scale aligned to legacy
Bootstrap modal z-index; focus rings; skeleton; empty states; filter rows; tables; forms;
KPI grids; buttons; badges. Dark-sidebar variant token ready.

**Deliberately not linked into any view yet** — Wave 1 will link it inside the new shell partials
after visual regression comparison, keeping the risk near zero.

## 7. Priority queue (page modernization order after shell)

| Order | Target | Pages | Rationale |
|---|---|---|---|
| 0 | Shared shell (topbar/sidebar/drawer/footer/toast) | all | Everything inherits; single highest-leverage change |
| 1 | Login/forgot/error screens | ~10 | Low risk, high visibility, no data complexity |
| 2 | Admin dashboard + role dashboards | 23 | Visibility; chart conditional-loading must be preserved |
| 3 | Students list/admission/profile | 51 | Core daily workflow |
| 4 | Attendance workflows | 18 | Sync-critical; next after people |
| 5 | Fees/invoices/cashier | 52 | Highest business risk — strict equivalence proofs |
| 6 | Exams/marks/report cards | 67 | Print-output integrity critical |
| 7 | Academic setup | 19 | Reference data |
| 8 | Transport/library/inventory/hostel | 35 | Operations |
| 9 | Reports/audit + HR/payroll | 15 | Print-heavy |
| 10 | Sync center UX (Wave 9 contract) | 11 | After core sync hardening PRs |

## 8. Wave 0 completion status

| Contract item | Status |
|---|---|
| Secret scan and .gitignore | ✅ done |
| CI3 boot and environment config | ✅ done (syntax checks delegated to CI) |
| Design tokens/components | ✅ created (unlinked) |
| Smoke-test checklist | ✅ §5 |
| Route/page inventory | ✅ `docs/ui-modernization-inventory.md` |
| Schema/sync audit report | ✅ `docs/sync-gap-analysis.md` |
| No business-logic changes | ✅ docs + CSS only |

**Wave 0 complete. Wave 1 (global shell/auth) begins next.**
