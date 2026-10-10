const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboardPath = path.join(root, 'application/views/backend/admin/dashboard.php');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');

function ordered(text, labels) {
    let cursor = -1;
    for (const label of labels) {
        const next = text.indexOf(label, cursor + 1);
        assert.notEqual(next, -1, `Missing dashboard label: ${label}`);
        assert.ok(next > cursor, `Dashboard label is out of order: ${label}`);
        cursor = next;
    }
}

function section(startMarker, endMarker) {
    const start = dashboard.indexOf(startMarker);
    const end = dashboard.indexOf(endMarker, start + startMarker.length);
    assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);
    assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
    return dashboard.slice(start, end);
}

test('primary people KPI row keeps the approved order', () => {
    const block = section('<!-- Key Metrics Cards -->', '<!-- Financial Overview');
    ordered(block, ['Total Students', 'Active Teachers', 'Active Parents', 'Attendance']);
    assert.match(block, /grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-4/);
});

test('financial KPI rows keep the approved business order and four-card desktop layout', () => {
    const block = section('<!-- Financial Overview', '<!-- Charts Section -->');

    ordered(block, [
        'Collected',
        'Fee Arrears',
        'Daily Revenue',
        'Collection Rate',
        'Outstanding Bills',
        'Bad Debt',
        'Total Income',
        'Total Expenses'
    ]);

    assert.match(block, /data-dashboard-kpi-row=["']financial-performance["'][^>]*class=["'][^"']*lg:grid-cols-4/);
    assert.match(block, /data-dashboard-kpi-row=["']financial-risk["'][^>]*class=["'][^"']*lg:grid-cols-4/);
    assert.doesNotMatch(block, />Student Credits</);
});

test('dashboard analytics preserve paired two-column desktop layouts', () => {
    const block = section('<!-- Charts Section -->', '<!-- Quick Actions -->');
    assert.match(block, /grid-cols-1\s+lg:grid-cols-2/);
    assert.match(block, /grid-cols-1\s+md:grid-cols-2/);
    ordered(block, [
        'Student Distribution by Class',
        'Attendance Trend (Last 7 Days)',
        'Gender Distribution by Class',
        'Residential Distribution by Class'
    ]);
});
