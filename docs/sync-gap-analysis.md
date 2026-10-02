# Sync Gap Analysis — SchoolManager Bidirectional Sync Audit

Wave 0 deliverable. Generated 2026-10-03 from `main` @ `249ff7a`.
Sources: CI3 source audit + `schema/schoolmanager_schema_redacted.sql` (authoritative, 2026-10-02)
+ `docs/SCHEMA_AUDIT.md` + `docs/ZAI_MODERNIZATION_PROMPT.md`.

---

## 1. Discovered sync architecture (three coexisting generations)

The codebase contains **two distinct server-side sync generations plus a fragmented client-side
offline layer**. This is the single most important fact for all future sync work: there is no
single sync contract today.

### Generation 1 — direct DB-to-DB (ACTIVE, primary)
`application/controllers/Sync_server.php` (6,541 lines) + `Sync_locations.php` (461) +
`Sync_config.php`, `Sync_audit.php`, `Sync_conflicts.php`, `Sync_setup.php` (server UI).

- Topology: local school MySQL ↔ remote cloud MySQL, direct connection via `get_remote_db()`
  using credentials stored server-side (`sync_locations` table / settings).
- Auth: CI admin session (`check_auth()`), AJAX-aware JSON 401 responses.
- Push/pull: table-by-table, priority-ordered via `sync_metadata` (`get_sync_order()`:
  admin→teacher→class→section→subject→student→parent→enroll→discounts→invoice→payment→
  daily_fee_wallet→daily_fee_transactions→attendance→exam→exam_marks→grade).
- **FK-safe upsert**: `insert_or_update_remote()` (line 4117) deliberately avoids `REPLACE INTO`
  ("avoids foreign key constraint errors that occur with REPLACE INTO").
- Natural-key matching (`find_by_natural_key`) when integer IDs collide.
- Deletions: `sync_deletions` table + `apply_remote_deletions()` + retention cleanup
  (`cleanup_synced_deletions()`) — tombstone-style, Gen1 already implements the contract's §6.
- Conflicts: `detect_push_conflict` / `detect_pull_conflict` → `sync_conflicts` with UI.
- Failure handling: `sync_failures`, retry with backoff, error typing, record-level logging.
- Progress: settings-based progress tracking with AJAX polling.
- Table management UI: toggle per table, bulk toggle, add/remove sync columns,
  `mark_all_as_synced()` recovery path.
- Table/column validation: `validate_table_name()` (information_schema existence check),
  `validate_column_names()` (throws on unknown column).

### Generation 2 — device-token HTTP API (PROTOTYPE, partially wired)
`application/controllers/api/Sync.php` (333 lines) + `models/Sync_model.php` (177) +
`libraries/Sync_manager.php` (185) + `libraries/Sync_service.php` (655) +
`libraries/Realtime_sync.php` (427) + `libraries/Offline_sync.php` (101) +
`libraries/Conflict_resolver.php` (564).

- Auth concept: `X-Device-ID` + `X-Auth-Token` headers → `Sync_model::verify_device()`.
- `batch_push()`: transactional batch, but uses `$this->db->replace()` — **the REPLACE INTO path
  the contract explicitly forbids going forward** (§9).
- `Sync::cache_data()` (`controllers/Sync.php`): **auth deliberately skipped**
  ("Skip auth check for now"); small allowlist map (student/teacher/class/invoice/payment),
  returns raw rows — PII/financial exposure if reachable in production.
- `Sync_model::get_changes_since()`: timestamp-only pull (`last_modified_at > last_sync`,
  `device_id !=`), the exact pattern the contract calls unsafe (clock skew, equal timestamps).

### Client-side offline layer (FRAGMENTED)
`assets/js/`: `offline-db.js` (IndexedDB, db `schoolmanager_offline`, 6 stores:
students/teachers/classes/invoices/payments/sync_queue), `offline-sync.js`, `offline-sync-client.js`,
`offline-crud.js`, `sync-manager.js`, `simple-offline-detector.js`, `attendance_offline.js`,
`finance_offline.js`, `complete_sync.js`, `enterprise_sync.js`, `sync-monitor.js`,
`sync-modern-ui.js`, `sync-helpers.js`, `service-worker.js` (28 lines, caches 3 URLs, cache-first).

## 2. Critical security gaps (highest priority)

