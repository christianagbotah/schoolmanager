const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const crud = fs.readFileSync(path.join(root, 'application/models/Crud_model.php'), 'utf8');

function body(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const tail = source.slice(start + marker.length);
  const next = /\n\s*function\s+[A-Za-z0-9_]+\s*\(/.exec(tail);
  return source.slice(start, next ? start + marker.length + next.index : source.length);
}

test('legacy purchase verification reads its API token from runtime environment', () => {
  const fn = body(crud, 'curl_request');
  assert.match(fn, /getenv\s*\(\s*['"]ENVATO_PERSONAL_TOKEN['"]\s*\)/);
  assert.doesNotMatch(fn, /\$personal_token\s*=\s*['"][^'"]{8,}['"]/);
});

test('purchase verification fails closed when the runtime token is missing', () => {
  const fn = body(crud, 'curl_request');
  assert.match(fn, /personal_token/);
  assert.match(fn, /===\s*['"]['"]|empty\s*\(/);
  assert.match(fn, /return\s+false|return\s+null/);
});

test('repository application PHP has no long literal assignment to common secret variables', () => {
  const stack = [path.join(root, 'application')];
  const bad = [];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, {withFileTypes:true})) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.php')) {
        const source = fs.readFileSync(full, 'utf8');
        if (/\$(?:personal_token|api_key|secret|token)\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]/i.test(source)) bad.push(full);
      }
    }
  }
  assert.deepEqual(bad, []);
});
