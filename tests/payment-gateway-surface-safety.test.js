const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'application/controllers/Payment_gateway.php'), 'utf8');
const model = fs.readFileSync(path.join(root, 'application/models/Payment_gateway_model.php'), 'utf8');
const view = fs.readFileSync(path.join(root, 'application/views/backend/payment_gateway/pay_invoice.php'), 'utf8');

function body(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const matches = [];
  for (const prefix of ['\n    public function ', '\n    private function ', '\n    function ']) {
    const i = source.indexOf(prefix, start + marker.length);
    if (i !== -1) matches.push(i);
  }
  return source.slice(start, matches.length ? Math.min(...matches) : source.length);
}

test('student and parent invoice payment route authenticates the actor and validates invoice ownership', () => {
  const route = body(controller, 'pay_invoice');
  const actor = body(controller, 'is_payment_actor_authenticated');
  const resolver = body(controller, 'resolve_payment_student_id');
  assert.match(route, /is_payment_actor_authenticated/);
  assert.match(route, /redirect\s*\(\s*site_url\(['"]login['"]\)/);
  assert.match(route, /resolve_payment_student_id/);
  assert.match(route, /get_invoice_details\s*\(\s*\$invoice_code\s*,\s*\$student_id\s*\)/);
  assert.match(route, /show_404\s*\(/);
  assert.match(route, /page_name['"]\]\s*=\s*['"]pay_invoice['"]/);
  assert.match(actor, /student_login/);
  assert.match(actor, /parent_login/);
  assert.match(resolver, /where\s*\(\s*['"]parent_id['"]/);
});

test('legacy direct-carrier and Paystack initiation endpoints delegate to the authenticated fail-closed retirement helper', () => {
  for (const name of ['initiate_momo_payment', 'initiate_paystack']) {
    const fn = body(controller, name);
    assert.match(fn, /legacy_gateway_disabled\s*\(\s*true\s*\)/);
    assert.doesNotMatch(fn, /Payment_gateway_model->initiate_/);
  }
  const helper = body(controller, 'legacy_gateway_disabled');
  assert.match(helper, /student_login/);
  assert.match(helper, /401/);
  assert.match(helper, /410/);
  assert.match(helper, /legacy_gateway_disabled/);
});

test('legacy callbacks and placeholder webhooks are explicitly retired instead of invoking unsafe or missing handlers', () => {
  for (const name of ['momo_callback', 'paystack_callback', 'webhook_mtn', 'webhook_vodafone', 'webhook_paystack']) {
    const fn = body(controller, name);
    assert.match(fn, /legacy_gateway_disabled\s*\(\s*false\s*\)/);
  }
  assert.match(body(controller, 'legacy_gateway_disabled'), /410/);
  assert.doesNotMatch(body(controller, 'momo_callback'), /process_momo_callback/);
  assert.doesNotMatch(body(controller, 'paystack_callback'), /verify_paystack_payment/);
  assert.doesNotMatch(body(controller, 'webhook_mtn'), /handle_mtn_webhook/);
  assert.doesNotMatch(body(controller, 'webhook_vodafone'), /handle_vodafone_webhook/);
  assert.doesNotMatch(body(controller, 'webhook_paystack'), /handle_paystack_webhook/);
});

test('only fully configured and enabled Hubtel is advertised as an online gateway', () => {
  const fn = body(model, 'get_active_gateways');
  assert.match(fn, /hubtel_payment_enabled/);
  assert.match(fn, /hubtel_client_id/);
  assert.match(fn, /hubtel_client_secret/);
  assert.match(fn, /hubtel_merchant_number/);
  assert.match(fn, /['"]code['"]\s*=>\s*['"]hubtel['"]/);
  assert.doesNotMatch(fn, /['"]code['"]\s*=>\s*['"]mtn_momo['"]/);
  assert.doesNotMatch(fn, /['"]code['"]\s*=>\s*['"]vodafone_cash['"]/);
  assert.doesNotMatch(fn, /['"]code['"]\s*=>\s*['"]airteltigo_money['"]/);
  assert.doesNotMatch(fn, /['"]code['"]\s*=>\s*['"]paystack['"]/);
});

test('shared student/parent payment UI exposes only the hardened Hubtel form and handles no configured method', () => {
  assert.match(view, /hubtelForm/);
  assert.match(view, /empty\s*\(\s*\$gateways\s*\)|!\s*\$gateways/);
  assert.doesNotMatch(view, /momoForm/);
  assert.doesNotMatch(view, /paystackForm/);
  assert.doesNotMatch(view, /initiate_momo_payment/);
  assert.doesNotMatch(view, /initiate_paystack/);
});
