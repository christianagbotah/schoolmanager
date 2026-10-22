const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Cashier.php';
const controller = fs.readFileSync(controllerPath, 'utf8');
const preferenceControllerPath = 'application/controllers/Cashier_preferences.php';
const rendererPath = 'application/views/backend/include_main.php';
const renderer = fs.readFileSync(rendererPath, 'utf8');
const viewDir = 'application/views/backend/cashier';

function read(name) {
  return fs.readFileSync(`${viewDir}/${name}`, 'utf8');
}

test('cashier workspace has all controller-routed core views', () => {
  for (const name of ['cashier_dashboard.php', 'daily_fee_collection.php', 'daily_fee_receipt.php', 'daily_collection_report.php']) {
    assert.ok(fs.existsSync(`${viewDir}/${name}`), `missing ${name}`);
  }
});

test('main renderer routes cashier controller pages to the shared cashier workspace', () => {
  assert.match(renderer, /cashier_dashboard/);
  assert.match(renderer, /daily_fee_collection/);
  assert.match(renderer, /daily_collection_report/);
  assert.match(renderer, /include\s+['"]cashier\/["']\s*\.\s*\$page_name\s*\.\s*['"]\.php['"]/);
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

test('cashier POS supports one-amount smart allocation while preserving manual splits', () => {
  const view = read('daily_fee_collection.php');
  assert.match(view, /id=["']quickPaymentAmount["']/);
  assert.match(view, /id=["']smartAllocate["']/);
  assert.match(view, /id=["']excessCreditType["']/);
  assert.match(view, /function\s+allocateSmartPayment\s*\(/);
  assert.match(view, /feePriority\s*=\s*\[[^\]]*feeding[^\]]*classes[^\]]*breakfast[^\]]*water[^\]]*transport/s);
  assert.match(view, /arrears first/i);
  assert.match(view, /Advanced allocation/i);
});

test('optional breakfast and water preferences are read safely and never inferred from payment amounts', () => {
  assert.ok(fs.existsSync(preferenceControllerPath), 'missing cashier preference reader');
  const preferenceController = fs.readFileSync(preferenceControllerPath, 'utf8');
  assert.match(preferenceController, /get_student_preferences/);
  assert.match(preferenceController, /['\"]preferences['\"]\s*=>/);
  assert.match(preferenceController, /can_collect_daily_fees/);
  assert.match(preferenceController, /admin_id/);

  const view = read('daily_fee_collection.php');
  assert.match(view, /cashier_preferences\/student/);
  assert.match(view, /prefRes\.preferences/);
  assert.match(view, /preferencesLoaded/);
  const recalcStart = view.indexOf('function recalc()');
  const recalcEnd = view.indexOf('function renderSearch', recalcStart);
  assert.ok(recalcStart >= 0 && recalcEnd > recalcStart, 'missing recalc function');
  const recalcBody = view.slice(recalcStart, recalcEnd);
  assert.doesNotMatch(recalcBody, /breakfastOpted[^\n]*amountInput/);
  assert.doesNotMatch(recalcBody, /waterOpted[^\n]*amountInput/);
});

test('successful payment keeps the printable receipt visible while refreshing wallet balances', () => {
  const view = read('daily_fee_collection.php');
  assert.match(view, /function\s+loadStudent\s*\(studentId,\s*preserveReceipt\)/);

  const loadStart = view.indexOf('function loadStudent');
  const loadEnd = view.indexOf('function allocateSmartPayment', loadStart);
  assert.ok(loadStart >= 0 && loadEnd > loadStart, 'missing loadStudent function');
  const loadBody = view.slice(loadStart, loadEnd);
  assert.match(loadBody, /if\s*\(\s*!preserveReceipt\s*\)[\s\S]*receiptSuccess/);

  const submitStart = view.indexOf("$('#paymentForm').on('submit'");
  assert.ok(submitStart >= 0, 'missing payment form submit handler');
  const submitBody = view.slice(submitStart);
  assert.match(submitBody, /loadStudent\(selectedStudentId,\s*true\)/);
});

test('cashier student search and wallet detail use only the running academic enrollment', () => {
  for (const method of ['search_student_for_daily_fees', 'get_student_wallet_details']) {
    const start = controller.indexOf(`function ${method}`);
    assert.ok(start >= 0, `missing ${method}`);
    const end = controller.indexOf('/**', start + 20);
    const body = controller.slice(start, end > start ? end : controller.length);
    assert.match(body, /get_settings\(['"]running_year['"]\)/, `${method} must read running_year`);
    assert.match(body, /get_settings\(['"]running_term['"]\)/, `${method} must read running_term`);
    assert.match(body, /where\(['"]e\.year['"],\s*\$running_year\)/, `${method} must filter enrollment year`);
    assert.match(body, /where\(['"]e\.term['"],\s*\$running_term\)/, `${method} must filter enrollment term`);
  }
});
