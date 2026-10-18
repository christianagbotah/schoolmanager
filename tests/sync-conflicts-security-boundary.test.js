const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Sync_conflicts.php';
const listViewPath = 'application/views/backend/admin/sync_conflicts_list.php';
const detailViewPath = 'application/views/backend/admin/sync_conflict_detail.php';
const mergeViewPath = 'application/views/backend/admin/sync_conflict_merge.php';

const source = fs.readFileSync(controllerPath, 'utf8');
const listView = fs.readFileSync(listViewPath, 'utf8');
const detailView = fs.readFileSync(detailViewPath, 'utf8');
const mergeView = fs.readFileSync(mergeViewPath, 'utf8');

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

test('Sync_conflicts is restricted to authenticated level-1 super administrators', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /load->database\s*\(/);
  assert.match(ctor, /load->library\s*\(\s*['\"]session['\"]\s*\)/);
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/);
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX must return HTTP 401');
  assert.match(ctor, /select\s*\(\s*['\"]level['\"]\s*\)/, 'authorization must use the persisted admin level');
  assert.match(ctor, /admin_id/);
  assert.match(ctor, /\(int\)\s*\$admin->level\s*!==\s*1|\$admin->level\s*!=\s*1/, 'only level-1 admins may resolve sync conflicts');
  assert.match(ctor, /set_status_header\s*\(\s*403\s*\)/, 'authenticated non-super-admin AJAX must return HTTP 403');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/);
  assert.match(ctor, /exit\s*;/);
});

test('every conflict mutation is POST-only', () => {
  const requirePost = methodBody('require_post');
  assert.match(requirePost, /method\s*\(\s*true\s*\)/i);
  assert.match(requirePost, /POST/);
  assert.match(requirePost, /set_status_header\s*\(\s*405\s*\)/);
  assert.match(requirePost, /Allow:\s*POST/);

  for (const name of ['keep_local', 'keep_remote', 'merge', 'ignore', 'bulk_resolve']) {
    assert.match(methodBody(name), /require_post\s*\(\s*\)/, `${name}() must enforce POST`);
  }
});

test('read pages pass current CSRF material and mutation UIs use CSRF-bearing POST requests', () => {
  for (const name of ['index', 'view', 'merge_view']) {
    const body = methodBody(name);
    assert.match(body, /csrf_token_name.*get_csrf_token_name\s*\(\s*\)/s, `${name}() must pass CSRF token name`);
    assert.match(body, /csrf_token_hash.*get_csrf_hash\s*\(\s*\)/s, `${name}() must pass CSRF hash`);
  }

  for (const [name, code] of [['list', listView], ['detail', detailView], ['merge', mergeView]]) {
    assert.match(code, /csrfTokenName/, `${name} view must expose CSRF token name`);
    assert.match(code, /csrfTokenHash/, `${name} view must expose CSRF token hash`);
    assert.match(code, /type:\s*['\"]POST['\"]|method:\s*['\"]POST['\"]/, `${name} view must submit mutations with POST`);
    assert.match(code, /X-Requested-With/, `${name} view must mark mutation requests as AJAX`);
  }

  assert.doesNotMatch(listView, /sync_conflicts\/(keep_local|keep_remote|ignore)[^'\"]*[\s\S]{0,180}type:\s*['\"]GET['\"]/i);
  assert.doesNotMatch(detailView, /type:\s*['\"]GET['\"][\s\S]{0,180}(keep_local|keep_remote|ignore)|(?:keep_local|keep_remote|ignore)[\s\S]{0,180}type:\s*['\"]GET['\"]/i);
});

test('resolution methods operate only on still-pending conflicts', () => {
  const helper = methodBody('get_pending_conflict');
  assert.match(helper, /get_conflict\s*\(/);
  assert.match(helper, /status/);
  assert.match(helper, /pending/);
  assert.match(helper, /409/, 'already-resolved conflicts should be rejected as a state conflict');

  for (const name of ['keep_local', 'keep_remote', 'merge', 'ignore']) {
    assert.match(methodBody(name), /get_pending_conflict\s*\(/, `${name}() must resolve only pending conflicts`);
  }
  assert.match(methodBody('bulk_resolve'), /get_pending_conflict\s*\(/, 'bulk resolution must also skip/reject non-pending conflicts');
});

test('dynamic conflict targets are limited to enabled sync tables', () => {
  const validator = methodBody('validate_conflict_target');
  assert.match(validator, /preg_match\s*\(/, 'table names must satisfy a strict identifier pattern');
  assert.match(validator, /table_exists\s*\(/, 'target table must exist');
  assert.match(validator, /sync_metadata/, 'target must be registered in sync metadata');
  assert.match(validator, /sync_enabled/, 'target sync metadata entry must be enabled');
  assert.match(methodBody('apply_version'), /validate_conflict_target\s*\(/, 'writes must validate the conflict target');

  const pk = methodBody('get_primary_key');
  assert.match(pk, /field_data\s*\(/, 'primary key discovery should use database metadata');
  assert.doesNotMatch(source, /SHOW\s+KEYS\s+FROM/i, 'raw dynamic SHOW KEYS queries must not remain');
});

test('record updates and conflict state transitions are atomic and apply failures cannot be marked resolved', () => {
  const applyResolution = methodBody('apply_resolution');
  assert.match(applyResolution, /trans_begin\s*\(/);
  assert.match(applyResolution, /apply_version\s*\(/);
  assert.match(applyResolution, /resolve_conflict\s*\(/);
  assert.match(applyResolution, /trans_rollback\s*\(/);
  assert.match(applyResolution, /trans_commit\s*\(/);
  assert.match(applyResolution, /if\s*\(\s*!\s*\$this->apply_version|\$applied\s*===?\s*false/, 'failed data writes must stop resolution');

  for (const name of ['keep_local', 'keep_remote', 'merge']) {
    assert.match(methodBody(name), /apply_resolution\s*\(/, `${name}() must use atomic resolution helper`);
  }
});

test('conflict views do not call string properties as fake controller methods', () => {
  assert.doesNotMatch(detailView, /\$this->format_value\s*\(/);
  assert.doesNotMatch(detailView, /\$this->format_value\s*=/);
  assert.doesNotMatch(mergeView, /\$this->format_merge_value\s*\(/);
  assert.doesNotMatch(mergeView, /\$this->is_text_field\s*\(/);
  assert.doesNotMatch(mergeView, /\$this->get_primary_key\s*\(/);
  assert.doesNotMatch(mergeView, /\$this->(?:format_merge_value|is_text_field|get_primary_key)\s*=/);
  assert.doesNotMatch(mergeView, /SHOW\s+KEYS\s+FROM/i, 'view must not run dynamic schema SQL');
});

test('detail view embeds conflict data as JavaScript values rather than single-quoted JSON strings', () => {
  assert.doesNotMatch(detailView, /var\s+localVal\s*=\s*['\"]<\?php\s+echo\s+json_encode/);
  assert.doesNotMatch(detailView, /var\s+remoteVal\s*=\s*['\"]<\?php\s+echo\s+json_encode/);
  assert.match(detailView, /JSON_HEX_APOS|JSON_HEX_QUOT/, 'embedded JSON should be safely encoded for script context');
});

test('dedicated CI workflow enforces the sync conflicts security boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/sync-conflicts-security.yml', 'utf8');
  assert.match(workflow, /sync-conflicts-security-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Sync_conflicts\.php/);
});
