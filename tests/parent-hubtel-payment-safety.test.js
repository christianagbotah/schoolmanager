const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

const gateway = read('application/controllers/Payment_gateway.php');
const parentController = read('application/controllers/Parents.php');
const studentController = read('application/controllers/Student.php');
const adminController = read('application/controllers/Admin.php');
const accountantController = read('application/controllers/Accountant.php');
const crudModel = read('application/models/Crud_model.php');
const autoload = read('application/config/autoload.php');
const paymentView = read('application/views/backend/payment_gateway/pay_invoice.php');
const includeMain = read('application/views/backend/include_main.php');
const parentInvoice = read('application/views/backend/parent/invoice.php');
const studentInvoice = read('application/views/backend/student/invoice.php');
const parentPaymentError = read('application/views/backend/parent/payment_error.php');

function body(source, name) {
  const patterns = [`function ${name}(`, `function ${name} (`];
  let start = -1;
  for (const marker of patterns) {
    start = source.indexOf(marker);
    if (start !== -1) break;
  }
  assert.notEqual(start, -1, `${name} must exist`);

  const candidates = [];
  for (const prefix of ['\n    public function ', '\n    private function ', '\n    protected function ', '\n    function ', '\r\n\tpublic function ', '\r\n\tprivate function ', '\r\n\tfunction ']) {
    const i = source.indexOf(prefix, start + 8);
    if (i !== -1) candidates.push(i);
  }
  return source.slice(start, candidates.length ? Math.min(...candidates) : source.length);
}

