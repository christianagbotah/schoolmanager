const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const modelSource = fs.readFileSync(path.join(root, 'application/models/Sync_model.php'), 'utf8');
const controllerSource = fs.readFileSync(path.join(root, 'application/controllers/api/Sync.php'), 'utf8');

function methodBody(source, name, nextName) {
    const start = source.indexOf(`function ${name}`);
    assert.notEqual(start, -1, `${name} must exist`);
    const end = source.indexOf(`function ${nextName}`, start + 1);
    assert.notEqual(end, -1, `${nextName} must follow ${name}`);
    return source.slice(start, end);
}

function explicitDeleteCase(body) {
    const start = body.search(/case\s+['"]DELETE['"]\s*:/);
    assert.notEqual(start, -1, 'DELETE case must remain explicit');
    const switchEnd = body.indexOf('\n        }', start);
    assert.notEqual(switchEnd, -1, 'DELETE case must terminate before the switch closes');
    return body.slice(start, switchEnd);
}

test('Gen2 push rejects DELETE instead of issuing a database hard delete', () => {
    const body = methodBody(modelSource, 'process_push_item', 'get_changes_since');
    const deleteCase = explicitDeleteCase(body);
    assert.doesNotMatch(deleteCase, /->delete\s*\(/);
    assert.match(deleteCase, /throw\s+new\s+RuntimeException\s*\(/);
    assert.match(deleteCase, /tombstone/i);
});

test('API push converts the guarded DELETE exception into a per-item error response', () => {
    const body = methodBody(controllerSource, 'push', 'pull');
    assert.match(body, /catch\s*\(\s*Exception\s+\$e\s*\)/);
    assert.match(body, /['"]status['"]\s*=>\s*['"]error['"]/);
    assert.match(body, /['"]message['"]\s*=>\s*\$e->getMessage\s*\(\s*\)/);
});
