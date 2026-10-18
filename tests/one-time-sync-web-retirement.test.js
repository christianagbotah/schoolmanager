const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/One_time_sync.php';
const source = fs.readFileSync(controllerPath, 'utf8');

function methodBody(name) {
  const re = new RegExp(`(?:public\\s+|private\\s+|protected\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
  const match = re.exec(source);
  assert.ok(match, `missing ${name}()`);
  let depth = 0;
  let started = false;
  for (let i = match.index; i < source.length; i++) {
    if (source[i] === '{') { depth++; started = true; }
    if (source[i] === '}') depth--;
    if (started && depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error(`unterminated ${name}()`);
}

test('One_time_sync retires every web request at the constructor boundary', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /if\s*\(\s*!\s*\$this->is_cli\s*\(\s*\)\s*\)/, 'web and CLI execution must be separated immediately');
  assert.match(ctor, /retired_web_endpoint\s*\(\s*\)/, 'all web requests must terminate in the retirement handler');
  assert.doesNotMatch(ctor, /check_auth\s*\(\s*\)/, 'legacy web admin access must not remain as an alternate path');
});

test('retired web endpoint returns HTTP 410 and terminates dispatch', () => {
  const retired = methodBody('retired_web_endpoint');
  assert.match(retired, /set_status_header\s*\(\s*410\s*\)/, 'legacy web sync must return Gone');
  assert.match(retired, /one-time sync|legacy sync|CLI|sync/i, 'response should explain the retired path');
  assert.match(retired, /exit\s*;/, 'retired web request must terminate before any sync method dispatches');
});

test('legacy one-time sync web views are no longer reachable or rendered', () => {
  assert.doesNotMatch(source, /load->view\s*\([^)]*one_time_sync/i);
  assert.doesNotMatch(source, /one_time_sync_results/i);
});

test('CLI maintenance uses the active remote database setting names', () => {
  const remote = methodBody('get_remote_db');
  for (const key of ['remote_db_host', 'remote_db_port', 'remote_db_user', 'remote_db_pass', 'remote_db_name']) {
    assert.match(remote, new RegExp(`get_setting\\(\\s*['\"]${key}['\"]`), `missing active setting ${key}`);
  }
  for (const legacyKey of ['remote_host', 'remote_port', 'remote_user', 'remote_pass', 'remote_database']) {
    assert.doesNotMatch(remote, new RegExp(`get_setting\\(\\s*['\"]${legacyKey}['\"]`), `legacy setting ${legacyKey} must not remain`);
  }
});

test('CLI sync methods remain available for deliberate operator use', () => {
  for (const name of ['get_tables_without_sync', 'sync_table', 'sync_multiple_tables', 'sync_all_without_sync_columns', 'index']) {
    assert.ok(methodBody(name).length > 0, `missing ${name}()`);
  }
  const index = methodBody('index');
  assert.match(index, /is_cli\s*\(\s*\)/, 'index should remain an explicit CLI entry point');
  assert.doesNotMatch(index, /load->view/);
});

test('dedicated CI workflow enforces retirement of the web one-time sync surface', () => {
  const workflow = fs.readFileSync('.github/workflows/one-time-sync-web-retirement.yml', 'utf8');
  assert.match(workflow, /one-time-sync-web-retirement\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/One_time_sync\.php/);
});
