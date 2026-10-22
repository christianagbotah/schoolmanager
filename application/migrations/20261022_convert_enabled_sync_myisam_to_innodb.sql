-- Convert the reviewed sync-enabled MyISAM targets to InnoDB.
--
-- Why: manual sync conflict resolution relies on transactions. A MyISAM target
-- cannot participate in rollback, so resolving a conflict against one can leave
-- the business row, conflict status, and audit trail out of sync.
--
-- Safety properties:
--   * exact reviewed production allowlist (2026-10-22)
--   * only tables that are still registered with sync_enabled = 1 are touched
--   * only tables that are still ENGINE = 'MyISAM' are rebuilt
--   * already-InnoDB or disabled targets are skipped, making reruns idempotent
--   * deterministic order keeps the two largest/currently-used tables last
--   * postflight fails visibly if any enabled allowlisted target is not InnoDB
--
-- Run during a controlled deployment after a database backup. ALTER TABLE may
-- briefly take a metadata/write lock even though the current production tables
-- are small (largest reviewed table was ~0.20 MiB / 809 rows).

SET @schema_name := DATABASE();

DROP TEMPORARY TABLE IF EXISTS sync_engine_conversion_targets;
CREATE TEMPORARY TABLE sync_engine_conversion_targets (
    ordinal TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL UNIQUE
) ENGINE=MEMORY;

-- Small/empty tables first; parent/settings last to minimize user-visible risk.
INSERT INTO sync_engine_conversion_targets (ordinal, table_name) VALUES
    (1, 'accounts'),
    (2, 'accounts_payable'),
    (3, 'account_type'),
    (4, 'exam_category'),
    (5, 'incomplete_fee_transactions'),
    (6, 'invoice_access_tokens'),
    (7, 'invoice_sms_log'),
    (8, 'mobile_money_payment'),
    (9, 'sems'),
    (10, 'terms'),
    (11, 'transport'),
    (12, 'settings'),
    (13, 'parent');

DROP PROCEDURE IF EXISTS convert_enabled_sync_myisam_targets;
DELIMITER $$

CREATE PROCEDURE convert_enabled_sync_myisam_targets()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE target_table VARCHAR(64);
    DECLARE target_engine VARCHAR(64);
    DECLARE target_sync_enabled INT DEFAULT 0;
    DECLARE remaining_myisam_targets INT DEFAULT 0;

    DECLARE target_cursor CURSOR FOR
        SELECT table_name
        FROM sync_engine_conversion_targets
        ORDER BY ordinal;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN target_cursor;

    target_loop: LOOP
        FETCH target_cursor INTO target_table;
        IF done = 1 THEN
            LEAVE target_loop;
        END IF;

        SET target_engine = NULL;
        SET target_sync_enabled = 0;

        SELECT ENGINE
          INTO target_engine
          FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = @schema_name
           AND TABLE_NAME = target_table
         LIMIT 1;

        SELECT COALESCE(MAX(sync_enabled), 0)
          INTO target_sync_enabled
          FROM sync_metadata
         WHERE table_name = target_table;

        IF target_engine = 'MyISAM' AND target_sync_enabled = 1 THEN
            -- target_table comes exclusively from the fixed allowlist above.
            SET @engine_alter_sql := CONCAT(
                'ALTER TABLE `',
                REPLACE(target_table, '`', '``'),
                '` ENGINE=InnoDB'
            );
            PREPARE engine_alter_stmt FROM @engine_alter_sql;
            EXECUTE engine_alter_stmt;
            DEALLOCATE PREPARE engine_alter_stmt;
        END IF;
    END LOOP;

    CLOSE target_cursor;

    -- Any enabled allowlisted target left on MyISAM, another non-transactional
    -- engine, or missing from the schema is a failed migration.
    SELECT COUNT(*)
      INTO remaining_myisam_targets
      FROM sync_engine_conversion_targets targets
      JOIN sync_metadata metadata
        ON metadata.table_name = targets.table_name
       AND metadata.sync_enabled = 1
      LEFT JOIN INFORMATION_SCHEMA.TABLES tables_meta
        ON tables_meta.TABLE_SCHEMA = @schema_name
       AND tables_meta.TABLE_NAME = targets.table_name
     WHERE COALESCE(UPPER(tables_meta.ENGINE), 'MISSING') <> 'INNODB';

    SELECT remaining_myisam_targets AS remaining_myisam_targets;

    IF remaining_myisam_targets > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'One or more enabled sync targets are still non-InnoDB after migration';
    END IF;
END$$

DELIMITER ;

CALL convert_enabled_sync_myisam_targets();
DROP PROCEDURE IF EXISTS convert_enabled_sync_myisam_targets;
DROP TEMPORARY TABLE IF EXISTS sync_engine_conversion_targets;
