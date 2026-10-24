# SchoolManager → iEduPro Parity & Control Matrix (Legacy Side)

Date: 2026-10-24
Branch: `zai/full-platform-reconciliation-20261024` @ ff96b2e + evidence pack
Authority chain: `docs/ZAI_FULL_PLATFORM_HANDOFF_2026-10-24.md` (canonical handoff lives in iEduPro repo; this file is the legacy-side control record).

## How to read this matrix

- **VERIFIED LEGACY BEHAVIOR (VLB)** — proven by exact code path cited in the per-domain audit docs (`01-…`–`06-…`). Must be reproduced in iEduPro behavior (architecture may differ).
- **TARGET ARCHITECTURE REQUIREMENT (TAR)** — required by the iEduPro forward architecture (multi-tenant, RBAC, PostgreSQL, NestJS/Next.js/Flutter, offline-first sync).
- **RECOMMENDATION (REC)** — improvement justified by evidence; decision can be made during iEduPro implementation.
- **INTENTIONALLY RETIRED LEGACY DEBT (IRLD)** — proven-broken or superseded legacy behavior deliberately NOT ported. Each entry cites why.

Status legend for "Parity in iEduPro": `UNVERIFIED` (no iEduPro repo access yet at time of writing) / `PRESENT` / `PARTIAL` / `MISSING` / `RETIRED-BY-DESIGN`. When iEduPro access is granted this column becomes the live tracking surface and moves to `iedupro/docs/handover/PARITY_MATRIX.md`.

## 0. Domain status at a glance

| # | Domain | Legacy state (evidence doc) | Health | Parity in iEduPro |
|---|--------|------------------------------|--------|-------------------|
| 1 | Auth, RBAC, profiles | 01 | Fragile-but-working; 6 credential tables, 4 permission generations | UNVERIFIED |
| 2 | Admission, students, parents, enrollment | 02 | Works, non-atomic + magic strings | UNVERIFIED |
| 3 | Attendance & transport | 03 | Works; enterprise shell broken; per-leg bus fares | UNVERIFIED |
| 4 | Exams, grading, report cards | 04 | 3 coexisting generations; legacy core is production truth | UNVERIFIED |
| 5 | Daily fees, wallet, cashier | 05 + tests | **Strongest business logic; pinned by regression tests** | UNVERIFIED |
| 6 | Invoices & accounting | 05 | 4 accounting generations; Hubtel collection hardened | UNVERIFIED |
| 7 | Payroll & Hubtel payout | 06 | **Strongest subsystem; server-authoritative payout state** | UNVERIFIED |
| 8 | Library, inventory, ops | 06 | Inventory rich; library minimal | UNVERIFIED |
| 9 | Communications & SMS | 06 | Hubtel-only live; 3 overlapping generations | UNVERIFIED |
| 10 | Settings & branding | 06 | Flat key/value, works | UNVERIFIED |
| 11 | Sync/offline | sync-gap-analysis.md | Gen1 direct-DB solid; Gen2 API prototype now hardened | UNVERIFIED |
| 12 | Reports & exports | 01–06 | Print/CSV heavy, per-page | UNVERIFIED |

## 1. Identity / RBAC / profiles

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| A1 | 6 separate credential tables (admin/teacher/student/parent/accountant/librarian), bcrypt `password` + 5-char `authentication_key` + `block_limit` | VLB | 01 §2; Login.php |
| A2 | Login: AJAX key oracle → email/username+password+key → sets `<role>_login`, `<role>_id`, `login_type`, `login_user_id` (+`level`,`user_type` for admin) | VLB | 01 §3 |
| A3 | Cashier = `admin.level` 4; Conductor = `admin.level` 5; HOD = teacher with `hod_subjects` rows | VLB | 01 §2 |
| A4 | Granular `user_permissions`+`permission_modules` engine with audit trail exists but is consumed by only 2 controllers | VLB | 01 §5 |
| A5 | Record-ownership scoping in Parents/Student/Admin constructors, fail-closed 403 | VLB | 01 §5; portal-record-ownership.test.js |
| A6 | DB sessions (ci_sessions, 2h), secure+httponly cookies, forced HTTPS, nosniff/HSTS; CSRF token named `agbotah_essuon`, excluded for `api.*` and `sync/push|pull` | VLB | 01 §6 |
| A7 | iEduPro replaces 6 tables with unified `users` + tenant-scoped RBAC (roles/permissions tables) | TAR | 01 §13 |
| A8 | Anonymous self-service `block_account` endpoint, plaintext API auth on `flutter_user` (Api.php:94-147), SHA-1 `Mobile::login`, password printed on reset-SMS failure, no server lockout/session rotation | IRLD | 01 §4; must NOT be ported; replaced by tokenized reset + lockout + rotation |
| A9 | Dead surfaces: Employee portal session flags never set, `Bus_conductor.php` dead charge path, per-method-only gating in Driver.php | IRLD | 01 §2; 03 §6 |

