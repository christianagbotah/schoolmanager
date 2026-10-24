const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const viewPath = 'application/views/backend/teacher/view_online_exam_results.php';
const view = fs.readFileSync(viewPath, 'utf8');

test('teacher online exam results exposes a results workspace summary', () => {
  assert.match(view, /exam-results-workspace/);
  assert.match(view, /result-kpi-grid/);
  assert.match(view, /Enrolled|enrolled/i);
  assert.match(view, /Attempted|attempted/i);
  assert.match(view, /Passed|passed/i);
  assert.match(view, /Absent|absent/i);
  assert.match(view, /Average|average/i);
});

test('results are loaded once for the exam and mapped by student', () => {
  assert.match(view, /online_exam_result/);
  assert.match(view, /results_by_student/);
  const resultQueryCount = (view.match(/get_where\(['"]online_exam_result['"]/g) || []).length;
  assert.ok(resultQueryCount <= 1, `expected at most one online_exam_result get_where call, found ${resultQueryCount}`);
});

test('results workspace preserves the export table contract and adds readable statuses', () => {
  assert.match(view, /id=["']table_export["']/);
  assert.match(view, /result-status/);
  assert.match(view, /is-pass/);
  assert.match(view, /is-fail/);
  assert.match(view, /is-absent/);
});

test('results workspace is responsive and accessible', () => {
  assert.match(view, /aria-labelledby=["']examResultsHeading["']/);
  assert.match(view, /aria-label=["']Exam results summary["']/);
  assert.match(view, /@media\s*\(max-width:\s*767px\)/);
});
