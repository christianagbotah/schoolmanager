const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const migrationPath = 'application/migrations/20261022_convert_enabled_sync_myisam_to_innodb.sql';

const expectedTargets = [
  'accounts',
  'accounts_payable',
  'account_type',
  'exam_category',
  'incomplete_fee_transactions',
  'invoice_access_tokens',
  'invoice_sms_log',
  'mobile_money_payment',
  'parent',
  'sems',
  'settings',
  'terms',
  'transport',
];

test('migration exists and contains the reviewed production allowlist', () => {
  assert.ok(fs.existsSync(migrationPath), `missing ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  for (const table of expectedTargets) {
    assert.match(sql, new RegExp(`['\\\"]${table}['\\\"]`), `missing allowlisted table ${table}`);
  }

  const allowlistInsert = sql.match(/INSERT\s+INTO\s+sync_engine_conversion_targets[\s\S]*?;/i)?.[0] || '';
  const listedTargets = [...allowlistInsert.matchAll(/\(\s*\d+\s*,\s*['\"]([A-Za-z0-9_]+)['\"]\s*\)/g)].map((m) => m[1]);
  assert.deepEqual(listedTargets.sort(), [...expectedTargets].sort(), 'migration target allowlist must match the reviewed 13-table production inventory exactly');
});

test('migration is idempotent and converts only enabled MyISAM sync targets', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /INFORMATION_SCHEMA\.TABLES/i, 'must inspect the live table engine before conversion');
  assert.match(sql, /ENGINE\s*=\s*['\"]MyISAM['\"]/i, 'must only rebuild tables that are still MyISAM');
  assert.match(sql, /sync_metadata/i, 'must consult the authoritative sync registry');
  assert.match(sql, /sync_enabled\s*=\s*1/i, 'must require the target to remain sync-enabled');
  assert.match(sql, /ALTER\s+TABLE[\s\S]*ENGINE\s*=\s*InnoDB/i, 'must convert selected targets to InnoDB');
  assert.match(sql, /PREPARE\s+/i, 'dynamic ALTER statements must be built only after guards pass');
});

test('missing target lookup cannot trip the cursor NOT FOUND handler', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(
    sql,
    /SELECT\s+COALESCE\s*\(\s*MAX\s*\(\s*ENGINE\s*\)\s*,\s*['\"]MISSING['\"]\s*\)\s+INTO\s+target_engine[\s\S]*?INFORMATION_SCHEMA\.TABLES/i,
    'engine lookup must always return one aggregate row so a missing table does not terminate the cursor early'
  );
});

test('migration has deterministic ordering and a postflight failure signal', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /ORDER\s+BY\s+ordinal/i, 'conversion order must be deterministic');
  assert.match(sql, /remaining_myisam_targets/i, 'migration must expose a postflight count');
  assert.match(sql, /SIGNAL\s+SQLSTATE/i, 'migration must fail visibly when an allowlisted enabled target remains MyISAM');
});

test('migration does not weaken sync registration to make conversion pass', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.doesNotMatch(sql, /UPDATE\s+sync_metadata[\s\S]*sync_enabled/i, 'migration must not disable sync targets');
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+sync_metadata/i, 'migration must not delete sync registry entries');
});
