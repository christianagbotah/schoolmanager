-- Gen2 offline sync device authentication hardening
-- Stores only a SHA-256 hash of each 256-bit random bearer token.
-- Existing devices intentionally remain NULL and must be re-enrolled; the
-- application fails closed for NULL hashes rather than falling back to device ID.

SET @schema_name := DATABASE();
SET @has_auth_token_hash := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'sync_devices'
      AND COLUMN_NAME = 'auth_token_hash'
);

SET @add_auth_token_hash_sql := IF(
    @has_auth_token_hash = 0,
    'ALTER TABLE `sync_devices` ADD COLUMN `auth_token_hash` CHAR(64) NULL AFTER `device_id`',
    'SELECT 1'
);

PREPARE add_auth_token_hash_stmt FROM @add_auth_token_hash_sql;
EXECUTE add_auth_token_hash_stmt;
DEALLOCATE PREPARE add_auth_token_hash_stmt;
