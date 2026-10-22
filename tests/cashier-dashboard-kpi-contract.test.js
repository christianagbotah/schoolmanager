const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dashboardPath = path.join(__dirname, '..', 'application', 'views', 'backend', 'cashier', 'cashier_dashboard.php');
const view = fs.readFileSync(dashboardPath, 'utf8');

test('cashier dashboard exposes visible today KPI cards in Ghana cedis', () => {
  for (const key of ['today-total', 'receipt-count', 'cash-total', 'momo-total', 'bank-total', 'cheque-total']) {
    assert.match(view, new RegExp(`data-cashier-kpi=["']${key}["']`));
  }
  assert.match(view, /₵/);
});

test('today KPIs are scoped to the signed-in cashier and a timestamp range', () => {
  assert.match(view, /userdata\(["']admin_id["']\)/);
  assert.match(view, /payment_date\s*>=/);
  assert.match(view, /payment_date\s*</);
  assert.match(view, /collected_by/);
  assert.doesNotMatch(view, /FROM_UNIXTIME\s*\(/i);
});

test('dashboard keeps direct collection, report and fee-rate actions', () => {
  assert.match(view, /cashier\/daily_fee_collection/);
  assert.match(view, /cashier\/daily_collection_report/);
  assert.match(view, /cashier\/daily_fee_rates/);
});