| # | Gap | Evidence | Required fix (contract ref) |
|---|-----|----------|------------------------------|
| S1 | Device token never verified | `Sync_model::verify_device()` queries `sync_devices` by device_id + ACTIVE only; `$auth_token` unused; `register_device()` returns a token it never stores | §11 device security |
| S2 | Unauthenticated data endpoint | `controllers/Sync.php::cache_data()` — auth commented out; dumps student/invoice/payment rows | Security cleanup; §11 |
| S3 | No table allowlist in Gen2 paths | `Sync_model::process_push_item()`, `Sync_manager::process_sync_data()` insert/update/delete arbitrary client-named tables; Gen1 `validate_table_name()` only checks existence, not sync-enabled status | Dynamic table safety; §3 |
| S4 | REPLACE semantics | `api/Sync.php::process_batch_record()` uses `$this->db->replace()` | §9 |
| S5 | Hard deletes via API | `Sync_model::process_push_item()` `DELETE FROM` on client instruction — no tombstone | §6 |
| S6 | Remote DB credentials on client path | Gen1 `sync_locations` stores remote DB credentials used by web-server-side sync (acceptable server-side); risk arises if this model is copied to browser flows. Contract target is API-mediated sync | §1 |

## 3. Contract-vs-reality matrix

| Required capability (prompt §) | Status | Detail |
|---|---|---|
| 1. API-mediated topology | PARTIAL | Gen1 is direct DB→DB (server-side only). Gen2 API prototype exists but broken auth |
| 2. Stable cross-device identity (`sync_uuid`) | MISSING | 0/282 tables have `sync_uuid`. All sync keyed on auto-increment integers + natural keys |
| 3. Consistent metadata | PARTIAL | 94 tables `sync_status`; 93 `version`+`last_modified_at`; 92 `last_modified_by`; 96 `device_id`; **2 `sync_operation_type`**; 6 `deleted_at/is_deleted`; `employee` (and others) have none |
| 4. Server-controlled versioning | MISSING | No base-version compare-and-increment anywhere; Gen1 uses natural keys + timestamps; Gen2 timestamp LWW |
| 5. Monotonic change cursor | MISSING | All pulls are `last_modified_at >` style; no `sync_change_log`/change_seq; per-device cursor only as `last_sync_at` timestamps in `sync_devices` |
| 6. Deletion propagation | PARTIAL (Gen1) / MISSING (Gen2) | Gen1: `sync_deletions` + apply/cleanup. Gen2: hard `DELETE` |
| 7. Idempotency keys | MISSING | No mutation receipts; retry-duplication guarded only by natural-key checks in Gen1 |
| 8. Domain conflict policies | WEAK | Single `conflict_resolution` strategy from `sync_config` (timestamp/server_wins/client_wins); no per-domain policy; financial append-only not enforced |
| 9. No REPLACE upserts | VIOLATED (Gen2) | Gen1 already implements correct insert-or-update; Gen2 `batch_push` regressed |
| 10. MyISAM audit | DONE (see §4) | 25 MyISAM tables; several are sync participants |
| 11. Device security | BROKEN | S1 + no rotation/revocation UI, no token hashes, tokens returned in API responses |
| 12. Browser offline UX | FRAGMENTED | Multiple overlapping JS modules; SW caches 3 URLs; no unified outbox/state store; offline banner exists in scattered forms |
| 13. Attachment sync | MISSING | No content-hash/upload-token protocol |
| 14. Referential ordering | PARTIAL | Gen1 `get_sync_order()` (priority-based, correct core ordering); pull batching not dependency-grouped |
| 15. Offline test suite | MISSING | Only `Test_sync.php`, `Test_sync_driver.php`, `Test_locations.php` manual controllers exist |

## 4. Table classification matrix (from authoritative schema)

282 tables: 243 InnoDB, 25 MyISAM, 14 unspecified engine.

| Class | Count | Sync readiness |
|---|---|---|
| sync-infrastructure (`sync_*`) | 12 | devices, queue, failures, conflicts, audit_log, log, metadata, metrics, notifications, settings, config, deletions |
| mutable master/transactional | 86 | Core 17 (student, teacher, admin, class, section, subject, enroll, invoice, payment, attendance, exam, exam_marks, grade, daily_fee_transactions, daily_fee_wallet, etc.) have full metadata (status/version/lmt/device_id) **but no `sync_uuid`, no `deleted_at`** |
| append-only/audit | 34 | includes settings_audit, *_audit/_log tables |
| derived/cache | 10 | includes 2 dumped view-like objects (`v_discount_audit_summary`, `v_invoice_discounts_detailed`) — must not be synced as tables |
| reference/settings | 4+ | includes `settings` itself |
| other/needs-review | 136 | long tail incl. `employee` (**zero sync metadata**) |

### MyISAM migration-risk report (25 tables)
CRITICAL (sync-participating or financial, transactional writes occur):
- `parent` — core mutable master with sync metadata; family/relationship writes
- `settings` — constantly updated; already synced (audit trigger present)
- `transport` — billing participation
- `mobile_money_payment` — financial transactions (24 cols)
- `incomplete_fee_transactions` — financial
- `noticeboard`, `message`, `group_message_other` — communications
- `exam_category` — exam setup
- `sems`, `terms` — academic calendar
- `accounts`, `accounts_payable` — accounting
- `portfolio_assessment` — assessment data
HIGH:
- `invoice_access_tokens`, `invoice_sms_log`, `visitor_tracker`, `document`, `language`,
  `flutter_user`, `boarding_bed`, `dormitory`, `account_type`, `v_discount_audit_summary`,
  `v_invoice_discounts_detailed`

