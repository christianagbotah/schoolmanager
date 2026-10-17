const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Transaction_recovery.php';
const viewPath = 'application/views/backend/admin/transaction_recovery.php';
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

test('Transaction_recovery requires an authenticated super administrator', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /session/);
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX must receive HTTP 401');
  assert.match(ctor, /select\s*\(\s*['\"]level['\"]\s*\)/, 'authorization must resolve the persisted admin level');
  assert.match(ctor, /admin_id/);
  assert.match(ctor, /\(int\)\s*\$admin->level\s*!==\s*1|\$admin->level\s*!=\s*1/, 'only level-1 super administrators may use recovery');
  assert.match(ctor, /set_status_header\s*\(\s*403\s*\)/, 'authenticated non-super-admin AJAX must receive HTTP 403');
  assert.match(ctor, /exit\s*;/, 'denials must terminate dispatch');
});

test('recovery mutation is POST-only', () => {
  const process = methodBody('process');
  assert.match(process, /method\s*\(\s*true\s*\)/i);
  assert.match(process, /POST/);
  assert.match(process, /set_status_header\s*\(\s*405\s*\)/, 'non-POST recovery attempts must return HTTP 405');
});

test('recovery page passes a current CSRF token into a POST-only UI request', () => {
  const index = methodBody('index');
  assert.match(index, /get_csrf_token_name\s*\(\s*\)/, 'controller must pass the configured CSRF token name to the view');
  assert.match(index, /get_csrf_hash\s*\(\s*\)/, 'controller must pass the current CSRF hash to the view');
  assert.match(view, /xhr\.open\(\s*['\"]POST['\"]/);
  assert.doesNotMatch(view, /xhr\.open\(\s*['\"]GET['\"]\s*,\s*['\"][^'\"]*transaction_recovery\/process/);
  assert.match(view, /csrfTokenName/);
  assert.match(view, /csrfTokenHash/);
  assert.match(view, /new\s+FormData\s*\(/, 'POST request should carry form data');
  assert.match(view, /\.append\s*\(\s*csrfTokenName\s*,\s*csrfTokenHash\s*\)/, 'CSRF token must be appended to the POST body');
});

test('all public recovery surfaces remain behind the constructor boundary', () => {
  for (const name of ['index', 'get_stats', 'process']) {
    assert.ok(methodBody(name).length > 0, `missing ${name}()`);
  }
});

test('dedicated CI workflow enforces the transaction recovery boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/transaction-recovery-boundary.yml', 'utf8');
  assert.match(workflow, /transaction-recovery-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Transaction_recovery\.php/);
});
