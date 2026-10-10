const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'application/libraries/Sync_service.php'), 'utf8');
const api = fs.readFileSync(path.join(root, 'application/controllers/Sync_api.php'), 'utf8');

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const next = source.indexOf('\n    public function ', start + marker.length);
  const nextPrivate = source.indexOf('\n    private function ', start + marker.length);
  const candidates = [next, nextPrivate].filter(i => i !== -1);
  return source.slice(start, candidates.length ? Math.min(...candidates) : source.length);
}

test('legacy device registration never uses destructive REPLACE', () => {
  const body = functionBody(service, 'register_device');
  assert.doesNotMatch(body, /->replace\s*\(/i);
  assert.match(body, /->update\s*\(\s*['"]sync_devices['"]/);
  assert.match(body, /->insert\s*\(\s*['"]sync_devices['"]/);
});

test('legacy registration writes only columns in the current registry schema', () => {
  const body = functionBody(service, 'register_device');
  assert.doesNotMatch(body, /['"]user_id['"]\s*=>/);
  assert.doesNotMatch(body, /['"]user_type['"]\s*=>/);
  assert.doesNotMatch(body, /['"]updated_at['"]\s*=>/);
  assert.match(body, /['"]device_id['"]\s*=>/);
  assert.match(body, /['"]device_name['"]\s*=>/);
});

test('legacy registration cannot reactivate a BLOCKED device or overwrite its credential hash', () => {
  const body = functionBody(service, 'register_device');
  assert.match(body, /BLOCKED/);
  assert.match(body, /RuntimeException/);
  assert.doesNotMatch(body, /['"]auth_token_hash['"]\s*=>/);
});

test('legacy API no longer falsely promises an auth token in its registration contract', () => {
  assert.doesNotMatch(api, /Returns device_id and auth_token for future requests\./);
  const body = functionBody(api, 'register');
  assert.match(body, /['"]device_id['"]\s*=>\s*\$id/);
  assert.doesNotMatch(body, /['"]auth_token['"]\s*=>/);
});