**Action**: phase-gated InnoDB conversions (migration scripts, EXPLAIN before/after, backup/rollback),
starting with `parent` and `settings`; never mass-convert. The 2 `v_*` objects need classification
as views, excluded from sync.

## 5. Index / query hot-spot report (sync queries)

Observed access patterns without supporting indexes (to verify with EXPLAIN on staging):
1. `get_changes_since`-style pulls: `WHERE last_modified_at > ? AND device_id != ?` over full tables —
   needs composite `(sync_status, last_modified_at)` or a change-log cursor instead (preferred).
2. `sync_queue` polling: `WHERE synced = 0 ORDER BY timestamp ASC LIMIT n` — needs `(synced, timestamp)`.
3. `sync_failures` retry scans: `WHERE status = 'FAILED' AND retry_count < max` — needs `(table_name, status, retry_count)`.
4. `sync_deletions`: `WHERE status = 'PENDING' GROUP BY table_name` — needs `(status, table_name)`.
5. Natural-key lookups (`find_by_natural_key`) — verify per-table uniqueness indexes exist.

No index will be added without an EXPLAIN proof per the query-optimization rules.

## 6. Migration proposals to design (NOT to apply yet)

1. `sync_uuid CHAR(36) UNIQUE` — phase-gated: attendance + daily fees first (offline-critical), then
   students/invoices, then masters.
2. `sync_change_log (change_seq BIGINT AUTO_INCREMENT, table_name, sync_uuid, operation, version,
   changed_at UTC, device_id)` + per-device cursor table.
3. `sync_mutation_receipts (mutation_uuid UNIQUE, device_id, status, request_hash, response,
   received_at)` — idempotency ledger.
4. Version-checked UPDATE pattern: `UPDATE t SET ..., version = version + 1 WHERE pk = ?
   AND version = ?` → 0 rows = stale = conflict.
5. Tombstone unification: extend Gen1 `sync_deletions` as the single tombstone source; Gen2 hard
   delete path must be removed when auth is fixed.
6. Selective MyISAM → InnoDB (report first per table).
7. `employee` (+ rest of long tail) metadata decision matrix: sync-opt-in vs local-only per table.

## 7. Rollout order (per implementation brief)

1. Read-only offline shell/reference data
2. Attendance (with business-key idempotency)
3. Daily fees/collections (after accounting tests)
4. Admissions/student records
5. Exam marks
6. Others; accounting/payroll last

## 8. Immediate hardening backlog (ordered)

| Priority | Item | Risk if unfixed | Status |
|---|---|---|---|
| P0 | Re-enable auth on `Sync::cache_data()` (smallest compatible fix; code already exists commented) | Public PII/finance exposure | **DONE 2026-10-03** — session auth via correct keys (login_type/login_user_id) |
| P0 | Make `verify_device()` actually verify the token (store hash at enrollment; keep response shape) | Device impersonation | **PARTIALLY DONE** — global X-API-Key gate added to api/Sync (fail-closed); full token verification blocked on missing schema column (migration proposal §6.6) |
| P1 | Replace `db->replace()` in `api/Sync.php::batch_push()` with Gen1-style insert-or-update | Silent FK/audit damage | OPEN — scheduled for sync-contract PR (now guarded by API key + allowlist) |
| P1 | Enforce server-side allowlist (sync_metadata sync_enabled=1) in all client-driven write paths | Arbitrary table writes | **DONE 2026-10-03** — static allowlist (5 offline tables + plural aliases) on Sync::push, api/Sync::push/batch_push/pull; metadata-driven allowlist deferred to sync-contract PR |
| P2 | Kill or feature-flag Gen2 hard-delete path in favor of tombstones | Data loss across devices | OPEN |
| P2 | Consolidate client offline JS into one versioned storage abstraction | Race conditions, double queues | OPEN |

Also fixed 2026-10-03: `Sync::pull()` session-key bug (`user_id` never set by this app → used `login_user_id`), and `Sync::complete()` now requires an authenticated session.

Each item ships behind tests; per the brief, propose → test → merge. No broad schema change yet.

## 9. Test suite to build (Wave 9 but designed now)

The 20 mandatory scenarios from `docs/ZAI_MODERNIZATION_PROMPT.md` §15 (offline create/update/delete,
two-device edits, stale versions, duplicate retries, mid-batch network drop, clock skew, ID
collision, parent/child offline creation, duplicate attendance/payment, concurrent settlement,
conflict resolution modes, blocked device, attachment resume, cursor resume, 10k queue,
post-sync checksums) will be automated against a staging database built from
`schema/schoolmanager_schema_redacted.sql` + representative non-sensitive fixtures.
