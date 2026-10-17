const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.php'), 'utf8');

test('front controller emits safe baseline browser security headers', () => {
  assert.match(index, /X-Content-Type-Options:\s*nosniff/i);
  assert.match(index, /Referrer-Policy:\s*strict-origin-when-cross-origin/i);
});

test('HSTS is emitted only for HTTPS without locking subdomains or preload', () => {
  assert.match(index, /HTTP_X_FORWARDED_PROTO/);
  assert.match(index, /Strict-Transport-Security:\s*max-age=31536000/i);
  assert.doesNotMatch(index, /includeSubDomains/i);
  assert.doesNotMatch(index, /preload/i);
});
