const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Money-state invariant: calculating salary creates an obligation; only the
// approved payment transition may represent an employee as paid.
const root = path.resolve(__dirname, '..');
const payroll = fs.readFileSync(path.join(root, 'application/models/Payroll_model.php'), 'utf8');
const approval = fs.readFileSync(path.join(root, 'application/models/Payroll_approval_model.php'), 'utf8');
const payout = fs.readFileSync(path.join(root, 'application/models/Hubtel_payroll_payout_model.php'), 'utf8');

test('new payroll records are created as draft obligations, not paid transactions', () => {
  assert.match(payroll, /\$data\[['"]approval_status['"]\]\s*=\s*['"]draft['"]/);
  assert.match(payroll, /\$data\[['"]status['"]\]\s*=\s*['"]draft['"]/);
  assert.doesNotMatch(payroll, /approval_status['"]\]\s*=\s*['"]paid['"][^\n]*Automatically mark as paid/i);
});

test('payroll creation never tells staff that money has already been credited', () => {
  assert.doesNotMatch(payroll, /Your account has been credited with/i);
  assert.doesNotMatch(payroll, /send_sms_batch_personalized\s*\(\s*\$sms_data_array\s*\)/);
});

test('approval workflow stops at approved; only a provider-confirmed payout may write paid state', () => {
  assert.match(approval, /function\s+submit_for_approval\s*\(/);
  assert.match(approval, /approval_status['"]\s*=>\s*['"]pending_approval['"]/);
  assert.match(approval, /function\s+approve_payroll\s*\(/);
  assert.match(approval, /approval_status['"]\s*=>\s*['"]approved['"]/);
  assert.match(approval, /function\s+mark_as_paid\s*\(/);
  const markPaid = approval.match(/public function mark_as_paid\s*\([\s\S]*?\n\s*\/\*\*/)?.[0] || '';
  assert.doesNotMatch(markPaid, /approval_status['"]\s*=>\s*['"]paid['"]/);
  assert.match(payout, /function\s+mark_payroll_paid_from_provider\s*\(/);
  assert.match(payout, /approval_status['"]\s*=>\s*['"]paid['"]/);
});

test('payment notification is emitted only after provider-confirmed payout, not manual approval state', () => {
  const markPaid = approval.match(/public function mark_as_paid\s*\([\s\S]*?\n\s*\/\*\*/)?.[0] || '';
  assert.doesNotMatch(markPaid, /dispatch_notification\s*\(\s*['"]payment['"]/);
  assert.match(payout, /send_payment_notification\s*\(/);
  assert.match(payout, /dispatch_notification\s*\(\s*['"]payment['"]/);
});
