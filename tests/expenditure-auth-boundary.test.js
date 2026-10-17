const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Expenditure.php';
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

test('Expenditure enforces admin authentication in its constructor', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /!=\s*1|!==\s*1/);
  assert.match(ctor, /is_ajax_request\s*\(\s*\)/, 'AJAX expenditure feeds should receive an API-safe denial');
  assert.match(ctor, /set_status_header\s*\(\s*401\s*\)/, 'unauthenticated AJAX requests must return HTTP 401');
  assert.match(ctor, /redirect\s*\(\s*site_url\('login'\)\s*,\s*'location'\s*,\s*302\s*\)/, 'browser report routes should use an explicit HTTP 302 login redirect');
  assert.match(ctor, /exit\s*;/, 'constructor denial must terminate dispatch');
});

test('all expenditure data and mutation routes rely on the constructor boundary', () => {
  for (const name of [
    'add_expenditure',
    'edit_expenditure',
    'delete_expenditure',
    'getAllExpendituresDataTable',
    'printAllExpenditure'
  ]) {
    assert.ok(methodBody(name).length > 0, `missing ${name}()`);
  }

  for (const name of ['add_expenditure', 'edit_expenditure', 'delete_expenditure']) {
    assert.doesNotMatch(methodBody(name), /admin_login/, `auth should be centralized in the constructor, not repeated in ${name}()`);
  }
});

test('dedicated CI workflow enforces the expenditure auth boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/expenditure-auth.yml', 'utf8');
  assert.match(workflow, /expenditure-auth-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Expenditure\.php/);
});
