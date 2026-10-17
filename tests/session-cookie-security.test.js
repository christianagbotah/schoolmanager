const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'application/config/config.php'), 'utf8');
const syncView = fs.readFileSync(path.join(root, 'application/views/backend/admin/sync_dashboard.php'), 'utf8');
const syncUi = fs.readFileSync(path.join(root, 'assets/backend/js/sync_dashboard_ui.js'), 'utf8');

test('browser cookies are restricted to HTTPS and server-only access', () => {
  assert.match(config, /\$config\[['"]cookie_secure['"]\]\s*=\s*TRUE\s*;/);
  assert.match(config, /\$config\[['"]cookie_httponly['"]\]\s*=\s*TRUE\s*;/);
});

test('sync dashboard receives CSRF data from the rendered page instead of reading the CSRF cookie', () => {
  assert.match(syncView, /iEduProSyncCsrf/);
  assert.match(syncView, /get_csrf_token_name\s*\(/);
  assert.match(syncView, /get_csrf_hash\s*\(/);

  assert.match(syncUi, /iEduProSyncCsrf/);
  assert.match(syncUi, /requestData\s*\[\s*csrf\.(?:name|tokenName)\s*\]/);
  assert.doesNotMatch(syncUi, /document\.cookie/);
  assert.doesNotMatch(syncUi, /getCookie\s*\(/);
  assert.doesNotMatch(syncUi, /joana_vic/);
  assert.doesNotMatch(syncUi, /agbotah_essuon/);
});
