# Source and Schema Baseline

## Application source of truth

The CodeIgniter 3 application baseline for this repository is the existing VPS application at:

`/home/lightworld/webapps/rochas`

The initial GitHub source import was produced from that application, with runtime/user-generated data, dependency directories that can be restored from lockfiles, database credentials, SMTP credentials, and other server-only secrets excluded.

Do not replace this baseline with a different school application or the newer Next.js/iEduPro codebase.

## Schema source of truth

The schema reference for modernization and offline-sync analysis is the user-supplied SQL dump:

`schoolmanager_update.sql` — generated 2026-10-02 from MySQL 8.4.x.

The raw dump contains production records and must never be committed.

Use:
- `schema/schoolmanager_schema_redacted.sql` for the actual structure extracted from that supplied dump.
- `schema/SCHEMA_REVIEW.md` for analysis and migration cautions.
- `schema/redacted_schema_template.sql` for sync-design examples only.

The structure-only file removes production `INSERT/REPLACE` data, redacts SQL `DEFINER` accounts, and normalizes auto-increment counters. It preserves the table/procedure/index/constraint structure needed for engineering review.

## Production target

- URL: `https://schoolmanager.lightworldtech.com`
- Deployment directory: `/home/lightworld/webapps/schoolmanager`
- Database: `lightworld_schoolmanager_db`
- Database user: `lightworld_db_user`

The database password and all other secrets must remain server-side and must not be committed.
