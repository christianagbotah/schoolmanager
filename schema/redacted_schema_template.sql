-- SchoolManager redacted schema / sync migration template
-- SAFE FOR VERSION CONTROL: structure guidance only, no production data or credentials.
-- Do NOT execute this file wholesale on production.
-- Create versioned CI3 migration scripts for each approved change after checking the live schema.

-- ---------------------------------------------------------------------------
-- 1) Example canonical metadata for ONE sync-enabled entity
-- Replace example_entity / id only after the table is explicitly approved.
-- ---------------------------------------------------------------------------

/*
ALTER TABLE example_entity
    ADD COLUMN sync_uuid CHAR(36) NULL,
    ADD COLUMN sync_status ENUM('PENDING','SYNCED','FAILED','MANUAL_REVIEW') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN last_modified_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    ADD COLUMN last_modified_by INT NULL,
    ADD COLUMN device_id VARCHAR(100) NULL,
    ADD COLUMN version INT NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX uq_example_entity_sync_uuid
    ON example_entity(sync_uuid);

CREATE INDEX idx_example_entity_sync_cursor
    ON example_entity(last_modified_at, id);

CREATE INDEX idx_example_entity_sync_pending
    ON example_entity(sync_status, last_modified_at);
*/

-- ---------------------------------------------------------------------------
-- 2) Canonical server change feed
-- Prefer a monotonic server sequence over client timestamps as the pull cursor.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_change_feed_template (
    change_seq BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mutation_uuid CHAR(36) NOT NULL,
    school_id INT NULL,
    user_id INT NULL,
    device_id VARCHAR(100) NULL,
    table_name VARCHAR(100) NOT NULL,
    record_pk VARCHAR(191) NOT NULL,
    record_sync_uuid CHAR(36) NULL,
    operation ENUM('insert','update','delete') NOT NULL,
    record_version INT NULL,
    payload_json JSON NULL,
    server_changed_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (change_seq),
    UNIQUE KEY uq_sync_change_mutation (mutation_uuid),
    KEY idx_sync_change_entity (table_name, record_pk, change_seq),
    KEY idx_sync_change_school_cursor (school_id, change_seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 3) Device credentials template
-- Never store a plaintext device token. Store a strong hash/fingerprint.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_device_credentials_template (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id VARCHAR(100) NOT NULL,
    school_id INT NULL,
    user_id INT NULL,
    token_hash VARCHAR(255) NOT NULL,
    token_fingerprint VARCHAR(32) NULL,
    status ENUM('ACTIVE','REVOKED','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    last_used_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sync_device_credential_device (device_id),
    KEY idx_sync_device_credential_scope (school_id, user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 4) Idempotent mutation ledger / outbox receipt template
-- A retried client mutation must resolve to the same server result.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_mutation_ledger_template (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mutation_uuid CHAR(36) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    school_id INT NULL,
    user_id INT NULL,
    table_name VARCHAR(100) NOT NULL,
    operation ENUM('insert','update','delete') NOT NULL,
    expected_version INT NULL,
    applied_record_pk VARCHAR(191) NULL,
    applied_version INT NULL,
    result_json JSON NULL,
    status ENUM('RECEIVED','APPLIED','CONFLICT','FAILED') NOT NULL,
    received_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    applied_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sync_mutation_uuid (mutation_uuid),
    KEY idx_sync_mutation_device (device_id, received_at),
    KEY idx_sync_mutation_status (status, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 5) Per-device cursor template
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_device_cursor_template (
    device_id VARCHAR(100) NOT NULL,
    school_id INT NULL,
    last_ack_change_seq BIGINT UNSIGNED NOT NULL DEFAULT 0,
    last_pull_at TIMESTAMP NULL DEFAULT NULL,
    last_push_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id),
    KEY idx_sync_cursor_school (school_id, last_ack_change_seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 6) Conflict contract template
-- Domain-specific strategy must be chosen by the server registry.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_conflict_template (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_pk VARCHAR(191) NOT NULL,
    record_sync_uuid CHAR(36) NULL,
    local_device_id VARCHAR(100) NULL,
    local_version INT NULL,
    local_payload_json JSON NULL,
    remote_version INT NULL,
    remote_payload_json JSON NULL,
    strategy VARCHAR(50) NOT NULL,
    status ENUM('PENDING','RESOLVED','IGNORED') NOT NULL DEFAULT 'PENDING',
    resolution_json JSON NULL,
    resolved_by INT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_sync_conflict_pending (status, created_at),
    KEY idx_sync_conflict_entity (table_name, record_pk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- IMPORTANT
-- These *_template tables intentionally do not replace existing production
-- sync_* tables. z.ai must first reconcile the current schema/code contract,
-- then implement minimal migrations that evolve the existing structures.
-- ---------------------------------------------------------------------------