## 2. Admission / students / parents / enrollment

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| S1 | Admission = Admin::student/create: student insert → enroll (year+term; `sem` if class name == 'JHSS') → guardian denorm write-back → invoice batch `MAX(invoice_code)+1` → discount profiles → admission_logs + ledger sync; **not transactional** | VLB | 02 §3 |
| S2 | Student code: `settings.student_code_prefix`+format, string-sorted MAX+1 with zero-pad, year rollover resets to YYYY001; logic duplicated in 3 places | VLB | 02 §4 |
| S3 | Single guardian per student: `student.parent_id` FK; family command-center dashboard for parents; transcripts fee-blocked when in debt | VLB | 02 §6 |
| S4 | `enroll` = per year+term (or sem) grain, **no unique key**, `mute` 0/1/2(graduated); promotion (term 3) inserts next-year enroll rows copying boarding/transport, first section only | VLB | 02 §7 |
| S5 | Class move re-points 7 tables and rebuilds invoices; graduation → `alumni` | VLB | 02 §7 |
| S6 | iEduPro: admissions must be transactional (outbox/unit-of-work), enrollment needs unique (student, year, term) key, admission number generation centralized | TAR | 02 §13 |
| S7 | Hard delete of student cascades financial destruction across 16 tables | IRLD | 02 §8; replaced by soft-delete/archive + financial-preservation guards |
| S8 | Magic class-name strings ('JHSS' for semester, 'CRECHE') drive behavior | IRLD | 02 §8; 04 §3; replaced by explicit class/category attributes |

## 3. Attendance & transport

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| T1 | Attendance statuses 0–6: 1=Present, 2=Absent, 3=Late, 4=Sick-Home, 5=Sick-Clinic, 6=Excused (API-only, stores `permission_reason`); **Late charges like Present** | VLB | 03 §2; attendance-status-contract.test.js |
| T2 | Teacher scope guard `class.teacher_id == login_user_id` enforced before data load and before fee persistence | VLB | 03 §2 |
| T3 | No edit window; backdating allowed; correctness via charge-log delete/replay | VLB | 03 §2 |
| T4 | `status ∈ {1,3}` triggers `Daily_fee_model::process_daily_charges`; order feeding→breakfast→classes→water(weekly Mon–Sun)→transport(in/out=fare, both=2×); reversal on present→absent is arrears-first→prepaid, keeps payment as prepaid, resets payment_status | VLB | 03 §3; Daily_fee_model.php:387-761 |
| T5 | Bus attendance: one `bus_attendance` row/student/day; per-leg fare (IN charges, OUT charges again, both=2×); direction change reverses prior `amount_charged`; `none` reverses+zeros | VLB | 03 §4; Daily_fee_model.php:2398-2595 |
| T6 | Revenue recognition on charge: JE-REV-* journal entries, DR 2040 (prepaid)/1200 (arrears) → CR 4200–4240 | VLB | 03 §3; 05 §5 |
| T7 | `set_choice_and_collect` upserts `bus_attendance`='paid' without wallet deduction (choice+collection recorded separately) | VLB (quirk) | 03 §5 |
| T8 | Auto-billing per-day (present+boarded+unpaid→bill) exists but unwired (no cron) | VLB | 03 §5 |
| T9 | iEduPro: attendance + bus IN/OUT are offline-first mobile flows with business-key idempotency (student, date[, leg]) | TAR | 03 §10 |
| T10 | `Attendance_enterprise::save()` broken (1-arg call vs 4-arg signature); offline JS queues to nonexistent `attendance_enterprise/sync`; `Attendance::sync()` fake success; `attendance_sync_method.php` REPLACE-by-client-PK unrouted | IRLD | 03 §7; replaced by Gen2 api/Sync path |

