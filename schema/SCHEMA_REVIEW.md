# SchoolManager Schema & Offline Sync Review

## Source and safety

This review was produced from the supplied MySQL 8.4-era production dump. The production dump included real application data, so the raw dump must **not** be committed. Use the structure-only template in this folder and create migrations from the live schema only through controlled, redacted tooling.

## Structural snapshot

Automated structure parsing found approximately:
- 268 `CREATE TABLE` definitions
- 243 InnoDB definitions
- 25 MyISAM definitions
- 112 tables with a legacy `sync` flag
- 94 with `sync_status`
- 93 with `last_modified_at`
- 96 with `device_id`
- 93 with `version`
- 91 with the full common set of sync status / modified / device / version / retry / error metadata
- 174 without `sync_status`

This means the schema is **partially prepared for synchronization, not uniformly sync-safe**.

Existing sync-related structures include devices, metadata, queue, conflicts, deletions/tombstones, failures, audit logs, metrics/settings and notifications. Existing code also contains sync services/controllers and browser IndexedDB/service-worker logic. Consolidate what exists rather than creating a second independent system.

## High-priority findings

### 1. MyISAM on writable/sync-relevant tables

The dump contains 25 MyISAM definitions, including legacy accounting/reference/parent/transport/message-related objects. A transaction in CI/MySQL cannot roll back MyISAM writes atomically.

Action:
- classify each as BASE TABLE vs dumped view artifact
- identify which are actually written by sync-enabled workflows
- convert only compatible, writable sync-critical base tables to InnoDB through tested migrations
- verify indexes, auto-increment, row counts and application queries before/after

Do not mass-convert blindly.

### 2. Sync metadata coverage is inconsistent

Many tables have only `sync='yes/no'`, while a smaller subset has version/device/status/error fields. The existing stored procedure that adds `sync_operation_type` only acts on tables that already have `sync_status`, and the final dump does not show that field uniformly.

Action:
- create one authoritative sync registry
- opt tables in explicitly
- validate required columns/indexes before enabling a table
- no runtime “ALTER every table” behavior in normal requests

### 3. Queue contract must be reconciled with code

The dumped `sync_queue` structure contains:
- `user_id`
- `table_name`
- `record_id`
- `operation`
- `record_data` and newer `data`
- timestamp/synced/retry/error fields

The final dump does not define `device_id` on that table, while some legacy sync code paths use device-oriented queue behavior. Treat this as a schema/code contract audit item before relying on the queue.

Action:
- choose one canonical queue schema/service
- write a migration from the current schema
- keep backward readers only as long as needed
- add idempotency/mutation UUID and device/user/school scope
- index pending/order/cursor queries

### 4. Device authentication needs a canonical contract

The dumped `sync_devices` structure represents device identity/status/last-sync but the legacy model layer contains registration/verification concepts that are not consistently represented as a stored credential.

Action:
- device credential must be independent of a plain device ID
- store only token hash/server credential metadata
- rotate/revoke
- bind operations to authenticated user/school/role
- do not accept device ID as proof of identity

### 5. Timestamp-only pull is not enough

Existing services rely heavily on `last_modified_at`. Clock skew, multiple changes within the same timestamp granularity and interrupted batches can produce misses/duplicates.

Action:
- add server-issued monotonic change cursor/sequence, or a deterministic composite cursor
- preserve timestamps for display/audit
- paginate change feed deterministically
- persist per-device acknowledged cursor

### 6. Deletes need a single tombstone path

The schema already contains deletion/tombstone concepts. Ensure every synced delete creates an event that other devices can pull.

Action:
- no silent hard delete in sync-enabled entities
- authorize deletion
- retain tombstone long enough for all devices/reconciliation
- test delete/update conflict

### 7. Numeric PK collision risk for offline creation

Auto-increment integers are fine on the authoritative server but unsafe as the only cross-device identity for records created offline.

Action:
- retain numeric PKs for legacy compatibility
- add a stable UUID/origin key to entities that can be created offline
- map UUID to server PK after push
- use mutation UUID for retry idempotency

### 8. Multiple IndexedDB implementations should be consolidated

The application includes a generic offline queue plus module-specific IndexedDB implementations (for example attendance/other offline flows). Fragmentation makes user switching, retries, migrations and conflict handling harder.

Action:
- one versioned storage layer
- domain stores or generic entities
- outbox, sync state, conflicts, optional attachment queue
- data partitioned by school/user
- purge/lock appropriately on logout

### 9. Service-worker policy is too small for full offline operation

The current service worker focuses on a small static cache. It is not a complete authenticated offline application strategy.

Action:
- versioned static cache
- explicit API/page strategy
- safe cache invalidation
- no indiscriminate caching of private authenticated responses
- offline fallback/status
- background sync only as an enhancement, never the sole retry path

### 10. Data-type debt should not be mixed into visual work

The dump includes text-like date/year fields and some monetary `DOUBLE` fields. Those can affect indexing, validation and exact finance math, but changing them is a separate data-migration project.

Action:
- audit module-by-module
- add compatibility tests
- prefer `DECIMAL` for new exact money fields
- migrate legacy values only with reconciliation
- do not bundle this with UI PRs

## Query-performance guidance

Start with actual slow routes. Use CI profiler/log timings and MySQL `EXPLAIN`.

Common safe opportunities:
- remove N+1 lookups in list/report loops
- batch reference lookups
- select required columns
- add evidence-based composite indexes
- paginate large tables
- pre-aggregate one-to-many sides before joining financial totals

Pay special attention to financial daily-total queries: joining a charge row directly to multiple payment rows can multiply charged amounts. Preserve the business calculation while removing join multiplication.

## Recommended phased sync scope

1. shell/reference data read-only
2. attendance
3. daily fees/collections only with idempotency + reconciliation
4. admissions/student records
5. marks/assessment
6. other operational modules
7. accounting/payroll only after domain-specific offline rules are approved

## Mandatory reconciliation reports

For every enabled module expose:
- pending
- synced
- failed
- conflicts/manual review
- orphaned references
- duplicates prevented by idempotency
- last server cursor per device
- last successful pull/push
- reconciliation total/checksum where meaningful

## Migration policy

All schema changes must be:
- versioned
- idempotent
- reviewed
- backed up
- tested on a copy of realistic data
- reversible where practical
- verified after application

Never run raw production dumps or secret-bearing config through Git.
