const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const model = fs.readFileSync(path.join(root, 'application/models/Sync_model.php'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'application/controllers/Sync_server.php'), 'utf8');
const navigation = fs.readFileSync(path.join(root, 'application/views/backend/admin/navigation.php'), 'utf8');
const viewPath = path.join(root, 'application/views/backend/admin/sync_devices.php');

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const next = source.indexOf('\n    public function ', start + marker.length);
  const nextPrivate = source.indexOf('\n    private function ', start + marker.length);
  const candidates = [next, nextPrivate].filter(i => i !== -1);
  const end = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}

test('admin device listing exposes safe metadata only', () => {
  const body = functionBody(model, 'list_devices_for_admin');
  assert.match(body, /device_id/);
  assert.match(body, /device_name/);
  assert.match(body, /last_sync_at/);
  assert.match(body, /status/);
  assert.doesNotMatch(body, /auth_token_hash/);
});

test('token rotation is restricted to ACTIVE devices and returns a one-time token', () => {
  const body = functionBody(model, 'rotate_device_token');
  assert.match(body, /['"]status['"]\s*=>\s*['"]ACTIVE['"]/);
  assert.match(body, /random_bytes\s*\(\s*32\s*\)/);
  assert.match(body, /auth_token_hash/);
  assert.match(body, /hash\s*\(\s*['"]sha256['"]/);
  assert.match(body, /['"]auth_token['"]\s*=>/);
});

test('revocation blocks the device and destroys its bearer credential', () => {
  const body = functionBody(model, 'revoke_device');
  assert.match(body, /['"]status['"]\s*=>\s*['"]BLOCKED['"]/);
  assert.match(body, /['"]auth_token_hash['"]\s*=>\s*null/);
});

test('lifecycle endpoints are server-side super-admin protected', () => {
  const guard = functionBody(controller, 'require_super_admin');
  assert.match(guard, /admin_id/);
  assert.match(guard, /['"]level['"]|->level/);
  assert.match(guard, /(?:===|==)\s*1/);

  for (const name of ['devices', 'rotate_device_token', 'revoke_device']) {
    const body = functionBody(controller, name);
    assert.match(body, /require_super_admin\s*\(/, `${name} must enforce the super-admin guard`);
  }

  const rotate = functionBody(controller, 'rotate_device_token');
  const revoke = functionBody(controller, 'revoke_device');
  assert.match(rotate, /method\s*\(\s*TRUE\s*\)[\s\S]*POST/);
  assert.match(revoke, /method\s*\(\s*TRUE\s*\)[\s\S]*POST/);
});

test('device lifecycle UI uses CSRF-aware forms and never renders stored hashes', () => {
  assert.equal(fs.existsSync(viewPath), true, 'sync_devices admin view must exist');
  const view = fs.readFileSync(viewPath, 'utf8');
  assert.match(view, /form_open\s*\(.*sync_server\/rotate_device_token/);
  assert.match(view, /form_open\s*\(.*sync_server\/revoke_device/);
  assert.match(view, /one[- ]time|shown only once|copy.*now/i);
  assert.doesNotMatch(view, /auth_token_hash/);
  assert.match(navigation, /sync_devices/);
  assert.match(navigation, /sync_server\/devices/);
});
