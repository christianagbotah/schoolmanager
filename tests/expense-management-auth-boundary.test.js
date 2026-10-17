const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Expense_management.php';
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

test('Expense_management enforces admin authentication in its constructor', () => {
  const ctor = methodBody('__construct');
  assert.match(ctor, /admin_login/);
  assert.match(ctor, /!=\s*1|!==\s*1/);
  assert.match(ctor, /redirect\s*\(|set_status_header\s*\(|show_error\s*\(/);
  assert.match(ctor, /exit\s*;/, 'constructor denial must terminate dispatch, not merely return');
});

test('expense data and mutation methods rely on the constructor boundary rather than index-only auth', () => {
  const index = methodBody('index');
  const ctor = methodBody('__construct');
  assert.match(ctor, /admin_login/);
  for (const name of ['get_expenses','create','update','approve','reject','delete','get_categories','get_statistics','export_expenses']) {
    assert.ok(methodBody(name).length > 0, `missing ${name}()`);
  }
  assert.doesNotMatch(index, /admin_login/, 'auth should live in the constructor so every public route is protected');
});


test('dedicated CI workflow enforces the expense auth boundary', () => {
  const workflow = fs.readFileSync('.github/workflows/expense-management-auth.yml', 'utf8');
  assert.match(workflow, /expense-management-auth-boundary\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Expense_management\.php/);
});
