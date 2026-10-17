const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Updater.php';
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

test('Updater requires an authenticated admin session at the controller boundary', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /session/);
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/, 'AJAX callers should receive an API-safe auth denial');
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX requests must return HTTP 401');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, 'browser auth failure must use an explicit HTTP 302 login redirect');
  assert.match(ctor, /exit\s*;/, 'auth denial must terminate dispatch');
});

test('legacy web updater is retired and cannot execute uploaded PHP', () => {
  const update = methodBody('update');
  assert.match(update, /retired_endpoint\s*\(/, 'update() must route to the retired endpoint');
  assert.doesNotMatch(source, /move_uploaded_file\s*\(/, 'controller must not accept executable update uploads');
  assert.doesNotMatch(source, /new\s+ZipArchive|ZipArchive\s*;/, 'controller must not extract arbitrary update archives');
  assert.doesNotMatch(source, /extractTo\s*\(/, 'controller must not extract uploaded packages');
  assert.doesNotMatch(source, /require\s+['\"].*update_script\.php|require\s+.*update_script\.php/, 'controller must not execute update_script.php from uploads');
});

test('retired updater returns an explicit gone response for AJAX callers', () => {
  const retired = methodBody('retired_endpoint');
  assert.match(retired, /set_status_header\s*\(\s*410\s*\)/, 'retired AJAX route must return HTTP 410 Gone');
  assert.match(retired, /version-controlled|release pipeline|deployment/i, 'retirement message must direct operators to the approved deployment path');
});

test('dedicated CI workflow enforces retirement of executable web updates', () => {
  const workflow = fs.readFileSync('.github/workflows/web-updater-retirement.yml', 'utf8');
  assert.match(workflow, /web-updater-retirement\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Updater\.php/);
});