## 4. Exams, grading, report cards

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| E1 | Marks split: CA 20+10+20+10=60 → `class_score = sub_total×50/60`; `exam_score = term_exam/2`; total = CA50+Exam50 — **computed client-side only**; server floatvals only | VLB (quirk) | 04 §3; Admin.php:9845-9858; must move server-side in iEduPro (TAR) |
| E2 | Positions: dense ranking (ties → 1,2,2,3) with ordinals, in Crud_model.php:593-1107 (3 copies); enterprise Result_processor uses sequential numbering instead | VLB | 04 §3 |
| E3 | JHS/WAEC raw-score mode: global `settings.raw_score` + class name `JHSS`; aggregate = grade points of 4 core + best-2 electives from `raw_score_grade` | VLB | 04 §4 |
| E4 | Grades from DB tables: `grade` vs `grade_2` chosen by `terminal_report_style`; GPA = mean of `grade_point_numeric`; CGPA math inconsistent in cummulative_reports.php:1060-1067 | VLB | 04 §4 |
| E5 | KG/Creche: purely descriptive grades (`grade_creche`), stored as `mark.test1` grade_id; Primary/JHS numeric; WAEC seed A1 80-100 … F9 0-39 | VLB | 04 §5; Setup_examination.php:63-78 |
| E6 | Head-teacher remarks: percentage-range engine (`head_teacher_remarks_ranges`, inclusive bounds, overlap checker, 5 seeded defaults); teacher remark templates positive/neutral/negative; conduct in `aggregation.c1…c15` | VLB | 04 §6 |
| E7 | Online exams: exact-JSON-match auto-scoring (no partial credit), 7-char md5 codes, **fee-arrears gate** on taking exams, ownership-guarded via Teacher_online_exam controller + routes | VLB | 04 §7 |
| E8 | Report-card verification: public route `verify/{code}/{exam}/{year}` (unsigned/guessable QR — retire) | VLB/IRLD | 04 §8 |
| E9 | iEduPro: single grading engine, per-level scale registry (KG descriptive / primary / JHS-WAEC), server-side mark computation, deterministic position ranking | TAR | 04 §10 |
| E10 | Unbracketed OR bug leaking exams across years; "to be deleted" aggregate-corruption block; runtime DDL in controller; `enroll.status='close'` side effect | IRLD | 04 §9 |

## 5. Daily fees, wallet, cashier (Ghana core) — pinned by tests

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| F1 | Wallet = `daily_fee_wallet` per student, 5 components × {prepaid balance, arrears}: feeding, breakfast, classes, water, transport | VLB | 05 §2; tests/daily-fee-wallet-semantics.test.js |
| F2 | Charge chain on attendance: feeding (mandatory) → breakfast (optional, subscription-gated) → classes (mandatory) → water (weekly, Monday start, first attendance) → transport (per-leg) | VLB | tests/daily-fee-wallet-semantics.test.js; Daily_fee_model.php:387-661 |
| F3 | Idempotency: `daily_charge_log` (student_id, charge_date); skip if feeding OR classes already charged; separate transport skip guard | VLB | Daily_fee_model.php:391-411 |
| F4 | apply_charge: balance≥amount → full deduct (paid); 0<balance<amount → prepaid used + rest arrears (partial); else full arrears (unpaid) | VLB | Daily_fee_model.php:666-713 |
| F5 | Smart allocation (cashier POS): single amount → arrears settled first in priority **feeding → classes → breakfast → water → transport**; excess → chosen prepaid wallet (default feeding); payment_type=mixed | VLB | daily_fee_collection.php:17-18, 235-269; tests |
| F6 | apply_payment by type: advance → 100% prepaid; arrears/mixed → clear arrears first, remainder prepaid | VLB | Daily_fee_model.php:1631-1676 |
| F7 | reverse_charge: arrears-first reduction, remainder to balance | VLB | Daily_fee_model.php:718-754 |
| F8 | Retroactive opt-in: cashier toggling breakfast/water on after attendance → retro charge only if attendance row exists (attendance is source of truth); opt-out → retro reversal (update_payment path) | VLB | Daily_fee_model.php:761+, 1466-1611 |
| F9 | Collection boundaries: conductor → transport only; teacher → teacher_fee_collection_mode (restricted/selective/all_allowed) × daily_fee_collection_mode (cashier mode → attendance_portal only); admin → `can_collect_daily_fees=1` + portal-mode gate (cashier mode forbids attendance_portal; classroom mode forbids cashier_portal; hybrid allows) | VLB | Daily_fee_model.php:31-136 |
| F10 | Transactions: `DFT`+date+md5 code, per-fee amounts + total, payment_type, payment_method, collection_point, collected_by, receipt_number (`DFR`+date+student+time), year/term/residence_type snapshot | VLB | Daily_fee_model.php:1415-1459 |
| F11 | Every wallet mutation → `daily_fee_audit_log` (charge / charge_reversal / payment) | VLB | Daily_fee_model.php log_audit calls |
| F12 | Rates per class/year/term via `daily_fee_rates` + module toggles `is_fee_module_enabled()`; student preferences `student_daily_fee_preferences` (auto_deduct_enabled, breakfast_subscribed, water_subscribed) | VLB | Daily_fee_model.php:337-386 |
| F13 | Wallet reconciliation: `recalculate_wallet_from_date` event replay (state-before + replay payments/charges/topups) | VLB | Daily_fee_model.php:1702-1928 |
| F14 | iEduPro: same wallet algebra + allocation as a **server-side domain service** (never client-computed), money as integer pesewas/DECIMAL, per-tenant module toggles | TAR | 05 §13 |
| F15 | iEduPro: ₵ (GHS) default presentation unless tenant config overrides | TAR | handoff; 05 §11 |

