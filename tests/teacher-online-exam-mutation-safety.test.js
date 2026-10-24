const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controller = fs.readFileSync('application/controllers/Teacher_online_exam.php', 'utf8');
const manageView = fs.readFileSync('application/views/backend/teacher/manage_online_exam.php', 'utf8');
const questionView = fs.readFileSync('application/views/backend/teacher/manage_online_exam_question.php', 'utf8');

test('guarded controller has a reusable POST-only mutation boundary', () => {
  assert.match(controller, /function\s+require_post\s*\(/);
  assert.match(controller, /method\(true\)\s*!==\s*['\"]POST['\"]/);
  assert.match(controller, /set_status_header\(405\)/);
  assert.match(controller, /set_header\(['\"]Allow:\s*POST['\"]\)/);
});

test('exam status changes require POST before ownership/delegation', () => {
  assert.match(controller, /function\s+manage_online_exam_status[\s\S]*?require_post\([\s\S]*?can_manage_exam[\s\S]*?parent::manage_online_exam_status/);
});

test('exam deletion requires POST before ownership/delegation', () => {
  assert.match(controller, /\$param1\s*===\s*['\"]delete['\"][\s\S]*?require_post\([\s\S]*?can_manage_exam/);
});

test('question deletion requires POST before ownership/delegation', () => {
  assert.match(controller, /function\s+delete_question_from_online_exam[\s\S]*?require_post\([\s\S]*?question_exam_id[\s\S]*?can_manage_exam[\s\S]*?parent::delete_question_from_online_exam/);
});

test('exam management mutations are POST forms rather than destructive confirm_modal GET links', () => {
  assert.match(manageView, /form_open\([^\n]*manage_online_exam_status/);
  assert.match(manageView, /form_open\([^\n]*manage_online_exam\/delete/);
  assert.match(manageView, /type=[\"']submit[\"'][^>]*exam-action-(publish|cancel)/);
  assert.match(manageView, /type=[\"']submit[\"'][^>]*exam-action-delete/);
  assert.doesNotMatch(manageView, /confirm_modal\([^\n]*manage_online_exam_status/);
  assert.doesNotMatch(manageView, /confirm_modal\([^\n]*manage_online_exam\/delete/);
});

test('question deletion is a CSRF-aware POST form and no longer a destructive GET confirmation link', () => {
  assert.match(questionView, /form_open\([^\n]*delete_question_from_online_exam/);
  assert.match(questionView, /type=[\"']submit[\"'][^>]*btn-danger/);
  assert.doesNotMatch(questionView, /confirm_modal\([^\n]*delete_question_from_online_exam/);
});

test('mutation forms retain confirmation behavior without changing public routes', () => {
  assert.match(manageView, /confirmOnlineExamMutation/);
  assert.match(questionView, /confirmOnlineExamQuestionDelete/);
  for (const route of [
    'teacher/manage_online_exam_status/',
    'teacher/manage_online_exam/delete/',
    'teacher/delete_question_from_online_exam/'
  ]) {
    assert.ok(manageView.includes(route) || questionView.includes(route), `missing existing route ${route}`);
  }
});
