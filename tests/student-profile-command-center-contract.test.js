const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const includesBottom = fs.readFileSync(path.join(root, 'application', 'views', 'backend', 'includes_bottom.php'), 'utf8');
const enhancementPath = path.join(root, 'assets', 'js', 'student-profile-command-center.js');

test('student profile enhancement is loaded only for the student_profile page', () => {
  assert.match(includesBottom, /\$page_name\s*===?\s*['"]student_profile['"]/);
  assert.match(includesBottom, /student-profile-command-center\.js/);
});

test('student profile command center enhancement exists and reuses existing controls', () => {
  assert.equal(fs.existsSync(enhancementPath), true, 'student profile enhancement script must exist');
  const js = fs.readFileSync(enhancementPath, 'utf8');
  assert.match(js, /data-student-command-center/);
  assert.match(js, /student_information\//);
  assert.match(js, /data-tab=["']parent_info["']/);
  assert.match(js, /data-tab=["']exams["']/);
  assert.match(js, /data-tab=["']account["']/);
});

test('command center is progressive and mobile-aware', () => {
  assert.equal(fs.existsSync(enhancementPath), true, 'student profile enhancement script must exist');
  const js = fs.readFileSync(enhancementPath, 'utf8');
  assert.match(js, /DOMContentLoaded|document\.ready|readyState/);
  assert.match(js, /@media\s*\(max-width:\s*767px\)/);
  assert.doesNotMatch(js, /fetch\(|ajax\(|XMLHttpRequest/i, 'enhancement must not introduce data mutations or new network requests');
});

test('command center supports previous and next student review using the existing selector', () => {
  const js = fs.readFileSync(enhancementPath, 'utf8');
  assert.match(js, /data-command=["']previous-student["']/);
  assert.match(js, /data-command=["']next-student["']/);
  assert.match(js, /Previous student/i);
  assert.match(js, /Next student/i);
  assert.match(js, /studentSelector\.selectedIndex/);
  assert.match(js, /studentSelector\.dispatchEvent\(new Event\(['"]change['"]/);
});

test('student review navigation disables cleanly at the beginning and end of the selector list', () => {
  const js = fs.readFileSync(enhancementPath, 'utf8');
  assert.match(js, /previousAction\.disabled\s*=\s*currentIndex\s*<=\s*0/);
  assert.match(js, /nextAction\.disabled\s*=\s*currentIndex\s*>=\s*studentSelector\.options\.length\s*-\s*1/);
  assert.match(js, /student-command-action:disabled/);
});
