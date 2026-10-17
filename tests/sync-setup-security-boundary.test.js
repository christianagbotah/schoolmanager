const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Sync_setup.php';
const viewPath = 'application/views/backend/admin/sync_setup.php';
const source = fs.readFileSync(controllerPath, 'utf8');
const view = fs.readFileSync(viewPath, 'utf8');

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

test('Sync_setup is restricted to authenticated level-1 super administrators', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /load->database\s*\(/, 'database must be available before sync settings are inspected');
  assert.match(ctor, /load->library\s*\(\s*['\"]session['\"]\s*\)/, 'session dependency must be explicit');
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/);
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX must return HTTP 401');
  assert.match(ctor, /select\s*\(\s*['\"]level['\"]\s*\)/, 'authorization must use the persisted admin level');
  assert.match(ctor, /admin_id/);
  assert.match(ctor, /\(int\)\s*\$admin->level\s*!==\s*1|\$admin->level\s*!=\s*1/, 'only level-1 admins may manage sync infrastructure');
  assert.match(ctor, /set_status_header\s*\(\s*403\s*\)/, 'authenticated non-super-admin AJAX must return HTTP 403');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, 'browser authentication failure must be an explicit 302 login redirect');
  assert.match(ctor, /exit\s*;/, 'authorization denials must terminate dispatch');

  const loadDbAt = ctor.indexOf('load->database');
  const syncCheckAt = ctor.indexOf('check_sync_enabled');
  assert.ok(loadDbAt >= 0 && syncCheckAt > loadDbAt, 'database must load before check_sync_enabled() queries settings');
});

test('every sensitive sync setup action is POST-only', () => {
  const requirePost = methodBody('require_post');
  assert.match(requirePost, /method\s*\(\s*true\s*\)/i);
  assert.match(requirePost, /POST/);
  assert.match(requirePost, /set_status_header\s*\(\s*405\s*\)/, 'non-POST actions must return HTTP 405');
  assert.match(requirePost, /Allow:\s*POST/);

  for (const name of [
    'generate_api_key',
    'test_connection',
    'save_config',
    'initialize_metadata',
    'run_maintenance'
  ]) {
    assert.match(methodBody(name), /require_post\s*\(\s*\)/, `${name}() must enforce POST`);
  }
});

test('setup page receives current CSRF material and real page data through the backend view scope', () => {
  const index = methodBody('index');
  assert.match(index, /csrf_token_name.*get_csrf_token_name\s*\(\s*\)/s);
  assert.match(index, /csrf_token_hash.*get_csrf_hash\s*\(\s*\)/s);
  assert.match(index, /setup_status/);
  assert.match(index, /tables_status/);
  assert.match(index, /config/);

  assert.doesNotMatch(view, /\$this->setup_status|\$this->tables_status|\$this->config\s*\?\?/, 'nested page must consume variables passed through backend/main view scope');
  assert.match(view, /\$setup_status/);
  assert.match(view, /\$tables_status/);
  assert.match(view, /\$config/);
});

test('all sync setup POSTs include the current CSRF token', () => {
  assert.match(view, /csrfTokenName/);
  assert.match(view, /csrfTokenHash/);
  const appendMatches = view.match(/\.append\s*\(\s*csrfTokenName\s*,\s*csrfTokenHash\s*\)/g) || [];
  assert.ok(appendMatches.length >= 6, `expected CSRF token on all six UI POST calls, found ${appendMatches.length}`);
  assert.doesNotMatch(view, /method:\s*['\"]GET['\"]/i, 'sync setup mutations must not be invoked with GET');
});

test('dedicated CI workflow enforces the sync setup security boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/sync-setup-security.yml', 'utf8');
  assert.match(workflow, /sync-setup-security-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Sync_setup\.php/);
});
