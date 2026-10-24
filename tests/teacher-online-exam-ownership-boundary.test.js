const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Teacher_online_exam.php';
const routesPath = 'application/config/routes.php';

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
}

const controller = read(controllerPath);
const routes = read(routesPath);

test('guarded online exam controller extends the legacy teacher controller', () => {
  assert.match(controller, /require_once\s+APPPATH\s*\.\s*['\"]controllers\/Teacher\.php['\"]/);
  assert.match(controller, /class\s+Teacher_online_exam\s+extends\s+Teacher/);
});

test('exam ownership fails closed unless teacher owns the class or subject', () => {
  assert.match(controller, /function\s+can_manage_exam\s*\(/);
  assert.match(controller, /get_where\(['\"]online_exam['\"]/);
  assert.match(controller, /get_where\(['\"]class['\"]/);
  assert.match(controller, /get_where\(['\"]subject['\"]/);
  assert.match(controller, /get_where\(['\"]section['\"]/);
  assert.match(controller, /class_teacher_id/);
  assert.match(controller, /subject_teacher_id/);
  assert.match(controller, /class_teacher_id\s*===\s*\$teacher_id\s*\|\|\s*\$subject_teacher_id\s*===\s*\$teacher_id/);
});

test('create and edit validate the posted academic assignment while edit also validates existing exam ownership', () => {
  assert.match(controller, /function\s+can_manage_selection\s*\(/);
  assert.match(controller, /\$param1\s*===\s*['\"]create['\"][\s\S]*can_manage_selection/);
  assert.match(controller, /\$param1\s*===\s*['\"]edit['\"][\s\S]*can_manage_exam[\s\S]*can_manage_selection/);
  assert.match(controller, /\$param1\s*===\s*['\"]delete['\"][\s\S]*can_manage_exam/);
});

test('status, edit page, question management and results all enforce exam ownership', () => {
  for (const method of [
    'manage_online_exam_status',
    'update_online_exam',
    'load_question_type',
    'manage_online_exam_question',
    'view_online_exam_result'
  ]) {
    const pattern = new RegExp(`function\\s+${method}\\s*\\([\\s\\S]*?can_manage_exam`);
    assert.match(controller, pattern, `${method} must enforce exam ownership`);
  }
  assert.match(controller, /allowed_statuses\s*=\s*\[[^\]]*['\"]published['\"][^\]]*['\"]expired['\"]/);
});

test('question update and delete derive the parent exam from the question record', () => {
  assert.match(controller, /function\s+question_exam_id\s*\(/);
  assert.match(controller, /get_where\(['\"]question_bank['\"]/);
  assert.match(controller, /function\s+update_online_exam_question[\s\S]*question_exam_id[\s\S]*can_manage_exam/);
  assert.match(controller, /function\s+delete_question_from_online_exam[\s\S]*question_exam_id[\s\S]*can_manage_exam/);
});

test('all sensitive teacher online exam URLs are routed through the guarded controller', () => {
  const requiredRoutes = [
    "teacher/manage_online_exam",
    "teacher/update_online_exam/(:num)",
    "teacher/manage_online_exam_status/(:num)/(:any)",
    "teacher/load_question_type/(:any)/(:num)",
    "teacher/manage_online_exam_question/(:num)",
    "teacher/update_online_exam_question/(:num)/(:any)",
    "teacher/delete_question_from_online_exam/(:num)",
    "teacher/view_online_exam_result/(:num)"
  ];
  for (const route of requiredRoutes) {
    assert.ok(routes.includes(`$route['${route}']`), `missing guarded route ${route}`);
  }
  assert.match(routes, /teacher_online_exam\/manage_online_exam/);
  assert.match(routes, /teacher_online_exam\/update_online_exam/);
  assert.match(routes, /teacher_online_exam\/manage_online_exam_status/);
});

test('guarded controller uses explicit forbidden responses instead of silently redirecting unauthorized IDs', () => {
  assert.match(controller, /set_status_header\(403\)/);
  assert.match(controller, /access_denied/i);
});
