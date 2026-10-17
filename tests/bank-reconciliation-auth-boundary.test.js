const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Bank_reconciliation.php';
const source = fs.readFileSync(controllerPath, 'utf8');

function methodBody(name) {
  const re = new RegExp(`(?:public\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
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

test('Bank_reconciliation enforces admin authentication in its constructor', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /!=\s*1|!==\s*1/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/, 'AJAX requests should receive an API-safe denial');
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX requests must return HTTP 401');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, 'normal browser auth failure should use an explicit HTTP 302 Location redirect');
  assert.match(ctor, /exit\s*;/, 'constructor denial must terminate dispatch');
});

test('all reconciliation routes rely on the constructor boundary rather than index-only auth', () => {
  const index = methodBody('index');
  const ctor = methodBody('__construct');
  assert.match(ctor, /admin_login/);

  for (const name of [
    'get_bank_accounts',
    'get_reconciliations',
    'create',
    'update',
    'complete',
    'delete',
    'get_reconciliation_items',
    'add_item',
    'toggle_match',
    'delete_item',
    'get_statistics',
    'get_unmatched_transactions',
    'auto_match'
  ]) {
    assert.ok(methodBody(name).length > 0, `missing ${name}()`);
  }

  assert.doesNotMatch(index, /admin_login/, 'auth should live in the constructor so every public route is protected');
});

test('dedicated CI workflow enforces the bank reconciliation auth boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/bank-reconciliation-auth.yml', 'utf8');
  assert.match(workflow, /bank-reconciliation-auth-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Bank_reconciliation\.php/);
});
