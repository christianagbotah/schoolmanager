const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const controllerPath = 'application/controllers/Admin.php';
const infoViewPath = 'application/views/backend/admin/student_information.php';
const selectorViewPath = 'application/views/backend/admin/student_information_selector.php';
const metroMenuPath = 'application/views/backend/admin/metro_menu.php';

const controller = fs.readFileSync(controllerPath, 'utf8');
const infoView = fs.readFileSync(infoViewPath, 'utf8');
const metroMenu = fs.readFileSync(metroMenuPath, 'utf8');

function methodBody(name) {
  const start = controller.indexOf(`function ${name}`);
  assert.ok(start >= 0, `missing ${name}`);
  const end = controller.indexOf('\n\tfunction ', start + 20);
  return controller.slice(start, end > start ? end : controller.length);
}

test('student information route provides a class selector when no class is supplied', () => {
  const body = methodBody('student_information');
  assert.match(body, /if\s*\(\s*empty\(\$class_id\)\s*\)/);
  assert.match(body, /page_name['"]?\]\s*=\s*['"]student_information_selector['"]/);
  assert.match(body, /\$page_data\[['"]classes['"]\]/);
  assert.ok(fs.existsSync(selectorViewPath), 'missing student information selector view');

  const selector = fs.readFileSync(selectorViewPath, 'utf8');
  assert.match(selector, /Choose a class/i);
  assert.match(selector, /admin\/student_information\//);
  assert.match(selector, /class_id/);
  assert.match(selector, /@media\s*\(max-width:/);
});

test('student information route handles missing section records without null dereference', () => {
  const body = methodBody('student_information');
  assert.match(body, /\$class\s*=\s*\$this->db->get_where\(['"]class['"]/);
  assert.match(body, /if\s*\(\s*!\$class\s*\)/);
  assert.match(body, /\$section\s*=\s*\$this->db->get_where\(['"]section['"]/);
  assert.match(body, /\$section_name\s*=\s*\$section\s*\?/);
  assert.doesNotMatch(body, /get_where\(['"]section['"][\s\S]{0,180}->row\(\)->name/);
});

test('student information permissions resolve the signed-in admin by ID, not display name', () => {
  assert.match(infoView, /get_where\(['"]admin['"],\s*array\(['"]admin_id['"]\s*=>\s*\$this->session->userdata\(['"]login_user_id['"]\)\)\)/);
  assert.doesNotMatch(infoView, /get_where\(['"]admin['"],\s*array\(['"]name['"]\s*=>\s*\$name\)\)/);
  assert.doesNotMatch(infoView, /\$section_id\s*=\s*\$this->db->get_where\(['"]section['"]/);
});

test('My Students metro tile enters the safe class-selector route', () => {
  assert.match(metroMenu, /site_url\(['"]admin\/student_information['"]\)/);
});
