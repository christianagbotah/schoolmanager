const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'application/controllers/api/Sync.php'), 'utf8');

function methodBody(name, nextName) {
    const start = source.indexOf(`private function ${name}`);
    assert.notEqual(start, -1, `${name} must exist`);
    const end = source.indexOf(`private function ${nextName}`, start + 1);
    assert.notEqual(end, -1, `${nextName} must follow ${name}`);
    return source.slice(start, end);
}

test('batch upsert never uses destructive REPLACE semantics', () => {
    const body = methodBody('process_batch_record', 'get_table_primary_key');
    assert.doesNotMatch(body, /->replace\s*\(/);
});

test('existing batch records update in place by primary key', () => {
    const body = methodBody('process_batch_record', 'get_table_primary_key');
    assert.match(body, /where\s*\(\s*\$primary_key\s*,\s*\$lookup_id\s*\)/);
    assert.match(body, /->update\s*\(\s*\$table\s*,\s*\$update_data\s*\)/);
    assert.match(body, /'operation'\s*=>\s*'updated'/);
});

test('new batch records insert without losing the supplied offline primary key', () => {
    const body = methodBody('process_batch_record', 'get_table_primary_key');
    assert.match(body, /array_key_exists\s*\(\s*\$primary_key\s*,\s*\$data\s*\)/);
    assert.match(body, /\$data\s*\[\s*\$primary_key\s*\]\s*=\s*\$record_id/);
    assert.match(body, /->insert\s*\(\s*\$table\s*,\s*\$data\s*\)/);
    assert.match(body, /'operation'\s*=>\s*'inserted'/);
});
