const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'application/config/config.php'), 'utf8');
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');

test('application encryption key is supplied at runtime rather than committed in config', () => {
  assert.doesNotMatch(config, /\$config\[['"]encryption_key['"]\]\s*=\s*hex2bin\s*\(/);
  assert.doesNotMatch(config, /\$config\[['"]encryption_key['"]\]\s*=\s*['"][^'"]+['"]/);
  assert.match(config, /getenv\s*\(\s*['"]IEDUPRO_ENCRYPTION_KEY['"]\s*\)/);
});

test('an untracked local secret file can supply the key when server environment injection is unavailable', () => {
  assert.match(config, /local_secrets\.php/);
  assert.match(config, /encryption_key/);
  assert.match(gitignore, /^application\/config\/local_secrets\.php$/m);
});