## 6. Invoices & accounting

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| I1 | `invoice` = line-item rows per student/term grouped by bigint `invoice_code` (MAX+1 + leading-zero padding); batch billing not transactional; re-billing hard-deletes unpaid rows and bakes discounts into gross | VLB (quirk) | 05 §3 |
| I2 | Payment capture: FIFO allocation across owing items, overpayment → `student_credits`, auto-lock paid invoices (`invoice_lock_helper`); hardened modification workflow (POST-only, FOR UPDATE, no identity change on paid items) | VLB | 05 §3; Admin.php:14580-15014, 38924-39110 |
| I3 | Discounts: 3 generations; only profile system alive (approval = `admin.level==1`, 24h validity for super-admin modification); G2 models join non-existent tables | VLB/IRLD | 05 §4 |
| I4 | Accounting: 4 generations (cashbook accounts+general_journal; chart_of_accounts+journal_entries/_lines; student_ledger; expenses_enhanced/budgets/bank_*) | VLB (quirk) | 05 §5 |
| I5 | COA seed 1010/1020/1030/1200/2010/4060/4200-4240/4900/5100; **2040 missing from seed → JE-PREPAY fatals on fresh DB** | VLB (defect) | 05 §5 |
| I6 | JE number formats: JE-INV/PREPAY/REVENUE/REV/REFUND/PURCHASE-* + JE-{Ym}-####; no uniqueness constraint | VLB (quirk) | 05 §5 |
| I7 | Hubtel collection: HMAC-SHA256 reference-bound callback token, FOR UPDATE idempotent settle, amount re-validation, ledger write in-transaction — **the pattern to port**; but never posts a journal entry | VLB | 05 §8; hubtel-collection-safety.test.js |
| I8 | PayPal/Stripe models mark invoices paid with zero verification (retired at controller level, HTTP 410) | IRLD | 05 §8 |
| I9 | Budget-vs-actual non-functional (join on wrong keys); bank-rec 'reviewed' status unreachable; expense approval lacks self-approval guard | IRLD (fix in target) | 05 §6-7 |
| I10 | Public invoice tokens: 7-day reusable tokens rendered through admin partial | VLB (quirk) | 05 §9 |
| I11 | iEduPro: single ledger (double-entry, DECIMAL, append-only JE with unique sequence), idempotent gateway callbacks (Hubtel pattern), invoice locking, transactional billing | TAR | 05 §13 |

## 7. Payroll & Hubtel payout

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| P1 | Server-authoritative state machine: draft → pending_approval → approved → **paid only via Hubtel provider callback** (`mark_payroll_paid_from_provider`); direct mark_as_paid blocked; pinned by 3 test files | VLB | 06 §2; hubtel-payroll-payout.test.js; payroll-state-lifecycle.test.js; payroll-hubtel-ui-authority.test.js |
| P2 | GRA progressive PAYE (Tax_calculator; DB `tax_brackets` + Ghana-2024 fallback 0/5/10/17.5/25/30/35%); SSNIT Tier1 employer / Tier2 employee on basic salary; per-row rate snapshots | VLB | 06 §2 |
| P3 | Immutable payroll audit table with anti-tamper triggers; dedicated outbound payout ledger `payroll_payout_transactions` isolated from fee collections; 4-way callback binding | VLB | 06 §2 |
| P4 | Batch payroll trusts client-computed totals (must become server-side in iEduPro); month as name string, no unique key; schema default status='paid' | VLB (quirk) | 06 §2 |
| P5 | iEduPro: payroll engine server-computed, statutory calculators versioned, payout ledger per tenant | TAR | 06 §12 |

