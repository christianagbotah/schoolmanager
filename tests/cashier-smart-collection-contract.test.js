const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const viewPath = path.join(__dirname, '..', 'application', 'views', 'backend', 'admin', 'daily_fee_collection.php');
const view = fs.readFileSync(viewPath, 'utf8');

test('cashier exposes one smart amount entry in Ghana cedis', () => {
  assert.match(view, /id=["']amount_received["']/);
  assert.match(view, /₵/);
  assert.doesNotMatch(view, /GHS\s+0\.00/);
});

test('smart allocation keeps the legacy fee amount contract', () => {
  for (const fee of ['feeding', 'breakfast', 'classes', 'water', 'transport']) {
    assert.match(view, new RegExp(`name=["']${fee}_amount["']`));
  }
  assert.match(view, /function\s+allocateSmartPayment\s*\(/);
  assert.match(view, /feeAllocationPriority/);
});

test('cashier uses real wallet balances and preserves receipt-capable payment processing', () => {
  assert.match(view, /cashier\/get_student_wallet_details/);
  assert.match(view, /cashier\/process_daily_fee_payment/);
  assert.match(view, /transaction_code/);
  assert.match(view, /print_daily_fee_receipt/);
});

test('cashier smart collection is responsive and shows an allocation preview', () => {
  assert.match(view, /id=["']allocation_preview["']/);
  assert.match(view, /@media\s*\(max-width:\s*767px\)/);
  assert.match(view, /aria-live=["']polite["']/);
});
