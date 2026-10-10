const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'application/controllers/Payment_gateway.php'), 'utf8');
const modelPath = path.join(root, 'application/models/Hubtel_payment_model.php');
const model = fs.existsSync(modelPath) ? fs.readFileSync(modelPath, 'utf8') : '';

test('Hubtel collection is routed through the hardened adapter', () => {
  assert.match(controller, /Hubtel_payment_model/);
  assert.match(controller, /hubtel_payments->initiate_invoice_payment/);
  assert.match(controller, /hubtel_payments->handle_callback/);
});

test('Hubtel initiation validates the authoritative invoice and amount server-side', () => {
  assert.match(model, /function\s+initiate_invoice_payment\s*\(/);
  assert.match(model, /invoice_code/);
  assert.match(model, /student_id/);
  assert.match(model, /requested_amount/);
  assert.match(model, /amount\s*>\s*\$due|amount\s*>\s*\(float\)\s*\$invoice\[['"]due['"]\]/);
});

test('Hubtel references are cryptographically random', () => {
  assert.match(model, /random_bytes\s*\(/);
  assert.doesNotMatch(model, /rand\s*\(/);
});

test('callback settlement is idempotent and serialized', () => {
  assert.match(model, /FOR UPDATE/i);
  assert.match(model, /status[^\n]*success/i);
  assert.match(model, /transaction_id[^\n]*transaction_ref|transaction_ref[^\n]*transaction_id/);
});

test('callback amount and reference are checked before finance mutation', () => {
  assert.match(model, /clientReference|ClientReference/);
  assert.match(model, /callback_amount|callbackAmount/);
  assert.match(model, /amount_mismatch|amount mismatch/i);
});

test('legacy verify endpoint cannot credit money as an unauthenticated side effect', () => {
  assert.doesNotMatch(controller, /verify_hubtel_payment\s*\(/);
  assert.match(controller, /verify_hubtel[\s\S]*student_login|verify_hubtel[\s\S]*admin_login/);
});

test('Hubtel callback URL carries a reference-bound authentication token', () => {
  assert.match(model, /function\s+callback_token_for_reference\s*\(/);
  assert.match(model, /hash_hmac\s*\(\s*['"]sha256['"]/);
  assert.match(model, /hubtel-collection\|/);
  assert.match(model, /PrimaryCallbackUrl[^\n]*token|PrimaryCallbackUrl[\s\S]{0,240}token/);
});

test('collection callback rejects a missing or invalid authentication token before settlement', () => {
  assert.match(model, /function\s+handle_callback\s*\(\s*\$raw_body\s*,\s*\$callback_token/);
  assert.match(model, /invalid_callback_token/);
  assert.match(model, /hash_equals\s*\(/);
  const callbackStart = model.indexOf('function handle_callback');
  const settleCall = model.indexOf('settle_transaction(', callbackStart);
  const tokenFailure = model.indexOf('invalid_callback_token', callbackStart);
  assert.ok(tokenFailure > callbackStart && tokenFailure < settleCall, 'callback token must be validated before settlement');
});

test('Payment gateway passes callback token from the provider callback URL into the hardened adapter', () => {
  assert.match(controller, /input->get\s*\(\s*['"]token['"]/);
  assert.match(controller, /handle_callback\s*\(\s*file_get_contents\s*\(\s*['"]php:\/\/input['"]\s*\)\s*,/);
  assert.doesNotMatch(controller, /Payment_gateway_model->hubtel_callback\s*\(/);
});