## 8. Library / inventory / ops

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| L1 | Library = catalogue + request accept/reject with copy counters; no fines/returns/due dates/member limits | VLB | 06 §4 |
| L2 | Inventory: POS, stock movements, returns validation, supplier payables, POs auto-receive on create with financial-hook expense integration; weighted-average costing retained but bypassed | VLB | 06 §5 |
| L3 | Dining coupons = ephemeral print sheets; eligibility derived from daily-fee ledgers; no redemption ledger | VLB | 06 §6 |
| L4 | Boarding hierarchy writes `student_residence` (absent from schema dump); insurance is vehicle-only (`v_car_insurance`/`v_vehicle` missing from dump) | VLB | 06 §7-8 |
| L5 | Visitor tracker dormant (Iptracker never loaded) | IRLD | 06 §9 |

## 9. Communications & SMS

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| C1 | Runtime SMS = Hubtel only; live subsystem `sms_automations`; unwired `sms_templates`/`sms_schedules`; broken Payment_sms_automation (calls nonexistent `sms_sender`); dead Twilio/hubtel-sms-api SDKs | VLB/IRLD | 06 §10 |
| C2 | daily_fee_alerts_helper sends arrears/low-balance alerts; notification preferences per user exist | VLB | 06 §10 |
| C3 | Email_model hardcodes SMTP password in source (rotate + env in target); `send_sms_password_reset` has fatal `$correct_name` bug | IRLD | 06 §10 |
| C4 | Noticeboard/message/group_message_other tables (MyISAM) power messaging | VLB | 06 §10 |

## 10. Settings & branding

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| ST1 | Flat key/value `settings` (~35 writable keys: running_year/term/sem, system_name, currency, student_code_prefix+format, raw_score, terminal_report_style, daily_fee_collection_mode, teacher_fee_collection_mode, skin…) | VLB | 06 §11 |
| ST2 | `settings_audit` table has no writer; Setting_model targets nonexistent `sch_settings`; skin switch inert; get_phrase() doesn't translate (English-only in practice) | VLB (quirk) | 06 §11 |
| ST3 | iEduPro: settings become typed, tenant-scoped configuration with audit trail | TAR | 06 §12 |

## 11. Sync / offline (bridging legacy → iEduPro Flutter)

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| Y1 | Gen1 direct DB↔DB sync (Sync_server, 6541 lines): priority-ordered tables, FK-safe upsert (no REPLACE), natural-key matching, tombstones (`sync_deletions`), conflicts UI, retries with backoff, table validation | VLB | sync-gap-analysis.md §1 |
| Y2 | Gen2 device-token API (api/Sync): X-API-Key gate, SHA-256 device token hashes (`hash_equals`), FK-safe batch upsert (2026-10-10), client DELETE fail-closed (tombstone safety), static allowlist (5 offline tables + aliases) | VLB | sync-gap-analysis.md §2/§8; sync-*.test.js |
| Y3 | Sync auth exclusion in CSRF: `sync/push`, `sync/pull` (+ `api.*`) bypass CSRF — token-verified device path | VLB | 01 §6 |
| Y4 | No `sync_uuid`, no server change cursor, timestamp-only LWW — exactly the gap the iEduPro contract (outbox + server change feed + mutation receipts) must close | TAR | sync-gap-analysis.md §3; ZAI_IMPLEMENTATION_BRIEF.md |
| Y5 | Rollout order: read-only shell → attendance → daily fees → admissions → marks → others; accounting/payroll last | TAR | sync-gap-analysis.md §7 |
| Y6 | Browser offline JS fragmentation (8+ modules, 6-store IndexedDB, 28-line service worker) | IRLD | sync-gap-analysis.md §1; replaced by Flutter/offline architecture + unified storage |

## 12. Reports & exports

| ID | Behavior | Class | Evidence |
|----|----------|-------|----------|
| R1 | CSV/PDF/print flows per page (export_helper, report_display_helper, Pdf.php); print views must remain byte-stable | VLB | 01–06 |
| R2 | Advanced_reports + Advanced_reporting library; cash-flow report returns empty skeleton | VLB (quirk) | 05 §10 |
| R3 | iEduPro: report catalogue parity list per domain in audit docs; print fidelity is acceptance criterion | TAR | per-domain docs |

