const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controller = fs.readFileSync('application/controllers/Expense_management.php', 'utf8');
const primaryView = fs.readFileSync('application/views/backend/admin/expense_management.php', 'utf8');
const accountsView = fs.readFileSync('application/views/backend/admin/accounts/expense_management.php', 'utf8');

function phpMethodBody(source, name) {
  const re = new RegExp(`(?:public|private|protected)?\\s*function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
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

function sectionBetween(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing section ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section terminator ${end}`);
  return source.slice(from, to);
}

test('approve and delete require POST and fail closed with HTTP 405 JSON', () => {
  const guard = phpMethodBody(controller, 'requirePostMutation');
  assert.match(guard, /\$this->input->method\s*\(\s*TRUE\s*\)/);
  assert.match(guard, /(?:!==|!=)\s*['"]POST['"]/);
  assert.match(guard, /set_status_header\s*\(\s*405\s*\)/);
  assert.match(guard, /set_content_type\s*\(\s*['"]application\/json['"]\s*\)/);
  assert.match(guard, /exit\s*;/, 'wrong-method denial must terminate dispatch');

  for (const name of ['approve', 'delete']) {
    assert.match(phpMethodBody(controller, name), /\$this->requirePostMutation\s*\(\s*\)\s*;/, `${name}() must enforce POST before mutating state`);
  }
});

test('primary expense approval uses POST and sends the rendered CSRF token', () => {
  const approve = sectionBetween(primaryView, 'function approveExpense(', 'function showRejectModal(');
  assert.match(approve, /type:\s*['"]POST['"]/);
  assert.doesNotMatch(approve, /type:\s*['"]GET['"]/);
  assert.match(approve, /get_csrf_token_name\s*\(\s*\)/);
  assert.match(approve, /get_csrf_hash\s*\(\s*\)/);
});

test('accounts expense approval remains POST and sends the rendered CSRF token', () => {
  const approve = sectionBetween(accountsView, 'function approveExpense(', 'function rejectExpense(');
  assert.match(approve, /type:\s*['"]POST['"]/);
  assert.doesNotMatch(approve, /type:\s*['"]GET['"]/);
  assert.match(approve, /get_csrf_token_name\s*\(\s*\)/);
  assert.match(approve, /get_csrf_hash\s*\(\s*\)/);
});

test('expense read endpoints remain GET in the primary view', () => {
  for (const [start, end] of [
    ['function loadExpenses(', 'function renderExpenses('],
    ['function loadStatistics(', 'function showCreateExpenseModal(']
  ]) {
    const section = sectionBetween(primaryView, start, end);
    assert.match(section, /type:\s*['"]GET['"]/);
  }
});

test('dedicated CI workflow enforces the expense mutation safety contract', () => {
  const workflow = fs.readFileSync('.github/workflows/expense-management-mutation-safety.yml', 'utf8');
  assert.match(workflow, /expense-management-mutation-safety\.test\.js/);
  assert.match(workflow, /php -l application\/controllers\/Expense_management\.php/);
  assert.match(workflow, /php -l application\/views\/backend\/admin\/expense_management\.php/);
  assert.match(workflow, /php -l application\/views\/backend\/admin\/accounts\/expense_management\.php/);
});
