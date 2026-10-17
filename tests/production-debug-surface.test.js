const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const controllers = path.join(root, 'application/controllers');

const retiredControllers = [
  'Debug_fees.php',
  'Permission_debug.php',
  'Test_controller.php',
  'Test_deletion_tracking.php',
  'Test_locations.php',
  'Test_sync.php',
  'Test_sync_driver.php',
];

test('developer-only browser controllers are not shipped in production', () => {
  for (const file of retiredControllers) {
    assert.equal(fs.existsSync(path.join(controllers, file)), false, `${file} must not be web-reachable`);
  }
});

test('normal product controllers do not expose retired diagnostic methods', () => {
  const admin = fs.readFileSync(path.join(controllers, 'Admin.php'), 'utf8');
  const examination = fs.readFileSync(path.join(controllers, 'Examination.php'), 'utf8');
  const fees = fs.readFileSync(path.join(controllers, 'Fee_collection.php'), 'utf8');

  assert.doesNotMatch(admin, /function\s+ajaxTest\s*\(/);
  assert.doesNotMatch(admin, /webhook\.site/i);
  assert.doesNotMatch(admin, /function\s+test_sync_tracking\s*\(/);
  assert.doesNotMatch(admin, /function\s+check_pending_settings\s*\(/);
  assert.doesNotMatch(admin, /function\s+test_gra_paye\s*\(/);
  assert.doesNotMatch(examination, /function\s+debug_data\s*\(/);
  assert.doesNotMatch(fees, /function\s+debug_student_91\s*\(/);
});

test('developer-only GRA test view is not deployed', () => {
  assert.equal(
    fs.existsSync(path.join(root, 'application/views/backend/admin/test_gra_paye.php')),
    false,
    'GRA PAYE browser test view must not ship in production'
  );
});
