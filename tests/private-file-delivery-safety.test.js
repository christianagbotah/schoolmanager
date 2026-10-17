const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const student = fs.readFileSync(path.join(root, 'application/controllers/Student.php'), 'utf8');
const parent = fs.readFileSync(path.join(root, 'application/controllers/Parents.php'), 'utf8');
const teacher = fs.readFileSync(path.join(root, 'application/controllers/Teacher.php'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'application/controllers/Admin.php'), 'utf8');
const crud = fs.readFileSync(path.join(root, 'application/models/Crud_model.php'), 'utf8');
const studyView = fs.readFileSync(path.join(root, 'application/views/backend/student/study_material.php'), 'utf8');

function body(source, name) {
  const re = new RegExp(`(?:public\\s+|private\\s+|protected\\s+)?function\\s+${name}\\s*\\(`);
  const match = re.exec(source);
  assert.ok(match, `${name} must exist`);
  const tail = source.slice(match.index + match[0].length);
  const next = /\r?\n\s*(?:public\s+|private\s+|protected\s+)?function\s+[A-Za-z0-9_]+\s*\(/.exec(tail);
  return source.slice(match.index, next ? match.index + match[0].length + next.index : source.length);
}

test('private file storage library lives outside FCPATH and rejects unsafe storage keys', () => {
  const rel = 'application/libraries/Private_file_storage.php';
  assert.equal(fs.existsSync(path.join(root, rel)), true, `${rel} must exist`);
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  assert.match(source, /dirname\s*\(\s*rtrim\s*\(\s*FCPATH/);
  assert.match(source, /schoolmanager-private/);
  assert.match(source, /random_bytes/);
  assert.match(source, /basename/);
  assert.match(source, /\.\.[\\/]|str_replace|preg_match/);
  assert.match(source, /allowed_extensions/);
  assert.match(source, /max_bytes/);
});

test('student study material listing is Approved-only and class-scoped', () => {
  const fn = body(crud, 'select_study_material_info_for_student');
  assert.match(fn, /student_id/);
  assert.match(fn, /class_id/);
  assert.match(fn, /['"]status['"]\s*=>\s*['"]Approved['"]/i);
  assert.match(fn, /private:\/\/study_materials/);
});

test('student study material view uses authenticated controller download, never a public upload URL', () => {
  assert.match(studyView, /student\/download_study_material/);
  assert.match(studyView, /document_id/);
  assert.doesNotMatch(studyView, /uploads\/(?:document|documents)/i);
});

test('student study material download requires own class and Approved status', () => {
  const fn = body(student, 'download_study_material');
  assert.match(fn, /student_id/);
  assert.match(fn, /class_id/);
  assert.match(fn, /document_id/);
  assert.match(fn, /['"]status['"]\s*=>\s*['"]Approved['"]/i);
  assert.match(fn, /private_file_storage|private_files/i);
  assert.match(fn, /404|show_404/);
});

test('study material uploads use private storage rather than web-root uploads', () => {
  for (const name of ['save_study_material_info', 'update_study_material_info']) {
    const fn = body(crud, name);
    assert.match(fn, /private_file_storage|private_files/i);
    assert.doesNotMatch(fn, /uploads\/documents\/lesson_notes/i);
    assert.doesNotMatch(fn, /move_uploaded_file\s*\(/);
  }
});

test('syllabus uploads use private storage and reject wildcard file types', () => {
  for (const [label, source] of [['teacher', teacher], ['admin', admin]]) {
    const fn = body(source, 'upload_academic_syllabus');
    assert.match(fn, /private_file_storage|private_files/i, `${label} syllabus upload must use private storage`);
    assert.doesNotMatch(fn, /uploads\/syllabus/i);
    assert.doesNotMatch(fn, /allowed_types['"]?\]\s*=\s*['"]\*['"]/i);
  }
});

test('student and parent syllabus downloads authorize class ownership and use private storage', () => {
  const studentFn = body(student, 'download_academic_syllabus');
  assert.match(studentFn, /class_id/);
  assert.match(studentFn, /student_id/);
  assert.match(studentFn, /private_file_storage|private_files/i);
  assert.doesNotMatch(studentFn, /uploads\/syllabus/i);

  const parentFn = body(parent, 'download_academic_syllabus');
  assert.match(parentFn, /class_id/);
  assert.match(parentFn, /parent_id/);
  assert.match(parentFn, /private_file_storage|private_files/i);
  assert.doesNotMatch(parentFn, /uploads\/syllabus/i);
});

test('staff syllabus downloads also use private storage, not public uploads', () => {
  for (const [label, source] of [['teacher', teacher], ['admin', admin]]) {
    const fn = body(source, 'download_academic_syllabus');
    assert.match(fn, /private_file_storage|private_files/i, `${label} syllabus download must use private storage`);
    assert.doesNotMatch(fn, /uploads\/syllabus/i);
  }
});

test('application no longer writes new syllabus or lesson-note files into public upload folders', () => {
  for (const rel of ['application/controllers', 'application/models']) {
    const stack = [path.join(root, rel)];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith('.php')) {
          const source = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(source, /(?:upload_path|move_uploaded_file|file_put_contents)[^;\n]*(?:uploads\/syllabus|uploads\/documents\/lesson_notes)/i, `${full} must not write protected files under public uploads`);
        }
      }
    }
  }
});
