const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const viewPath = 'application/views/backend/cashier/daily_fee_collection.php';
const view = fs.readFileSync(viewPath, 'utf8');

function between(startNeedle, endNeedle) {
  const start = view.indexOf(startNeedle);
  assert.ok(start >= 0, `missing ${startNeedle}`);
  const end = view.indexOf(endNeedle, start);
  assert.ok(end > start, `could not isolate ${startNeedle}`);
  return view.slice(start, end);
}

test('quick payment distinguishes the amount applied from physical cash tendered', () => {
  assert.match(view, /for="quickPaymentAmount">Amount to apply</);
  assert.match(view, /id="cashTenderPanel"/);
  assert.match(view, /id="cashTendered"[^>]*type="number"/);
  assert.match(view, /id="cashChangeDue"/);
  assert.match(view, /Cash tendered/);
  assert.match(view, /Change due/);
  assert.match(view, /does not change the amount posted/i);
});

test('cash tender helper is client-side only and cannot alter posted fee allocations', () => {
  const cashInput = view.match(/<input[^>]*id="cashTendered"[^>]*>/);
  assert.ok(cashInput, 'missing cash tender input');
  assert.doesNotMatch(cashInput[0], /\sname=/, 'cash tender input must not be serialized to the payment endpoint');
  assert.match(view, /function updateCashChange\s*\(total\)/);
  assert.match(view, /select\[name="payment_method"\]/);
});

test('cash helper calculates change and warns about optional tender shortfalls', () => {
  const body = between('function updateCashChange(total)', 'function renderSearch');
  assert.match(body, /tendered\s*-\s*total/);
  assert.match(body, /total\s*-\s*tendered/);
  assert.match(body, /Short by/);
  assert.match(body, /cashChangeDue/);
  assert.match(body, /cashTenderStatus/);
});

test('payment submit blocks only when an entered cash tender is below the amount being posted', () => {
  const body = between("$('#paymentForm').on('submit'", "})(jQuery)");
  assert.match(body, /cashTendered/);
  assert.match(body, /tendered\s*<\s*total/);
  assert.match(body, /Cash tendered is less than the payment total/i);
});

test('cash helper responds to payment method and tender changes and resets for the next collection', () => {
  assert.match(view, /select\[name="payment_method"\][^\n]*on\('change'/);
  assert.match(view, /#cashTendered[^\n]*on\('input'/);
  assert.match(view, /#cashTendered'\)\.val\(''\)/);
});
