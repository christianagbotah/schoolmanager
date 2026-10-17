const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Bulk_receipts.php';
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

test('Bulk_receipts enforces admin authentication in its constructor', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /session/, 'constructor must load/use the session boundary');
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /!=\s*1|!==\s*1/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/, 'AJAX receipt generation should receive an API-safe denial');
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX requests must return HTTP 401');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, 'browser print routes should use an explicit HTTP 302 login redirect');
  assert.match(ctor, /exit\s*;/, 'constructor denial must terminate dispatch');
});

test('receipt generation and printing remain behind the constructor boundary', () => {
  assert.ok(methodBody('generate').length > 0, 'missing generate()');
  assert.ok(methodBody('print_multiple').length > 0, 'missing print_multiple()');
  assert.ok(methodBody('generate_single_receipt_html').length > 0, 'missing receipt rendering helper');
});

test('dedicated CI workflow enforces the bulk receipts auth boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/bulk-receipts-auth.yml', 'utf8');
  assert.match(workflow, /bulk-receipts-auth-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Bulk_receipts\.php/);
});
