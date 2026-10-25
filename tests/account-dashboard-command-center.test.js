const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboardPath = 'application/views/backend/admin/account_dashboard.php';
const dashboard = fs.readFileSync(path.join(root, dashboardPath), 'utf8');

test('account dashboard renders a finance command-center hierarchy', () => {
  assert.match(dashboard, /class="finance-command-center"/);
  assert.match(dashboard, /class="finance-command-center__header"/);
  assert.match(dashboard, /class="finance-summary-grid"/);
  assert.match(dashboard, /class="finance-services-grid"/);
  assert.match(dashboard, /class="finance-debt-card"/);
  assert.match(dashboard, /aria-label="Finance overview"/);
});

test('finance command center keeps the trusted summary figures visible', () => {
  for (const variable of [
    '$total_unpaid_invoice_amount',
    '$unpaid_invoices',
    '$total_income',
    '$payment_rows',
    '$total_expense',
    '$total_feeding_paid',
    '$total_classes_paid',
    '$total_fare_paid',
    '$total_feeding_owe',
    '$total_classes_owe',
    '$total_fare_owe'
  ]) {
    assert.match(dashboard, new RegExp(variable.replace('$', '\\$')));
  }
});

test('finance command center preserves existing finance navigation contracts', () => {
  assert.match(dashboard, /modal\/popup\/modal_unpaid_invoices\//);
  assert.match(dashboard, /admin\/expense/);
  assert.match(dashboard, /cft_student_receipt/);
  assert.match(dashboard, /fct_debtors/);
});

test('legacy tile-stats presentation is retired from the account dashboard', () => {
  assert.doesNotMatch(dashboard, /tile-stats/);
  assert.match(dashboard, /@media\s*\(max-width:\s*767px\)/);
  assert.match(dashboard, /finance-card:focus-visible/);
});
