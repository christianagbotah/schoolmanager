const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const renderer = fs.readFileSync('application/views/backend/include_main.php', 'utf8');
const assetPath = 'assets/js/admission-readiness.js';

test('student admission loads the readiness helper only for student_add', () => {
  assert.ok(fs.existsSync(assetPath), 'missing admission readiness asset');
  assert.match(renderer, /page_name\s*===?\s*['"]student_add['"]/);
  assert.match(renderer, /assets\/js\/admission-readiness\.js/);
});

test('readiness helper derives progress from the existing required controls', () => {
  const script = fs.readFileSync(assetPath, 'utf8');
  assert.match(script, /student_single_add_form/);
  assert.match(script, /\[required\]/);
  assert.match(script, /admissionReadinessProgress/);
  assert.match(script, /admissionReadinessCount/);
  assert.match(script, /updateAdmissionReadiness/);
});

test('readiness helper can jump to the first missing required field without changing submission', () => {
  const script = fs.readFileSync(assetPath, 'utf8');
  assert.match(script, /firstMissingRequired/);
  assert.match(script, /scrollIntoView/);
  assert.match(script, /focus\s*\(/);
  assert.doesNotMatch(script, /\.submit\s*\(|FormData|ajax|fetch\s*\(/i);
});

test('readiness helper is accessible and mobile friendly', () => {
  const script = fs.readFileSync(assetPath, 'utf8');
  assert.match(script, /aria-live/);
  assert.match(script, /role[^\n]*progressbar/);
  assert.match(script, /@media\s*\(max-width:\s*767px\)/);
});