test('shared payment route accepts students and parents but validates child ownership server-side', () => {
  const route = body(gateway, 'pay_invoice');
  const resolver = body(gateway, 'resolve_payment_student_id');

  assert.match(route, /resolve_payment_student_id/);
  assert.match(route, /input->get\s*\(\s*['"]student_id['"]/);
  assert.match(resolver, /student_login/);
  assert.match(resolver, /parent_login/);
  assert.match(resolver, /parent_id/);
  assert.match(resolver, /where\s*\(\s*['"]student_id['"]/);
  assert.match(resolver, /where\s*\(\s*['"]parent_id['"]/);
  assert.doesNotMatch(route, /\$this->input->get\s*\(\s*['"]student_id['"]\s*\)[\s\S]{0,100}get_invoice_details/);
});

test('Hubtel initiation derives payer identity from authenticated database records', () => {
  const initiate = body(gateway, 'initiate_hubtel');
  assert.match(initiate, /resolve_payment_student_id/);
  assert.match(initiate, /get_payment_payer/);
  assert.match(initiate, /initiate_invoice_payment/);
  assert.doesNotMatch(initiate, /input->post\s*\(\s*['"]customer_name['"]/);
  assert.doesNotMatch(initiate, /input->post\s*\(\s*['"]email['"]/);
  assert.match(initiate, /input->post\s*\(\s*['"]phone_number['"]/);
  assert.match(initiate, /input->post\s*\(\s*['"]network['"]/);
});

test('status polling is Hubtel-only and enforces student, parent-child, or admin ownership', () => {
  const status = body(gateway, 'check_status');
  const authorised = body(gateway, 'get_authorised_hubtel_transaction');
  const actorAuth = body(gateway, 'is_payment_status_actor_authenticated');
  const parentCheck = body(gateway, 'is_parent_of_student');
  const contract = [status, authorised, actorAuth, parentCheck].join('\n');

  assert.match(status, /get_authorised_hubtel_transaction/);
  assert.match(contract, /where\s*\(\s*['"]gateway['"]\s*,\s*['"]hubtel['"]/i);
  assert.match(contract, /student_login/);
  assert.match(contract, /parent_login/);
  assert.match(contract, /admin_login/);
  assert.match(contract, /is_parent_of_student/);
});

test('shared payment page is routed outside role-specific view folders', () => {
  assert.match(includeMain, /page_name\s*===\s*['"]pay_invoice['"]/);
  assert.match(includeMain, /payment_gateway\/pay_invoice\.php/);
  assert.equal(exists('application/views/backend/student/pay_invoice.php'), false);
});

test('shared payment page uses controller-supplied actor data, CSRF-safe form helper, and success boolean', () => {
  assert.doesNotMatch(paymentView, /session->userdata\s*\(\s*['"]student_id['"]\s*\)[\s\S]{0,100}->get\s*\(\s*['"]student['"]\s*\)/);
  assert.match(paymentView, /\$student/);
  assert.match(paymentView, /\$payer/);
  assert.match(paymentView, /form_open\s*\(\s*site_url\s*\(\s*['"]payment_gateway\/initiate_hubtel['"]/);
  assert.match(paymentView, /name=["']student_id["']/);
  assert.doesNotMatch(paymentView, /name=["']customer_name["']/);
  assert.doesNotMatch(paymentView, /name=["']email["']/);
  assert.match(paymentView, /data\.success\s*===\s*true|data\.success\s*==\s*true|if\s*\(\s*data\.success\s*\)/);
  assert.doesNotMatch(paymentView, /\$\(['"]\.close['"]\)\[0\]/);
  assert.match(paymentView, /return_url/);
});

test('student and parent invoice actions enter the hardened payment route, not legacy modals', () => {
  assert.match(studentInvoice, /payment_gateway\/pay_invoice/);
  assert.doesNotMatch(studentInvoice, /modal_mobile_money_payment/);

  assert.match(parentInvoice, /payment_gateway\/pay_invoice/);
  assert.match(parentInvoice, /student_id/);
  assert.doesNotMatch(parentInvoice, /modal_mobile_money_payment/);

  assert.match(parentPaymentError, /payment_gateway\/pay_invoice/);
  assert.doesNotMatch(parentPaymentError, /modal_mobile_money_payment/);
});

test('legacy browser MoMo initiation and manual approval writers are retired', () => {
  assert.doesNotMatch(parentController, /function\s+mobile_money_checkout\s*\(/);
  assert.doesNotMatch(parentController, /function\s+mobile_money_checkout_callback\s*\(/);
  assert.doesNotMatch(parentController, /function\s+mo_money_modal\s*\(/);
  assert.doesNotMatch(studentController, /function\s+mobile_money_checkout\s*\(/);

  for (const controller of [adminController, accountantController]) {
    assert.doesNotMatch(controller, /function\s+modal_mobile_money_checkout\s*\(/);
    assert.doesNotMatch(controller, /function\s+confirm_transaction\s*\(/);
  }
  assert.doesNotMatch(adminController, /function\s+mobile_money_payment_alert_rows\s*\(/);
  assert.doesNotMatch(adminController, /function\s+mobile_money_payment_alert_show\s*\(/);
  assert.doesNotMatch(crudModel, /function\s+mobile_money_payment_alert_rows\s*\(/);
  assert.doesNotMatch(crudModel, /function\s+mobile_money_payment_alert_show\s*\(/);
  assert.doesNotMatch(crudModel, /function\s+confirm_transaction\s*\(/);

  assert.doesNotMatch(parentController, /insert\s*\(\s*['"]mobile_money_payment['"]/);
  assert.doesNotMatch(studentController, /insert\s*\(\s*['"]mobile_money_payment['"]/);
});

test('obsolete MoMo model and browser modal views are not shipped or autoloaded', () => {
  assert.equal(exists('application/models/Momo_model.php'), false);
  assert.doesNotMatch(autoload, /['"]momo_model['"]/);
  for (const rel of [
    'application/views/backend/parent/modal_mobile_money_payment.php',
    'application/views/backend/parent/modal_mobile_money_payment_pending.php',
    'application/views/backend/parent/modal_payment_status.php',
    'application/views/backend/student/modal_mobile_money_payment.php',
    'application/views/backend/student/modal_mobile_money_payment_pending.php',
    'application/views/backend/student/modal_payment_status.php',
    'application/views/backend/admin/modal_mobile_money_payment.php',
    'application/views/backend/mobile_money_checkout.php',
  ]) {
    assert.equal(exists(rel), false, `${rel} must be retired`);
  }
});

test('no application code sends or polls payment data through webhook.site', () => {
  const roots = ['application/controllers', 'application/models', 'application/views', 'application/config'];
  const stack = roots.map((rel) => path.join(root, rel));
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(php|js)$/i.test(entry.name)) {
        assert.doesNotMatch(fs.readFileSync(full, 'utf8'), /webhook\.site/i, `${full} must not reference webhook.site`);
      }
    }
  }
});
