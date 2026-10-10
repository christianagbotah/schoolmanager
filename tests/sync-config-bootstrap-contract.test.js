const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manager = fs.readFileSync(path.join(root, 'application/libraries/Sync_manager.php'), 'utf8');

test('browser Sync_manager loads the repository sync config file', () => {
    assert.ok(fs.existsSync(path.join(root, 'application/config/sync.php')), 'sync.php must exist');
    assert.doesNotMatch(manager, /load->config\s*\(\s*['"]sync_config['"]\s*\)/);
    assert.match(manager, /load->config\s*\(\s*['"]sync['"]\s*\)/);
});
