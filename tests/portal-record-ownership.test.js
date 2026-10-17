const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const parents = fs.readFileSync(path.join(root, 'application/controllers/Parents.php'), 'utf8');
const student = fs.readFileSync(path.join(root, 'application/controllers/Student.php'), 'utf8');

function body(source, name) {
  const re = new RegExp(`(?:public\\s+|private\\s+|protected\\s+)?function\\s+${name}\\s*\\(`);
  const match = re.exec(source);
  assert.ok(match, `${name} must exist`);
  const tail = source.slice(match.index + match[0].length);
  const next = /\r?\n\s*(?:public\s+|private\s+|protected\s+)?function\s+[A-Za-z0-9_]+\s*\(/.exec(tail);
  return source.slice(match.index, next ? match.index + match[0].length + next.index : source.length);
}

test('Parent constructor enforces child record scope after role authentication', () => {
  const ctor = body(parents, '__construct');
  assert.match(ctor, /parent_login/);
  assert.match(ctor, /enforce_parent_record_scope\s*\(/);
});

test('Parent child scope maps sensitive routes and binds student ids to parent_id', () => {
  const scope = body(parents, 'enforce_parent_record_scope');
  const owns = body(parents, 'current_parent_owns_student');
  for (const method of ['academic_syllabus','marks','student_marksheet_print_view','student_results_sheet_print_view','student_results_sheet_print_view_creche','class_routine','class_routine_print_view','invoice','attendance_report','attendance_report_selector','attendance_report_view','attendance_report_print_view','get_marksheet','get_marksheet_raw_score']) {
    assert.match(scope, new RegExp(`['"]${method}['"]`), `${method} must be scoped`);
  }
  assert.match(scope, /uri->segment/);
  assert.match(scope, /current_parent_owns_student/);
  assert.match(owns, /session->userdata\s*\(\s*['"]parent_id['"]/);
  assert.match(owns, /where\s*\(\s*['"]student_id['"]/);
  assert.match(owns, /where\s*\(\s*['"]parent_id['"]/);
});

test('Student constructor enforces self record scope after role authentication', () => {
  const ctor = body(student, '__construct');
  assert.match(ctor, /student_login/);
  assert.match(ctor, /enforce_student_record_scope\s*\(/);
});

test('Student self scope covers report routes and compares against session student_id', () => {
  const scope = body(student, 'enforce_student_record_scope');
  for (const method of ['student_marksheet','student_results_sheet','student_marksheet_print_view','student_results_sheet_print_view','student_marksheet_creche','student_marksheet_print_view_creche','student_results_sheet_print_view_creche','class_routine_print_view','academic_syllabus','attendance_report_print_view']) {
    assert.match(scope, new RegExp(`['"]${method}['"]`), `${method} must be scoped`);
  }
  assert.match(scope, /session->userdata\s*\(\s*['"]student_id['"]/);
  assert.match(scope, /uri->segment/);
  assert.match(scope, /deny_student_record_access/);
});

test('legacy portal payment settlement methods are retired', () => {
  for (const source of [parents, student]) {
    for (const method of ['paypal_checkout','stripe_checkout','pay','pay_with_payumoney']) {
      assert.doesNotMatch(source, new RegExp(`function\\s+${method}\\s*\\(`));
    }
  }
  assert.doesNotMatch(parents, /function\s+bank_checkout\s*\(/);
});

test('portal invoice methods no longer contain legacy PayPal settlement writes', () => {
  for (const [label, source] of [['parent', parents], ['student', student]]) {
    const invoice = body(source, 'invoice');
    assert.doesNotMatch(invoice, /paypal_ipn|submit_paypal_post|validate_ipn|payment_method['"]?\s*\]?\s*=.*paypal|\$_POST\[['"]custom['"]\]/i, `${label} invoice must be Hubtel-only/read-only`);
  }
});

test('legacy portal payment views and commented checkout links are retired', () => {
  for (const rel of [
    'application/views/backend/paypal_checkout.php',
    'application/views/backend/stripe_checkout.php',
    'application/views/backend/parent/pay_with_payumoney.php',
    'application/views/backend/student/pay_with_payumoney.php',
    'application/views/backend/success.php',
    'application/views/backend/failure.php',
  ]) assert.equal(fs.existsSync(path.join(root, rel)), false, `${rel} must be retired`);

  assert.doesNotMatch(parents, /load->model\s*\(\s*['"](?:stripe_model|paypal_model)['"]\s*\)/);
  assert.doesNotMatch(student, /load->model\s*\(\s*['"](?:stripe_model|paypal_model)['"]\s*\)/);

  const studentInvoice = fs.readFileSync(path.join(root, 'application/views/backend/student/invoice.php'), 'utf8');
  assert.doesNotMatch(studentInvoice, /paypal_checkout|stripe_checkout|pay_with_payumoney/i);
});

test('portal record denials fail closed with HTTP 403', () => {
  assert.match(body(parents, 'deny_parent_record_access'), /set_status_header\s*\(\s*403\s*\)/);
  assert.match(body(student, 'deny_student_record_access'), /set_status_header\s*\(\s*403\s*\)/);
});


test('standalone PayUMoney callback controller is retired with its hard-coded secret', () => {
  assert.equal(fs.existsSync(path.join(root, 'application/controllers/Payumoney.php')), false);
  const roots = ['application/controllers', 'application/models', 'application/views', 'application/config'];
  const stack = roots.map((rel) => path.join(root, rel));
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.php$/i.test(entry.name)) assert.doesNotMatch(fs.readFileSync(full, 'utf8'), /GQs7yium/);
    }
  }
});
