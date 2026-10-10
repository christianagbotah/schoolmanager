const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const view = fs.readFileSync(path.join(root, 'application/views/backend/admin/students_daily_attendance_modern.php'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'application/controllers/Admin.php'), 'utf8');
const reportJs = fs.readFileSync(path.join(root, 'assets/backend/js/attendance_report_modern.js'), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

test('daily attendance report exposes every canonical attendance status as an exact filter', () => {
  const block = between(view, '<select id="filter-status"', '</select>');
  const expected = [
    ['', 'All Status'],
    ['1', 'Present'],
    ['2', 'Absent'],
    ['3', 'Late'],
    ['4', 'Sick at Home'],
    ['5', 'Sick at Clinic'],
    ['0', 'Not Marked']
  ];
  for (const [value, label] of expected) {
    assert.match(block, new RegExp(`<option\\s+value="${value}">${label}<\\/option>`));
  }
});

test('report backend applies the selected canonical status exactly instead of grouping statuses', () => {
  const block = between(admin, 'function getAttendanceReportData()', '\n\tfunction ');
  assert.match(block, /\(string\)\$att_status\s*!==\s*\(string\)\$status/);
  assert.doesNotMatch(block, /Present filter:\s*includes Present/);
  assert.doesNotMatch(block, /Absent filter:\s*includes Absent/);
});

test('attendance report keeps configured-period filters hidden and date range picker clickable', () => {
  const filters = between(view, '<div class="filters-single-row">', '<!-- Data Table Section -->');
  assert.match(filters, /id="date-range"/);
  assert.doesNotMatch(filters, /filter-(session|year|term)/i);
  assert.match(reportJs, /\$\('#date-range'\)\.daterangepicker\s*\(/);
});

test('attendance report uses human-readable sick-location wording throughout', () => {
  assert.match(view, /Sick at Home:/);
  assert.match(view, /Sick at Clinic:/);
  assert.match(reportJs, /statusText\s*=\s*'Sick at Home'/);
  assert.match(reportJs, /statusText\s*=\s*'Sick at Clinic'/);
  assert.doesNotMatch(view, /Sick\s*-\s*Home|Sick\s*-\s*Clinic/);
  assert.doesNotMatch(reportJs, /Sick\s*-\s*Home|Sick\s*-\s*Clinic/);
});
