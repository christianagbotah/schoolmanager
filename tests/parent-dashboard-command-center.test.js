const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboardPath = path.join(root, 'application/views/backend/parent/dashboard.php');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');

function section(startMarker, endMarker) {
    const start = dashboard.indexOf(startMarker);
    const end = dashboard.indexOf(endMarker, start + startMarker.length);
    assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);
    assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
    return dashboard.slice(start, end);
}

test('parent dashboard initializes empty-family counters before conditional queries', () => {
    assert.match(dashboard, /\$n_teachers\s*=\s*0\s*;/);
    assert.match(dashboard, /\$subj_rows\s*=\s*0\s*;/);
    assert.match(dashboard, /\$present_today\s*=\s*0\s*;/);
    assert.match(dashboard, /\$teachers_ids_array\s*=\s*array\(\)\s*;/);
});

test('parent dashboard exposes a family command center with resilient child summaries', () => {
    assert.match(dashboard, /data-parent-command-center=["']true["']/);
    assert.match(dashboard, /data-parent-child-summary/);
    assert.match(dashboard, /data-parent-quick-actions/);
    assert.match(dashboard, /data-parent-attendance-summary/);
});

test('parent command center keeps the core navigation shortcuts', () => {
    const block = section('<!-- Parent Family Command Center -->', '<!-- Parent Events Calendar -->');
    assert.match(block, /parents\/student_information/);
    assert.match(block, /parents\/attendance_report/);
    assert.match(block, /parents\/marks/);
    assert.match(block, /parents\/invoice/);
    assert.match(block, /parents\/message/);
});

test('teacher birthday query is guarded when there are no active teacher ids', () => {
    assert.match(dashboard, /if\s*\(!empty\(\$teachers_ids_array\)\)/);
});

test('parent command center retains the existing notice calendar contract', () => {
    assert.match(dashboard, /id=["']notice_calendar["']/);
    assert.match(dashboard, /fullCalendar\(/);
    assert.match(dashboard, /noticeboard/);
});
