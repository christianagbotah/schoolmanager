const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const modelPath = path.join(root, 'application/models/Sync_model.php');
const controllerPath = path.join(root, 'application/controllers/api/Sync.php');
const migrationPath = path.join(root, 'application/migrations/20261010_add_sync_device_auth_token_hash.sql');
const model = fs.readFileSync(modelPath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const nextPublic = source.indexOf('\n    public function ', start + 1);
  return source.slice(start, nextPublic === -1 ? source.length : nextPublic);
}

test('device verification is fail-closed and compares a stored token hash', () => {
  const verify = functionBody(model, 'verify_device');
  assert.match(verify, /field_exists\s*\(\s*['"]auth_token_hash['"]\s*,\s*['"]sync_devices['"]\s*\)/);
  assert.match(verify, /return\s+null\s*;/);
  assert.match(verify, /['"]status['"]\s*=>\s*['"]ACTIVE['"]/);
  assert.match(verify, /hash\s*\(\s*['"]sha256['"]\s*,\s*\$auth_token\s*\)/);
  assert.match(verify, /hash_equals\s*\(/);
});

test('device registration persists only the token hash while returning the one-time token', () => {
  const register = functionBody(model, 'register_device');
  assert.match(register, /field_exists\s*\(\s*['"]auth_token_hash['"]\s*,\s*['"]sync_devices['"]\s*\)/);
  assert.match(register, /['"]auth_token_hash['"]\s*=>\s*hash\s*\(\s*['"]sha256['"]\s*,\s*\$auth_token\s*\)/);
  assert.doesNotMatch(register, /['"]auth_token['"]\s*=>\s*\$auth_token\s*,?\s*\n\s*['"]status['"]/);
  assert.match(register, /['"]auth_token['"]\s*=>\s*\$auth_token/);
});

test('registration bootstraps only after the global API key gate; normal calls still require device credentials', () => {
  const auth = functionBody(controller, 'authenticate');
  assert.match(auth, /router->fetch_method\s*\(\s*\)/);
  const apiKeyGate = auth.indexOf('resolve_api_key');
  const bootstrapCheck = auth.indexOf('register_device');
  const deviceHeaderCheck = auth.indexOf('X-Device-ID');
  assert.ok(apiKeyGate >= 0, 'global API key must be resolved');
  assert.ok(bootstrapCheck > apiKeyGate, 'registration exemption must happen after API-key validation');
  assert.ok(deviceHeaderCheck > bootstrapCheck, 'normal device credentials must be checked after the registration exemption');
  assert.match(auth, /register_device[\s\S]*return\s*;/);
  assert.match(auth, /X-Auth-Token/);
});

test('schema migration adds an idempotent fixed-length device token hash column', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'device auth migration must exist');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.match(migration, /INFORMATION_SCHEMA\.COLUMNS/i);
  assert.match(migration, /auth_token_hash/i);
  assert.match(migration, /CHAR\s*\(\s*64\s*\)/i);
  assert.match(migration, /ALTER\s+TABLE\s+`?sync_devices`?/i);
});
