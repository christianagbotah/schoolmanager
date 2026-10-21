const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Cashier.php';
const controller = fs.readFileSync(controllerPath, 'utf8');
const viewDir = 'application/views/backend/cashier';

function read(name) {
  return fs.readFileSync(`${viewDir}/${name}`, 'utf8');
}

test('cashier workspace has all controller-routed core views', () => {
  for (const name of ['cashier_dashboard.php', 'daily_fee_collection.php', 'daily_fee_receipt.php', 'daily_collection_report.php']) {
    assert.ok(fs.existsSync(`${viewDir}/${name}`), `missing ${name}`);
  }
});

test('collection workspace uses cashier-native wallet and payment endpoints', () => {
  const view = read('daily_fee_collection.php');
  assert.match(view, /cashier\/search_student_for_daily_fees/);
  assert.match(view, /cashier\/get_student_wallet_details/);
  assert.match(view, /cashier\/process_daily_fee_payment/);
  assert.match(view, /total_arrears/);
  assert.match(view, /total_balance/);
  assert.match(view, /payment_type/);
  assert.match(view, /feeding_amount/);
  assert.match(view, /breakfast_amount/);
  assert.match(view, /classes_amount/);
  assert.match(view, /water_amount/);
  assert.match(view, /transport_amount/);
});

test('cashier money UI uses Ghana cedi symbol instead of GHS text', () => {
  for (const name of ['cashier_dashboard.php', 'daily_fee_collection.php', 'daily_fee_receipt.php', 'daily_collection_report.php']) {
    const view = read(name);
    assert.match(view, /₵/, `${name} should display the Ghana cedi symbol`);
    assert.doesNotMatch(view, /\bGHS\b/, `${name} should not display GHS`);
  }
});

test('cashier controller exposes wallet totals and recent payment history to POS', () => {
  const bodyStart = controller.indexOf('function get_student_wallet_details');
  assert.ok(bodyStart >= 0, 'missing get_student_wallet_details');
  const body = controller.slice(bodyStart, controller.indexOf('/**', bodyStart + 20));
  assert.match(body, /get_student_outstanding/);
  assert.match(body, /get_payment_history/);
  assert.match(body, /['\"]total_balance['\"]\s*=>/);
  assert.match(body, /['\"]total_arrears['\"]\s*=>/);
  assert.match(body, /['\"]payment_history['\"]\s*=>/);
});

test('payment success offers a printable cashier receipt', () => {
  const view = read('daily_fee_collection.php');
  assert.match(view, /print_daily_fee_receipt/);
  assert.match(view, /transaction_code/);
});

test('cashier workspace includes responsive mobile handling', () => {
  const collection = read('daily_fee_collection.php');
  assert.match(collection, /@media\s*\(max-width:\s*767px\)/);
  assert.match(collection, /position:\s*sticky|sticky/i);
});
