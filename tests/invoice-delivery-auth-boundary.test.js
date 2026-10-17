const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function source(path) {
  return fs.readFileSync(path, 'utf8');
}

function methodBody(code, name) {
  const re = new RegExp(`(?:public\\s+|private\\s+|protected\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
  const match = re.exec(code);
  assert.ok(match, `missing ${name}()`);
  let depth = 0;
  let started = false;
  for (let i = match.index; i < code.length; i++) {
    if (code[i] === '{') { depth++; started = true; }
    if (code[i] === '}') depth--;
    if (started && depth === 0) return code.slice(match.index, i + 1);
  }
  throw new Error(`unterminated ${name}()`);
}

function assertAdminBoundary(path) {
  const code = source(path);
  const ctor = methodBody(code, '__construct');
  assert.match(ctor, /session/, `${path} must load/use session state`);
  assert.match(ctor, /admin_login/, `${path} must require an admin session`);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/, `${path} must provide an API-safe AJAX denial`);
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, `${path} AJAX auth failure must be HTTP 401`);
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, `${path} browser auth failure must be an explicit 302 login redirect`);
  assert.match(ctor, /exit\s*;/, `${path} auth denial must terminate dispatch`);
  return code;
}

test('Invoice_email requires admin authentication before invoice data can be emailed', () => {
  const code = assertAdminBoundary('application/controllers/Invoice_email.php');
  assert.ok(methodBody(code, 'send').length > 0);
  assert.ok(methodBody(code, 'bulk_send').length > 0);
});

test('Invoice_sms requires admin authentication before tokens or invoice links can be sent', () => {
  const code = assertAdminBoundary('application/controllers/Invoice_sms.php');
  assert.ok(methodBody(code, 'send').length > 0);
  assert.match(methodBody(code, 'send'), /invoice_access_tokens/, 'SMS send must remain the route that mints invoice access tokens');
});

test('dedicated CI workflow enforces both invoice delivery auth boundaries', () => {
  const workflow = source('.github/workflows/invoice-delivery-auth.yml');
  assert.match(workflow, /invoice-delivery-auth-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Invoice_email\.php/);
  assert.match(workflow, /php -l application\/controllers\/Invoice_sms\.php/);
});
