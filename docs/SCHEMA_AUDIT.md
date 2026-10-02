# SchoolManager Schema & Bidirectional Sync Audit

Authoritative source: the owner's `schoolmanager_update.sql` dump generated on 2026-10-02. This audit must be read together with `schema/schoolmanager_schema_redacted.sql` and `docs/ZAI_MODERNIZATION_PROMPT.md`.

## Structural summary

The supplied dump contains:
- 282 table definitions;
- 243 tables explicitly using InnoDB;
- 25 tables explicitly using MyISAM;
- 14 definitions without an explicit engine in the CREATE statement;
- 94 tables containing `sync_status`;
- roughly 93 tables containing `version` and `last_modified_at`;
- only 2 table definitions containing `sync_operation_type`;
- only a small minority containing `deleted_at` / tombstone-style fields.

This is a strong partial foundation, but it is not yet a uniformly safe multi-device bidirectional sync design.

## Existing sync structures confirmed in the uploaded schema

The schema already contains:
- `sync_devices`;
- `sync_queue`;
- `sync_failures`;
- `sync_conflicts`;
- `sync_audit_log`;
- row metadata such as `sync_status`, `device_id`, `version`, `last_modified_at`, `last_modified_by`, `retry_count`, and `sync_error` on many business tables;
- a stored procedure intended to add `sync_operation_type` to tables that already have `sync_status`.

The legacy CI3 source also contains a substantial existing sync subsystem, including controllers/models for sync server operations, API push/pull, conflicts, audit, financial sync, daily fees, locations and setup. Audit and harden this code; do not discard it without proving a replacement preserves behavior.

## Critical gaps to resolve

### 1. Cross-device identity
Auto-increment IDs alone are unsafe for disconnected writes from multiple sites/devices. Add a stable sync UUID to synchronizable mutable entities while retaining integer IDs for legacy CI3 compatibility.

### 2. Server-controlled optimistic versions
Clients should submit a base version. The server must atomically compare and increment the canonical version. A stale base version becomes a conflict.

### 3. Deletion propagation
A normal pull based only on changed rows cannot see hard-deleted records. Add soft-delete metadata where appropriate or a central tombstone log with adequate retention.

### 4. Monotonic change cursor
Do not rely only on client/server wall-clock timestamps. Add a server change sequence and persist a per-device acknowledged cursor.

### 5. Idempotency
Every offline mutation must have a unique mutation key so retrying a lost request cannot duplicate a payment, attendance record, invoice, mark, wallet transaction or other write.

### 6. REPLACE semantics
The existing sync API has a REPLACE-style batch path. Replace it with explicit INSERT / version-checked UPDATE / conflict logic. MySQL REPLACE can delete then reinsert rows and is unsafe around foreign keys, audit trails and related records.

### 7. MyISAM
Audit all MyISAM tables. Tables participating in atomic finance, attendance or sync workflows should be candidates for tested InnoDB migrations. Do not mass-convert production without a compatibility report and rollback.

### 8. Device credentials
Keep the device/token concept, but use high-entropy tokens, store only hashes, support rotation/revocation, require HTTPS, rate-limit failures and never log raw tokens.

### 9. API over direct remote DB
The existing direct local-database-to-remote-database sync code may remain temporarily for compatibility, but the target topology should synchronize through authenticated CI3 HTTPS APIs. Do not expose cloud MySQL credentials to browsers or school devices.

### 10. Browser/PWA offline layer
For true browser offline operation while keeping CI3:
- Service Worker for shell/static assets;
- IndexedDB for cached read models;
- IndexedDB/outbox for pending mutations;
- connectivity and pending-count UI;
- manual Sync Now;
- conflict/failure status;
- resume after reconnect.

Offline availability must be explicit per module; do not imply an uncached report is available offline.

## Domain-specific conflict principles

- Financial ledger/audit: append-only; corrections by reversal/void.
- Payments/invoice settlement: transaction + version + idempotency; never last-write-wins.
- Attendance: merge only using explicit business-key and field rules.
- Student/profile descriptive data: optimistic conflict; manual merge where both sides changed.
- Settings/reference data: normally server-authoritative unless explicitly designed for offline editing.
- Derived/cache tables: regenerate rather than sync where possible.
- Audit logs: append-only.

## Required tests before enabling true bidirectional sync

At minimum:
- offline create/update/delete;
- create then repeatedly update before first sync;
- two-device concurrent edit;
- stale version;
- duplicate retry after lost response;
- network interruption mid-batch;
- client clock skew;
- integer-ID collision with UUID success;
- dependent parent/child creation offline;
- duplicate attendance prevention;
- duplicate payment prevention;
- concurrent settlement against same invoice;
- conflict local/remote/merged;
- blocked device;
- attachment interruption/resume;
- cursor resume;
- large pending queue;
- post-sync data reconciliation/checksum.

## Migration discipline

Do not edit the production schema manually from this audit. Produce versioned CI3 migrations and an impact report first. Test them against a cloned/staging database using the redacted schema as the structural map and representative non-sensitive fixtures.

The production database password must remain outside Git and should be configured on the VPS only.
