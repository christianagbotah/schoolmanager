const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const viewPath = 'application/views/backend/teacher/manage_online_exam.php';
const view = fs.readFileSync(viewPath, 'utf8');

test('teacher online exam management exposes the existing create-exam workflow', () => {
  assert.match(view, /teacher\/create_online_exam/);
  assert.match(view, /exam-action-create/);
});

test('teacher online exam management prepares one safe visible-exam collection before rendering rows', () => {
  assert.match(view, /\$visible_exams\s*=\s*\[/);
  assert.match(view, /\$exam_counts\s*=\s*\[/);
  assert.match(view, /foreach\s*\(\s*\$online_exams\s+as\s+\$row\s*\)/);
  assert.match(view, /if\s*\(\s*!\$class\s*\|\|\s*!\$subject\s*\|\|\s*!\$section\s*\)/);
  assert.match(view, /\$visible_exams\[\]\s*=\s*\$row/);
});

test('teacher online exam rows no longer dereference missing academic records inline', () => {
  assert.doesNotMatch(view, /->row\(\)->teacher_id/);
  assert.doesNotMatch(view, /->row\(\)->name/);
  assert.doesNotMatch(view, /->row\(\)->name_numeric/);
});

test('teacher online exam command center shows useful exam status counts', () => {
  for (const key of ['total', 'published', 'pending', 'expired']) {
    assert.match(view, new RegExp(`exam_counts\\[['\"]${key}['\"]\\]`));
  }
  assert.match(view, /exam-kpi-grid/);
});

test('teacher online exam command center keeps all existing exam actions', () => {
  for (const route of [
    'teacher/manage_online_exam_question/',
    'teacher/update_online_exam/',
    'teacher/manage_online_exam_status/',
    'teacher/view_online_exam_result/',
    'teacher/manage_online_exam/delete/'
  ]) {
    assert.ok(view.includes(route), `missing existing route ${route}`);
  }
});

test('teacher online exam output escapes stored labels and supports mobile layout', () => {
  assert.match(view, /html_escape\(\$row\[['\"]title['\"]\]\)/);
  assert.match(view, /html_escape\(\$row\[['\"]class_display['\"]\]\)/);
  assert.match(view, /html_escape\(\$row\[['\"]section_display['\"]\]\)/);
  assert.match(view, /html_escape\(\$row\[['\"]subject_display['\"]\]\)/);
  assert.match(view, /@media\s*\(max-width:\s*767px\)/);
});