## 13. Money presentation & currency

- ₵ / `GH₵` from settings string + ICU formatter + hard-coded `GH₵` literals in places (VLB; 05 §11) → iEduPro TAR: single currency formatter, tenant currency default GHS, pesewas-integer math.
- Money columns are DOUBLE in legacy (VLB; 05 §12) → TAR: DECIMAL/integer in PostgreSQL.

## 14. Data migration map (legacy MySQL → iEduPro PostgreSQL)

| Legacy | Target entity | Transformation notes |
|--------|---------------|----------------------|
| admin/teacher/student/parent/accountant/librarian | users + roles + staff/student/parent profiles | merge 6 tables; bcrypt hashes carry over; level→role mapping (4=cashier, 5=conductor); authentication_key retired |
| enroll | enrollments | add unique (student, year, term); `mute=2` → graduated status |
| invoice (+payment) | invoices / invoice_lines / payments | group line rows by invoice_code; preserve FIFO allocation history; lock states |
| daily_fee_wallet / daily_fee_transactions / daily_charge_log / daily_fee_audit_log | wallet accounts + wallet mutations + charge ledger | replay-invariant: audit log must reconcile to wallet balances per student before cutover |
| accounts / general_journal / chart_of_accounts / journal_entries(+lines) | single double-entry ledger | merge 4 generations; re-map COA codes (add 2040); JE renumber with unique sequence |
| attendance / bus_attendance / daily_transport_choices / transport_daily_log | attendance + transport legs | statuses 0-6 preserved; per-leg fare semantics preserved |
| exam / mark / aggregation / grade / grade_2 / grade_creche / raw_score_grade | assessments + marks + grading scales | per-level scale registry; recompute positions server-side with dense ranking |
| payroll + tax_brackets + payroll_approvals + payroll_payout_transactions | payroll runs + statutory rules + payouts | rate snapshots preserved; state machine preserved |
| settings | tenant_settings (typed) | key→typed column mapping documented in 06 §11 |
| sms_automations | communication automations | Hubtel gateway adapter |

## 15. Test evidence inventory (legacy side)

| Test file | What it pins |
|-----------|--------------|
| tests/daily-fee-wallet-semantics.test.js (**new in this pack**) | F1–F15: wallet algebra, charge order, idempotency, weekly water, per-leg transport, smart allocation order, collection boundaries, retroactive toggles, audit logging, transaction snapshots |
| tests/cashier-cash-change-helper.test.js | cash tender vs amount-to-apply separation, change computation, short-tender block |
| tests/hubtel-collection-safety.test.js / hubtel-payroll-payout.test.js / payroll-state-lifecycle.test.js / payroll-hubtel-ui-authority.test.js | I7, P1: gateway callback safety, server-authoritative payout state |
| tests/role-controller-auth-boundaries.test.js / admin-cross-role-boundary.test.js / portal-record-ownership.test.js | A5: role/record boundaries |
| tests/attendance-status-contract.test.js | T1 statuses |
| tests/sync-*.test.js (9 files) | Y2: device auth, batch upsert, delete guard, allowlists |
| tests/student-*.test.js, tests/parent-dashboard-command-center.test.js | S3: profile/family dashboards |
| tests/teacher-online-exam-*.test.js (5 files) | E7 |
| PHP behavior tests (tests/*_behavior_test.php) | sync batch upsert, delete guard, device lifecycle, legacy registration, Hubtel collection callback, payment gateway surface, private file storage |

CI: 50 workflow files under `.github/workflows/` (per-contract gates + main ci.yml: PHP syntax, secret scan, no-production-data, JS syntax, CSS sanity). **New gate added in this pack:** `daily-fee-wallet-semantics.yml`. No existing gate weakened.

## 16. Open questions for iEduPro side (to resolve with repo access)

1. Which of F1–F15 already exist in iEduPro's daily-fee domain service, and with what deviations (especially allocation priority order)?
2. Does iEduPro have the 5-component wallet or a generalized ledger? (Architecture may generalize; behavior must still distinguish arrears vs prepaid per fee item — handoff: "arrears tracked by fee item".)
3. Multi-tenant mapping: are SchoolManager's single-school globals (running_year/term) per-tenant academic sessions?
4. Which sync contract phase is implemented in the Flutter client (Y4/Y5)?
5. Does the iEduPro RBAC cover teacher/cashier/conductor collection boundaries (F9) natively?
