const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const uiScript = fs.readFileSync(path.join(root, 'assets/js/ui-consistency.js'), 'utf8');

test('admin dashboard keeps the approved KPI row order', () => {
    assert.match(uiScript, /ADMIN_DASHBOARD_ROW_TWO\s*=\s*\[\s*'Collected for term',\s*'Fee arrears',\s*'Daily Revenue',\s*'Collection Rate'\s*\]/);
    assert.match(uiScript, /ADMIN_DASHBOARD_ROW_THREE\s*=\s*\[\s*'Students with outstanding bills',\s*'Bad debt \/ muted students',\s*'Total Income',\s*'Total Expenses'\s*\]/);
});

test('admin dashboard composition uses four-column KPI rows and preserves student credits', () => {
    assert.match(uiScript, /function\s+composeAdminDashboardSummary\s*\(/);
    assert.match(uiScript, /lg:grid-cols-4/);
    assert.match(uiScript, /Student Credits/);
    assert.match(uiScript, /sm-dashboard-secondary-finance/);
});

test('dashboard composition is presentation-only and sources existing live cards', () => {
    assert.match(uiScript, /findDashboardMetric\s*\(/);
    assert.match(uiScript, /cloneNode\s*\(\s*true\s*\)/);
    assert.match(uiScript, /Termly Fees Collection/);
    assert.match(uiScript, /Unpaid Invoices/);
    assert.match(uiScript, /Outstanding Debt/);
});
