const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const modelPath = path.join(root, 'application/models/Hubtel_payroll_payout_model.php');
const controllerPath = path.join(root, 'application/controllers/Payroll_payout.php');
const migrationPath = path.join(root, 'application/migrations/20261010_create_payroll_payout_transactions.sql');
const model = fs.existsSync(modelPath) ? fs.readFileSync(modelPath, 'utf8') : '';
const controller = fs.existsSync(controllerPath) ? fs.readFileSync(controllerPath, 'utf8') : '';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

test('outbound payroll uses a dedicated payout ledger', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS\s+`?payroll_payout_transactions`?/i);
  assert.match(migration, /UNIQUE KEY[^\n]*pay_id/i);
  assert.match(migration, /UNIQUE KEY[^\n]*client_reference/i);
});

test('only approved payroll can enter payout processing', () => {
  assert.match(model, /function\s+initiate_payout\s*\(/);
  assert.match(model, /approval_status[^\n]*approved/i);
  assert.match(model, /net_salary/);
  assert.match(model, /employee_phone/);
  assert.match(model, /random_bytes\s*\(/);
});

test('live Hubtel send-money endpoint must be configured rather than guessed', () => {
  assert.match(model, /hubtel_payroll_send_url/);
  assert.match(model, /\{mobileNumber\}/);
  assert.doesNotMatch(model, /api\.hubtel\.com\/.*send-money/i);
});

test('payout callback binds reference amount recipient and provider transaction', () => {
  assert.match(model, /function\s+handle_callback\s*\(/);
  assert.match(model, /FOR UPDATE/i);
  assert.match(model, /clientReference|ClientReference/);
  assert.match(model, /callback_amount|callbackAmount/);
  assert.match(model, /mobileNumber|MobileNumber/);
  assert.match(model, /transactionId|TransactionId/);
  assert.match(model, /amount_mismatch|amount mismatch/i);
  assert.match(model, /recipient_mismatch|recipient mismatch/i);
  assert.match(model, /provider_transaction_mismatch|provider transaction mismatch/i);
});

test('provider-confirmed transition synchronizes payroll paid state atomically', () => {
  assert.match(model, /function\s+mark_payroll_paid_from_provider\s*\(/);
  assert.match(model, /approval_status['"]\s*=>\s*['"]paid['"]/);
  assert.match(model, /status['"]\s*=>\s*['"]paid['"]/);
  assert.match(model, /payroll_approvals/);
  assert.match(model, /status['"]\s*=>\s*['"]success['"]/);
});

test('payout initiation is authenticated and callback remains provider-facing', () => {
  assert.match(controller, /admin_login/);
  assert.match(controller, /function\s+initiate\s*\(/);
  assert.match(controller, /function\s+hubtel_callback\s*\(/);
});
