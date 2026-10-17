const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'application/controllers/Admin.php'), 'utf8');

function body(name) {
  const marker = `function ${name}`;
  const start = admin.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const matches = [];
  for (const prefix of ['\n\tfunction ', '\n\tpublic function ', '\n\tprivate function ', '\r\n\tfunction ', '\r\n\tpublic function ', '\r\n\tprivate function ']) {
    const i = admin.indexOf(prefix, start + marker.length);
    if (i !== -1) matches.push(i);
  }
  return admin.slice(start, matches.length ? Math.min(...matches) : admin.length);
}

test('Admin constructor delegates non-admin access to a role-aware route boundary', () => {
  const ctor = body('__construct');
  assert.match(ctor, /enforce_cross_role_route_boundary\s*\(/);
});

test('route boundary trusts admin_login and validates non-admin role flags', () => {
  const fn = body('enforce_cross_role_route_boundary');
  assert.match(fn, /admin_login/);
  assert.match(fn, /teacher_login/);
  assert.match(fn, /parent_login/);
  assert.match(fn, /student_login/);
  assert.match(fn, /fetch_method\s*\(/);
  assert.match(fn, /403/);
});

test('parent and student cannot reach conduct or message-file mutation through Admin', () => {
  const fn = body('shared_admin_route_allowlist');
  for (const role of ['parent', 'student']) {
    const start = fn.indexOf(`'${role}'`);
    assert.notEqual(start, -1);
    const end = fn.indexOf('],', start);
    const section = fn.slice(start, end);
    assert.doesNotMatch(section, /['"]conducts_update['"]/);
    assert.doesNotMatch(section, /['"]deleted_messages_id['"]/);
  }
});

test('teacher shared routes exclude destructive student and subject administration', () => {
  const fn = body('shared_admin_route_allowlist');
  const start = fn.indexOf("'teacher'");
  const end = fn.indexOf('],', start);
  const section = fn.slice(start, end);
  for (const method of ['bulk_students_delete', 'student_add', 'student_promotion', 'section_subject_edit', 'update_subjects_creche']) {
    assert.doesNotMatch(section, new RegExp(`['"]${method}['"]`));
  }
  for (const method of ['attendance_update', 'marks_update', 'conducts_update']) {
    assert.match(section, new RegExp(`['"]${method}['"]`));
  }
});

test('unknown authenticated roles are denied rather than inheriting Admin access', () => {
  const fn = body('enforce_cross_role_route_boundary');
  assert.match(fn, /shared_admin_route_allowlist/);
  assert.match(fn, /show_error\s*\([^)]*403|set_status_header\s*\(\s*403/);
});


test('parent and student result views do not expose conduct mutation forms', () => {
  for (const role of ['parent', 'student']) {
    const dir = path.join(root, 'application/views/backend', role);
    const stack = [dir];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith('.php')) {
          const source = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(source, /site_url\s*\(\s*['"]admin\/conducts_update['"]/i, `${full} must not post conduct changes through Admin`);
          assert.doesNotMatch(source, /name=["']save_conducts["'][^>]*type=["']submit["']|type=["']submit["'][^>]*name=["']save_conducts["']/i, `${full} must not expose a conduct save submit`);
        }
      }
    }
  }
});


test('parent and student message views do not call legacy Admin message-file tracking', () => {
  for (const role of ['parent', 'student']) {
    const source = fs.readFileSync(path.join(root, 'application/views/backend', role, 'message_read.php'), 'utf8');
    assert.doesNotMatch(source, /admin\/deleted_messages_id/i);
  }
});


test('every remaining role-view Admin route is explicitly allowed for that role', () => {
  const allowFn = body('shared_admin_route_allowlist');
  function allowed(role) {
    const match = allowFn.match(new RegExp(`'${role}'\\s*=>\\s*\\[([^\\]]*)\\]`));
    assert.ok(match, `${role} allowlist must exist`);
    return new Set([...match[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  }
  for (const role of ['parent', 'student', 'teacher']) {
    const routes = new Set();
    const stack = [path.join(root, 'application/views/backend', role)];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith('.php')) {
          const source = fs.readFileSync(full, 'utf8');
          for (const m of source.matchAll(/site_url\s*\(\s*['"]admin\/([A-Za-z0-9_]+)/g)) routes.add(m[1]);
        }
      }
    }
    const roleAllowed = allowed(role);
    const missing = [...routes].filter((route) => !roleAllowed.has(route)).sort();
    assert.deepEqual(missing, [], `${role} views contain blocked Admin routes: ${missing.join(', ')}`);
  }
});

test('obsolete Admin message-file tracking handlers are removed', () => {
  assert.doesNotMatch(admin, /function\s+deleted_messages_id\s*\(/);
  assert.doesNotMatch(admin, /function\s+get_deleted_messages_id\s*\(/);
});
