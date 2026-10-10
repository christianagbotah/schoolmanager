const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const view = fs.readFileSync(path.join(root, 'application/views/backend/admin/payroll_approvals.php'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'application/controllers/Admin.php'), 'utf8');
const payoutController = fs.readFileSync(path.join(root, 'application/controllers/Payroll_payout.php'), 'utf8');
const approval = fs.readFileSync(path.join(root, 'application/models/Payroll_approval_model.php'), 'utf8');
const paymentSettings = fs.readFileSync(path.join(root, 'application/views/backend/admin/payment_settings.php'), 'utf8');

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const publicNext = source.indexOf('\n\tpublic function ', start + marker.length);
  const functionNext = source.indexOf('\n\tfunction ', start + marker.length);
  const spacedPublicNext = source.indexOf('\n    public function ', start + marker.length);
  const spacedPrivateNext = source.indexOf('\n    private function ', start + marker.length);
  const candidates = [publicNext, functionNext, spacedPublicNext, spacedPrivateNext].filter(i => i !== -1);
  return source.slice(start, candidates.length ? Math.min(...candidates) : source.length);
}

test('Payroll Approvals initiates Hubtel payout instead of manually marking payroll paid', () => {
  assert.match(view, /payroll_payout\/initiate\//);
  assert.doesNotMatch(view, /admin\/payroll_mark_paid\//);
  assert.match(view, /Pay via Hubtel|Send Salary via Hubtel|Send Salary/);
  assert.match(view, /payout_status/);
  assert.match(view, /processing|pending/);
});

test('legacy Admin mark-paid endpoint delegates to Hubtel and cannot directly write paid state', () => {
  const body = functionBody(admin, 'payroll_mark_paid');
  assert.match(body, /Hubtel_payroll_payout_model/);
  assert.match(body, /initiate_payout\s*\(/);
  assert.doesNotMatch(body, /approval_status['"]\s*=>\s*['"]paid['"]/);
  assert.doesNotMatch(body, /->update\s*\(\s*['"]pay_salary['"]/);
  assert.doesNotMatch(body, /->update\s*\(\s*['"]payroll['"]/);
});

test('approval list exposes payout reconciliation state when the payout ledger exists', () => {
  const body = functionBody(approval, 'get_pending_approvals');
  assert.match(body, /payroll_payout_transactions/);
  assert.match(body, /payout_status/);
  assert.match(body, /table_exists\s*\(\s*['"]payroll_payout_transactions['"]\s*\)/);
});

test('payout initiation uses the numeric admin level finance contract rather than permissive account_type fallback', () => {
  const body = functionBody(payoutController, 'initiate');
  assert.match(body, /can_current_admin_initiate_payout/);
  assert.match(payoutController, /userdata\s*\(\s*['"]user_type['"]\s*\)/);
  assert.match(payoutController, /in_array\s*\(\s*\$user_level\s*,\s*\[\s*1\s*,\s*3\s*\]/);
  assert.doesNotMatch(body, /userdata\s*\(\s*['"]account_type['"]\s*\)\s*\?:\s*['"]admin['"]/);
});

test('payroll approval JSON is restricted to authenticated administrators', () => {
  const body = functionBody(admin, 'payroll_pending_approvals');
  assert.match(body, /admin_login/);
  assert.match(body, /401/);
});

test('payout status polling keeps the same finance or super-admin authorization boundary', () => {
  const body = functionBody(payoutController, 'status');
  assert.match(body, /can_current_admin_initiate_payout/);
});

test('Hubtel gateway settings can persist explicit receive and payroll send endpoints', () => {
  const body = functionBody(admin, 'payment_settings');
  assert.match(body, /hubtel_payment_receive_url/);
  assert.match(body, /hubtel_payroll_send_url/);
  assert.match(body, /insert\s*\(\s*['"]settings['"]/);
  assert.match(paymentSettings, /name=['"]hubtel_payment_receive_url['"]/);
  assert.match(paymentSettings, /name=['"]hubtel_payroll_send_url['"]/);
  assert.match(paymentSettings, /\{mobileNumber\}/);
});

test('Hubtel payroll send URL is validated and payment credential changes require super admin', () => {
  const body = functionBody(admin, 'payment_settings');
  assert.match(body, /user_type/);
  assert.match(body, /403/);
  assert.match(body, /mobileNumber/);
  assert.match(body, /https/i);
});

test('legacy approval-model mark_as_paid cannot directly transition payroll to paid', () => {
  const body = functionBody(approval, 'mark_as_paid');
  assert.doesNotMatch(body, /approval_status['"]\s*=>\s*['"]paid['"]/);
  assert.match(body, /Hubtel|provider|disabled/i);
});
