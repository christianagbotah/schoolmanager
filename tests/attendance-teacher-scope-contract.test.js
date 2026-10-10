const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'application/controllers/Attendance.php'), 'utf8');

function method(name, nextName) {
  const start = controller.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing method ${name}`);
  const end = nextName ? controller.indexOf(`function ${nextName}(`, start + 1) : controller.length;
  assert.notEqual(end, -1, `missing next method ${nextName}`);
  return controller.slice(start, end);
}

test('attendance controller has a teacher class ownership guard using the canonical session identity', () => {
  assert.match(controller, /private\s+function\s+can_access_class\s*\(\s*\$class_id\s*\)/);
  assert.match(controller, /userdata\(['"]login_type['"]\)[\s\S]{0,250}['"]teacher['"]/);
  assert.match(controller, /userdata\(['"]login_user_id['"]\)/);
  assert.match(controller, /['"]class_id['"]\s*=>\s*\$class_id/);
  assert.match(controller, /['"]teacher_id['"]\s*=>\s*\$teacher_id/);
});

test('teacher class guard is enforced before the mark page loads class data', () => {
  const block = method('mark', 'get_student_data');
  const guard = block.indexOf('can_access_class($class_id)');
  const sectionLookup = block.indexOf("get_where('section'");
  assert.ok(guard >= 0, 'mark must enforce class ownership');
  assert.ok(sectionLookup >= 0, 'mark must load section data');
  assert.ok(guard < sectionLookup, 'mark guard must run before class data is loaded');
  assert.match(block, /show_error\([\s\S]{0,180}403/);
});

test('teacher class guard protects attendance student-data AJAX', () => {
  const block = method('get_student_data', 'save');
  assert.match(block, /can_access_class\(\$class_id\)/);
  assert.match(block, /deny_class_access_json\s*\(\s*\)/);
});

test('teacher class guard protects attendance saves before fee processing', () => {
  const block = method('save', 'get_stats');
  const guard = block.indexOf('can_access_class($class_id)');
  const save = block.indexOf('save_attendance_and_fees');
  assert.ok(guard >= 0, 'save must enforce class ownership');
  assert.ok(save >= 0, 'save must call enterprise persistence');
  assert.ok(guard < save, 'save guard must run before attendance/fee persistence');
  assert.match(block, /deny_class_access_json\s*\(\s*\)/);
});
