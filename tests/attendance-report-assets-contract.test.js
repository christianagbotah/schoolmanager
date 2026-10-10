const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const view = fs.readFileSync(path.join(root, 'application/views/backend/admin/students_daily_attendance_modern.php'), 'utf8');

function count(needle) {
  return view.split(needle).length - 1;
}

test('daily attendance report relies on shared bundles for DataTables and Chart.js', () => {
  assert.match(view, /includes_top\.php/);
  assert.match(view, /includes_bottom\.php/);

  const sharedAssets = [
    'dataTables.dataTables.css',
    'buttons.dataTables.css',
    'chart-3.9.1.min.js',
    'dataTables.js',
    'dataTables.buttons-3.0.2.js',
    'buttons.dataTables-3.2.4.js',
    'jszip.min.js',
    'pdfmake.min.js',
    'vfs_fonts.js',
    'buttons.html5.min.js'
  ];

  for (const asset of sharedAssets) {
    assert.equal(count(asset), 0, `${asset} must come only from the shared includes`);
  }
});

test('daily attendance report keeps only its report-specific date-range assets locally', () => {
  assert.equal(count('daterangepicker.css'), 1);
  assert.equal(count('moment.min.js'), 1);
  assert.equal(count('daterangepicker.min.js'), 1);
  assert.equal(count('attendance_report_modern.js'), 1);
  assert.equal(count('attendance_details_modal.js'), 1);
});
