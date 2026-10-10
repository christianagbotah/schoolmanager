const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboardPath = path.join(root, 'application/views/backend/admin/dashboard.php');
const uiScriptPath = path.join(root, 'assets/js/ui-consistency.js');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');
const uiScript = fs.readFileSync(uiScriptPath, 'utf8');

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
        'Students with Outstanding Bills',
        'Bad Debt',
        'Total Income',
        'Total Expenses'
    ]);

    assert.match(block, /data-dashboard-kpi-row=["']financial-performance["'][^>]*class=["'][^"']*lg:grid-cols-4/);
    assert.match(block, /data-dashboard-kpi-row=["']financial-risk["'][^>]*class=["'][^"']*lg:grid-cols-4/);

    const expensesIndex = block.indexOf('Total Expenses');
    const creditsIndex = block.indexOf('Student Credits');
    assert.ok(creditsIndex === -1 || creditsIndex > expensesIndex, 'Student Credits must not displace the approved KPI rows');
});

test('financial KPI values use the approved legacy semantics', () => {
    const block = section('<!-- Financial Overview', '<!-- Charts Section -->');
    assert.match(block, /\$total_revenue/);
    assert.match(block, /\$fee_arrears/);
    assert.match(block, /\$daily_revenue/);
    assert.match(block, /\$collection_rate/);
    assert.match(block, /\$active_pending_payments/);
    assert.match(block, /\$bad_debt_count/);
    assert.match(block, /\$total_income/);
    assert.match(block, /\$total_expenses/);
});

test('server-rendered dashboard remains the single source of truth for finance KPIs', () => {
    assert.match(dashboard, /data-dashboard-kpi-row=["']financial-performance["']/);
    assert.match(dashboard, /data-dashboard-kpi-row=["']financial-risk["']/);
    assert.doesNotMatch(uiScript, /composeAdminDashboardSummary/);
    assert.doesNotMatch(uiScript, /sm-dashboard-approved-summary/);
    assert.doesNotMatch(uiScript, /data-sm-dashboard-source-grid/);
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
