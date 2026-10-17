const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'application/controllers', name), 'utf8');

function constructorBody(source) {
  const match = source.match(/function\s+__construct\s*\([^)]*\)\s*\{/);
  assert.ok(match, 'constructor must exist');
  const start = match.index + match[0].length;
  let depth = 1;
  let quote = null;
  let escape = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i);
    }
  }
  throw new Error('constructor closing brace not found');
}

for (const [file, flag] of [
  ['Parents.php', 'parent_login'],
  ['Student.php', 'student_login'],
  ['Teacher.php', 'teacher_login'],
  ['Accountant.php', 'accountant_login'],
  ['Librarian.php', 'librarian_login'],
]) {
  test(`${file} rejects sessions that do not carry its own role login flag`, () => {
    const body = constructorBody(read(file));
    assert.match(body, new RegExp(`userdata\\s*\\(\\s*['\"]${flag}['\"]\\s*\\)\\s*!=\\s*1`));
    assert.match(body, /redirect\s*\(\s*site_url\s*\(\s*['\"]login['\"]/);
    assert.doesNotMatch(body, /userdata\s*\(\s*['\"]login_type['\"]\s*\)\s*==\s*['\"]{0,1}['\"]{0,1}/);
  });
}

test('parent portal does not expose wildcard CORS', () => {
  const parents = read('Parents.php');
  assert.doesNotMatch(parents, /Access-Control-Allow-Origin:\s*\*/i);
});
