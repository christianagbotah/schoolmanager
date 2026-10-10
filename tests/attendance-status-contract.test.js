const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const adminMarking = fs.readFileSync(path.join(root, 'application/views/backend/admin/manage_attendance_view.php'), 'utf8');
const sharedMarking = fs.readFileSync(path.join(root, 'application/views/backend/attendance/mark_attendance.php'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'application/views/backend/admin/attendance_analytics_report.php'), 'utf8');
const adminController = fs.readFileSync(path.join(root, 'application/controllers/Admin.php'), 'utf8');

const expectedStatuses = [
  [1, 'Present (P)'],
  [2, 'Absent (A)'],
  [3, 'Late (L)'],
  [4, 'Sick at Home (S)'],
  [5, 'Sick at Clinic (C)']
];

function assertStatusContract(source, surface) {
  for (const [value, label] of expectedStatuses) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(
      source,
      new RegExp(`<option\\s+value=["']${value}["'][\\s\\S]{0,220}?${escaped}\\s*<\\/option>`),
      `${surface}: status ${value} must render as ${label}`
    );
  }
  assert.doesNotMatch(source, /Busy\s*\(B\)/, `${surface}: status 3 must never be labelled Busy`);
}

test('admin attendance marking uses the canonical five-status mapping', () => {
  assertStatusContract(adminMarking, 'admin attendance marking');
});

test('shared attendance marking uses the same canonical five-status mapping', () => {
  assertStatusContract(sharedMarking, 'shared attendance marking');
});

test('attendance analytics use human-readable sick-location labels', () => {
  assert.match(analytics, /Sick at Home/);
  assert.match(analytics, /Sick at Clinic/);
  assert.doesNotMatch(analytics, /Sick-Home/);
  assert.doesNotMatch(analytics, /Sick-Clinic/);
});


test('late status remains present-like for daily-fee charging in the legacy admin flow', () => {
  assert.match(adminMarking, /const\s+isAbsent\s*=\s*status\s*!=\s*['"]1['"]\s*&&\s*status\s*!=\s*['"]3['"]\s*;/);
  assert.match(adminController, /if\s*\(\s*\$status\s*==\s*1\s*\|\|\s*\$status\s*==\s*3\s*\)\s*\{[\s\S]{0,700}?process_daily_charges/);
});
