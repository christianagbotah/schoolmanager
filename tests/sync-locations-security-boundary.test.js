const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Sync_locations.php';
const viewPath = 'application/views/backend/admin/sync_locations.php';
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

test('Sync_locations is restricted to authenticated level-1 super administrators', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /load->database\s*\(/);
  assert.match(ctor, /load->library\s*\(\s*['\"]session['\"]\s*\)/);
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/);
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX must return HTTP 401');
  assert.match(ctor, /select\s*\(\s*['\"]level['\"]\s*\)/, 'authorization must resolve persisted admin level');
  assert.match(ctor, /admin_id/);
  assert.match(ctor, /\(int\)\s*\$admin->level\s*!==\s*1|\$admin->level\s*!=\s*1/, 'only level-1 admins may manage sync locations');
  assert.match(ctor, /set_status_header\s*\(\s*403\s*\)/, 'authenticated non-super-admin AJAX must return HTTP 403');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/);
  assert.match(ctor, /exit\s*;/);
});

test('all location mutations and connection tests are POST-only', () => {
  const requirePost = methodBody('require_post');
  assert.match(requirePost, /method\s*\(\s*true\s*\)/i);
  assert.match(requirePost, /POST/);
  assert.match(requirePost, /set_status_header\s*\(\s*405\s*\)/);
  assert.match(requirePost, /Allow:\s*POST/);

  for (const name of ['create', 'update', 'delete', 'activate', 'deactivate', 'test_connection']) {
    assert.match(methodBody(name), /require_post\s*\(\s*\)/, `${name}() must enforce POST`);
  }
});

test('location page posts state changes with the current CSRF token rather than navigating mutation URLs', () => {
  const index = methodBody('index');
  assert.match(index, /csrf_token_name.*get_csrf_token_name\s*\(\s*\)/s);
  assert.match(index, /csrf_token_hash.*get_csrf_hash\s*\(\s*\)/s);
  assert.match(view, /csrfTokenName/);
  assert.match(view, /csrfTokenHash/);
  assert.match(view, /method:\s*['\"]POST['\"]/);
  assert.match(view, /X-Requested-With/);
  assert.match(view, /\.append\s*\(\s*csrfTokenName\s*,\s*csrfTokenHash\s*\)/);
  assert.doesNotMatch(view, /window\.location\.href\s*=\s*currentActionData\.(activateUrl|deactivateUrl|deleteUrl)/, 'mutations must not be GET navigations');
});

test('API endpoints are constrained to public HTTPS destinations before storage or connection testing', () => {
  const validator = methodBody('validate_api_endpoint');
  assert.match(validator, /parse_url\s*\(/);
  assert.match(validator, /https/i, 'only HTTPS endpoints should be accepted');
  assert.match(validator, /gethostbynamel\s*\(/, 'hostname must be resolved before server-side request');
  assert.match(validator, /FILTER_VALIDATE_IP/);
  assert.match(validator, /FILTER_FLAG_NO_PRIV_RANGE/);
  assert.match(validator, /FILTER_FLAG_NO_RES_RANGE/);

  assert.match(methodBody('create'), /validate_api_endpoint\s*\(/);
  assert.match(methodBody('update'), /validate_api_endpoint\s*\(/);
  assert.match(methodBody('test_connection'), /validate_api_endpoint\s*\(/);
});

test('connection test keeps TLS verification enabled', () => {
  const testConnection = methodBody('test_connection');
  assert.match(testConnection, /CURLOPT_SSL_VERIFYPEER\s*,\s*true/i);
  assert.match(testConnection, /CURLOPT_SSL_VERIFYHOST\s*,\s*2/);
  assert.doesNotMatch(testConnection, /CURLOPT_SSL_VERIFYPEER\s*,\s*false/i);
});

test('dedicated CI workflow enforces the sync locations security boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/sync-locations-security.yml', 'utf8');
  assert.match(workflow, /sync-locations-security-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Sync_locations\.php/);
});
