const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// Regression contract for the Ghana daily-fee wallet semantics that are being
// migrated from SchoolManager (CI3/MySQL) to iEduPro (multi-tenant SaaS).
// These tests pin the proven legacy behavior so the migration cannot silently
// drift from it. Evidence: docs/handover/legacy/05-finance-invoices-accounting.md
// and application/models/Daily_fee_model.php.

const modelPath = 'application/models/Daily_fee_model.php';
const viewPath = 'application/views/backend/cashier/daily_fee_collection.php';
const model = fs.readFileSync(modelPath, 'utf8');
const view = fs.readFileSync(viewPath, 'utf8');

function between(source, startNeedle, endNeedle, label) {
  const start = source.indexOf(startNeedle);
  assert.ok(start >= 0, `missing ${label || startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  assert.ok(end > start, `could not isolate ${label || startNeedle}`);
  return source.slice(start, end);
}

test('wallet covers exactly five fee components with prepaid balance and arrears per component', () => {
  const outstanding = between(
    model,
    'public function get_student_outstanding',
    'public function recalculate_wallet_from_date',
    'get_student_outstanding'
  );
  for (const type of ['feeding', 'breakfast', 'classes', 'water', 'transport']) {
    assert.match(outstanding, new RegExp(`wallet\\['${type}_balance'\\]`), `${type} balance missing`);
    assert.match(outstanding, new RegExp(`wallet\\['${type}_arrears'\\]`), `${type} arrears missing`);
  }
  assert.match(outstanding, /'net_position' => \$total_balance - \$total_arrears/);
});

test('daily charge pipeline runs in the proven order: feeding, breakfast, classes, water, transport', () => {
  const charges = between(
    model,
    'public function process_daily_charges',
    'private function apply_charge',
    'process_daily_charges'
  );
  const order = ['1. FEEDING CHARGE', '2. BREAKFAST CHARGE', '3. CLASSES CHARGE', '4. WATER CHARGE', '5. TRANSPORT CHARGE'];
  let cursor = 0;
  for (const marker of order) {
    const at = charges.indexOf(marker);
    assert.ok(at >= cursor, `charge stage out of order or missing: ${marker}`);
    cursor = at;
  }
});

test('charges are idempotent per student per day via daily_charge_log', () => {
  const charges = between(
    model,
    'public function process_daily_charges',
    'private function apply_charge',
    'process_daily_charges'
  );
  assert.match(charges, /get_where\('daily_charge_log', \[\s*'student_id' => \$student_id,\s*'charge_date' => \$charge_date/);
  assert.match(charges, /Only prevent if feeding OR classes were already charged/);
  assert.match(charges, /\$existing->feeding_charged > 0 \|\|\s*\$existing->classes_charged > 0/);
  assert.match(charges, /return; \/\/ Attendance already processed/);
});

test('water is charged weekly (Monday start) and only on the first attendance of the week', () => {
  const charges = between(
    model,
    'public function process_daily_charges',
    'private function apply_charge',
    'process_daily_charges'
  );
  const water = between(charges, '4. WATER CHARGE', '5. TRANSPORT CHARGE', 'water stage');
  assert.match(water, /strtotime\('monday this week', \$attendance_date\)/);
  assert.match(water, /strtotime\('sunday this week', \$attendance_date\)/);
  assert.match(water, /Check if already charged THIS WEEK/);
  assert.match(water, /'water_charged >', 0/);
});

test('transport charge is per leg: in or out charges one fare, both charges two', () => {
  const charges = between(
    model,
    'public function process_daily_charges',
    'private function apply_charge',
    'process_daily_charges'
  );
  const transport = between(charges, '5. TRANSPORT CHARGE', '// Log the charge to prevent double-charging', 'transport stage');
  assert.match(transport, /case 'in':\s*case 'out':\s*\$transport_charge = \$route_fare;/);
  assert.match(transport, /case 'both':\s*\$transport_charge = \$route_fare \* 2;/);
  assert.match(transport, /\$options\['transport_status'\] !== 'none' && \$options\['transport_status'\] !== 'pending'/);
});

test('breakfast is optional and gated on the student breakfast subscription preference', () => {
  const charges = between(
    model,
    'public function process_daily_charges',
    'private function apply_charge',
    'process_daily_charges'
  );
  const breakfast = between(charges, '2. BREAKFAST CHARGE', '3. CLASSES CHARGE', 'breakfast stage');
  assert.match(breakfast, /Optional - only if subscribed/);
  assert.match(breakfast, /\$prefs\['breakfast_subscribed'\]/);
  assert.match(breakfast, /\$rates\['breakfast_enabled'\]/);
});

test('apply_charge math: full prepaid deduction, partial split to arrears, or full arrears', () => {
  const apply = between(model, 'private function apply_charge', 'private function reverse_charge', 'apply_charge');
  assert.match(apply, /if \(\$auto_deduct && \$wallet\[\$balance_field\] >= \$amount\)/);
  assert.match(apply, /\$wallet\[\$balance_field\] -= \$amount;/);
  assert.match(apply, /'paid'/);
  assert.match(apply, /else if \(\$auto_deduct && \$wallet\[\$balance_field\] > 0\)/);
  assert.match(apply, /\$prepaid_used = \$wallet\[\$balance_field\];/);
  assert.match(apply, /\$arrears_amount = \$amount - \$prepaid_used;/);
  assert.match(apply, /\$wallet\[\$balance_field\] = 0;/);
  assert.match(apply, /\$wallet\[\$arrears_field\] \+= \$arrears_amount;/);
  assert.match(apply, /'partial'/);
  assert.match(apply, /\$wallet\[\$arrears_field\] \+= \$amount;/);
  assert.match(apply, /'unpaid'/);
});

test('reverse_charge refunds arrears first and only then returns money to prepaid balance', () => {
  const reverse = between(model, 'private function reverse_charge', 'public function update_payment', 'reverse_charge');
  assert.match(reverse, /if \(\$wallet\[\$arrears_field\] >= \$amount\)/);
  assert.match(reverse, /\$wallet\[\$arrears_field\] -= \$amount;/);
  assert.match(reverse, /\$remainder = \$amount - \$wallet\[\$arrears_field\];/);
  assert.match(reverse, /\$wallet\[\$arrears_field\] = 0;/);
  assert.match(reverse, /\$wallet\[\$balance_field\] \+= \$remainder;/);
  assert.match(reverse, /No arrears, add to balance \(refund\)/);
});

test('payment types are deterministic: advance tops up prepaid only, arrears and mixed settle arrears first', () => {
  const applyPayment = between(model, 'private function apply_payment', 'public function get_student_outstanding', 'apply_payment');
  assert.match(applyPayment, /if \(\$payment_type == 'advance'\)/);
  assert.match(applyPayment, /\$wallet\[\$balance_field\] \+= \$amount;/);
  assert.match(applyPayment, /elseif \(\$payment_type == 'arrears'\)/);
  assert.match(applyPayment, /if \(\$amount >= \$wallet\[\$arrears_field\]\)/);
  assert.match(applyPayment, /\$remaining = \$amount - \$wallet\[\$arrears_field\];/);
  assert.match(applyPayment, /\$wallet\[\$arrears_field\] = 0;/);
  assert.match(applyPayment, /\$wallet\[\$balance_field\] \+= \$remaining;/);
  assert.match(applyPayment, /Clear arrears first, then add to balance/);
});

test('cashier smart allocation settles arrears in priority order feeding, classes, breakfast, water, transport', () => {
  assert.match(view, /var feePriority = \['feeding','classes','breakfast','water','transport'\];/);
  const alloc = between(view, 'function allocateSmartPayment', "$('#smartAllocate')", 'allocateSmartPayment');
  assert.match(alloc, /var allocated = Math\.min\(remaining, arrears\);/);
  assert.match(alloc, /remaining -= allocated;/);
  assert.match(alloc, /var creditType = \$\('#excessCreditType'\)\.val\(\) \|\| 'feeding';/);
  assert.match(alloc, /allocations\[creditType\] \+= remaining;/);
  assert.match(alloc, /Arrears first, then excess prepaid credit\./);
});

test('cashier collection respects the teacher vs cashier boundary', () => {
  const boundary = between(
    model,
    'public function can_collect_daily_fees',
    'public function get_user_collection_point',
    'can_collect_daily_fees'
  );
  assert.match(boundary, /\$collection_mode = get_settings\('daily_fee_collection_mode'\) \?: 'classroom';/);
  assert.match(boundary, /if \(\$role == 'conductor'\) \{\s*return \$fee_type === 'transport' \|\| \$fee_type === null;\s*\}/);
  assert.match(boundary, /\$teacher_mode = get_settings\('teacher_fee_collection_mode'\) \?: 'restricted';/);
  assert.match(boundary, /if \(\$teacher_mode == 'restricted'\) \{\s*return false;/);
  assert.match(boundary, /if \(\$collection_mode == 'cashier' && \$collection_point != 'attendance_portal'\) \{\s*return false;/);
  assert.match(boundary, /if \(!\$user || \$user->can_collect_daily_fees != 1\) \{\s*return false;/);
  assert.match(boundary, /if \(\$collection_mode == 'cashier' && \$collection_point == 'attendance_portal'\) \{\s*return false;/);
  assert.match(boundary, /if \(\$collection_mode == 'classroom' && \$collection_point == 'cashier_portal'\) \{\s*return false;/);
});

test('cashier POS posts through the guarded endpoint and snapshots toggles for retroactive charging', () => {
  assert.match(view, /url:'<\?php echo site_url\('cashier\/process_daily_fee_payment'\); \?>'/);
  const endpoint = between(
    model,
    'public function process_payment',
    'private function apply_payment',
    'process_payment'
  );
  assert.match(endpoint, /breakfast_opted/);
  assert.match(endpoint, /water_opted/);
  assert.match(endpoint, /Check attendance table \(source of truth\) instead of daily_charge_log/);
  assert.match(endpoint, /get_where\('attendance', \[/);
  assert.match(endpoint, /Only proceed if attendance was ACTUALLY marked/);
});

test('payment update reverses retroactively when breakfast or water is opted out', () => {
  const update = between(model, 'public function update_payment', 'private function reverse_payment_wallet', 'update_payment');
  assert.match(update, /OPT-IN: Charge retroactively/);
  assert.match(update, /OPT-OUT: Reverse charge retroactively/);
  assert.match(update, /retroactive_breakfast_reversal = true/);
  assert.match(update, /retroactive_water_reversal = true/);
});

test('every wallet mutation is written to the daily fee audit log', () => {
  for (const needle of ["log_audit\\(\\$student_id, 'charge'", "log_audit\\(\\$student_id, 'charge_reversal'", "log_audit\\(\\$student_id, 'payment'"]) {
    assert.match(model, new RegExp(needle), `missing audit call: ${needle}`);
  }
});

test('daily fee transactions snapshot year, term, collection point and residence type', () => {
  const endpoint = between(
    model,
    'public function process_payment',
    'private function apply_payment',
    'process_payment'
  );
  assert.match(endpoint, /'year' => \$running_year,/);
  assert.match(endpoint, /'term' => \$running_term,/);
  assert.match(endpoint, /'collection_point' => \$data\['collection_point'\] \?\? 'office',/);
  assert.match(endpoint, /'residence_type' => \$residence_type,/);
  assert.match(
    endpoint,
    /\$transaction\['total_amount'\] = \$transaction\['feeding_amount'\] \+ \$transaction\['breakfast_amount'\] \+\s*\$transaction\['classes_amount'\] \+ \$transaction\['water_amount'\] \+\s*\$transaction\['transport_amount'\];/
  );
  assert.match(endpoint, /'transaction_code' => \$transaction_code,/);
});
