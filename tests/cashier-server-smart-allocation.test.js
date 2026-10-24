const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const controllerPath = 'application/controllers/Cashier_smart_allocation.php';
const bridgePath = 'assets/js/cashier-server-smart-allocation.js';
const includePath = 'application/views/backend/include_main.php';

test('quick payment has a dedicated authenticated POST endpoint', () => {
  const controller = read(controllerPath);
  assert.match(controller, /class\s+Cashier_smart_allocation\s+extends\s+CI_Controller/);
  assert.match(controller, /admin_id/);
  assert.match(controller, /can_collect_daily_fees\s*\(/);
  assert.match(controller, /function\s+process\s*\(/);
  assert.match(controller, /method\s*\(\s*TRUE\s*\)/i);
  assert.match(controller, /405/);
});

test('server validates and reconstructs the quick-payment allocation from current wallet state', () => {
  const controller = read(controllerPath);
  assert.match(controller, /quick_amount/);
  assert.match(controller, /excess_credit_type/);
  assert.match(controller, /get_student_outstanding\s*\(/);
  assert.match(controller, /\['feeding',\s*'classes',\s*'breakfast',\s*'water',\s*'transport'\]/);
  assert.match(controller, /\['feeding',\s*'breakfast',\s*'classes',\s*'water',\s*'transport'\]/);
  assert.match(controller, /min\s*\(\s*\$remaining\s*,\s*\$arrears\s*\)/);
  assert.match(controller, /process_payment\s*\(/);
  assert.match(controller, /'payment_type'\s*=>\s*'mixed'/);
  assert.match(controller, /'allocations'\s*=>/);
  assert.match(controller, /'applied_total'\s*=>/);
});

test('quick-payment bridge reroutes only active quick payments and preserves manual allocation', () => {
  const bridge = read(bridgePath);
  assert.match(bridge, /ajaxPrefilter/);
  assert.match(bridge, /quickPaymentAmount/);
  assert.match(bridge, /excessCreditType/);
  assert.match(bridge, /processUrl/);
  assert.match(bridge, /smartProcessUrl/);
  assert.match(bridge, /quick_amount/);
  assert.match(bridge, /excess_credit_type/);
  assert.match(bridge, /amount\s*<=\s*0/);
});

test('cashier bridge is loaded only for the daily fee collection page', () => {
  const includeMain = read(includePath);
  assert.match(includeMain, /page_name\s*===\s*'daily_fee_collection'/);
  assert.match(includeMain, /cashier-server-smart-allocation\.js/);
  assert.match(includeMain, /cashier\/process_daily_fee_payment/);
  assert.match(includeMain, /cashier_smart_allocation\/process/);
});
