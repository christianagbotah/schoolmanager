const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const adminPath = path.join(root, 'application/controllers/Admin.php');
const admin = fs.readFileSync(adminPath, 'utf8');

function body(name) {
  const re = new RegExp(`(?:public\\s+|private\\s+|protected\\s+)?function\\s+${name}\\s*\\(`);
  const match = re.exec(admin);
  assert.ok(match, `${name} must exist`);
  const start = match.index;
  const tail = admin.slice(match.index + match[0].length);
  const next = /\r?\n\s*(?:public\s+|private\s+|protected\s+)?function\s+[A-Za-z0-9_]+\s*\(/.exec(tail);
  return admin.slice(start, next ? match.index + match[0].length + next.index : admin.length);
}

test('parent and student allowlists exclude class-wide tabulation routes', () => {
  const fn = body('shared_admin_route_allowlist');
  for (const role of ['parent', 'student']) {
    const match = fn.match(new RegExp(`'${role}'\\s*=>\\s*\\[([^\\]]*)\\]`));
    assert.ok(match, `${role} allowlist must exist`);
    assert.doesNotMatch(match[1], /tabulation_sheet/);
  }
});

test('class-wide parent/student tabulation views are not shipped', () => {
  for (const role of ['parent', 'student']) {
    for (const file of ['tabulation_sheet.php', 'tabulation_sheet_raw_score.php']) {
      assert.equal(fs.existsSync(path.join(root, 'application/views/backend', role, file)), false, `${role}/${file} must be retired`);
    }
  }
});

test('cross-role boundary applies record scope after method allowlist', () => {
  const boundary = body('enforce_cross_role_route_boundary');
  assert.match(boundary, /enforce_shared_record_scope\s*\(\s*\$role\s*,\s*\$method\s*\)/);
});

test('student report scope binds student sessions to their own student id and parent sessions to children', () => {
  const scope = body('enforce_shared_record_scope');
  const auth = body('is_shared_student_authorised');
  const ids = body('shared_authorised_student_ids');
  assert.match(scope, /student_marksheet/);
  assert.match(scope, /student_results_sheet/);
  assert.match(scope, /student_results_sheet_creche/);
  assert.match(scope, /student_marksheet_print_view/);
  assert.match(scope, /student_marksheet_print_view_creche/);
  assert.match(scope, /student_results_sheet_print_view/);
  assert.match(scope, /uri->segment\s*\(\s*3\s*\)/);
  assert.match(scope, /input->post\s*\(\s*['"]student_id['"]/);
  assert.match(scope, /is_shared_student_authorised/);
  assert.match(ids, /student_login/);
  assert.match(ids, /session->userdata\s*\(\s*['"]student_id['"]/);
  assert.match(ids, /parent_login/);
  assert.match(ids, /session->userdata\s*\(\s*['"]parent_id['"]/);
  assert.match(ids, /where\s*\(\s*['"]parent_id['"]/);
  assert.match(auth, /shared_authorised_student_ids/);
});

test('invoice term metadata is record-scoped before lookup output', () => {
  const scope = body('enforce_shared_record_scope');
  assert.match(scope, /get_invoice_term/);
  assert.match(scope, /invoice_code/);
  assert.match(scope, /select\s*\(\s*['"]student_id['"]/);
  assert.match(scope, /get\s*\(\s*['"]invoice['"]/);
  assert.match(scope, /is_shared_student_authorised/);
});

test('shared record denial is fail closed with HTTP 403', () => {
  const scope = body('enforce_shared_record_scope');
  assert.match(scope, /deny_shared_record_access/);
  const deny = body('deny_shared_record_access');
  assert.match(deny, /set_status_header\s*\(\s*403\s*\)/);
  assert.match(deny, /show_error\s*\([^)]*403/);
});

test('classmate selector rows are filtered for parent/student sessions', () => {
  const filter = body('filter_shared_report_students');
  assert.match(filter, /shared_authorised_student_ids/);
  assert.match(filter, /student_id/);
  const assignments = [...admin.matchAll(/\$page_data\[['"]other_students['"]\]\s*=\s*([^;]+);/g)];
  assert.ok(assignments.length >= 1, 'report code must assign other_students');
  for (const match of assignments) {
    assert.match(match[1], /filter_shared_report_students/);
  }
});
