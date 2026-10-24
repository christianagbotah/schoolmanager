const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const addPath = 'application/views/backend/teacher/add_online_exam.php';
const editPath = 'application/views/backend/teacher/edit_online_exam.php';
const add = fs.readFileSync(addPath, 'utf8');
const edit = fs.readFileSync(editPath, 'utf8');

for (const [name, view] of [['add', add], ['edit', edit]]) {
  test(`${name} online exam form uses the resolved class collection instead of the undefined legacy variable`, () => {
    assert.doesNotMatch(view, /foreach\s*\(\s*\$classes_\s+as/);
    assert.match(view, /teacher_class_options/);
  });

  test(`${name} online exam form handles missing section records safely`, () => {
    assert.doesNotMatch(view, /->row\(\)->name/);
    assert.match(view, /section_row/);
  });

  test(`${name} online exam form renders a responsive command form shell`, () => {
    assert.match(view, /exam-form-shell/);
    assert.match(view, /exam-form-grid/);
    assert.match(view, /@media\s*\(max-width:\s*767px\)/);
  });

  test(`${name} online exam form preserves class, section, subject and timing contracts`, () => {
    for (const field of ['class_id', 'section_id', 'subject_id', 'exam_date', 'time_start', 'time_end', 'minimum_percentage', 'instruction']) {
      assert.ok(view.includes(`name=\"${field}\"`) || view.includes(`name = \"${field}\"`) || view.includes(`name = '${field}'`) || view.includes(`name='${field}'`), `missing ${field}`);
    }
    assert.match(view, /teacher\/get_class_section_selector\//);
    assert.match(view, /teacher\/get_class_subject_selector\//);
  });

  test(`${name} online exam minimum pass percentage is constrained to a valid range`, () => {
    assert.match(view, /name\s*=\s*[\"']minimum_percentage[\"'][^>]*type\s*=\s*[\"']number[\"']|type\s*=\s*[\"']number[\"'][^>]*name\s*=\s*[\"']minimum_percentage[\"']/);
    assert.match(view, /min\s*=\s*[\"']0[\"']/);
    assert.match(view, /max\s*=\s*[\"']100[\"']/);
  });
}

test('add online exam class options escape stored class labels', () => {
  assert.match(add, /html_escape\(\$option\[['\"]label['\"]\]\)/);
});

test('edit online exam escapes stored exam values and class option labels', () => {
  assert.match(edit, /html_escape\(\$online_exam\[['\"]title['\"]\]\)/);
  assert.match(edit, /html_escape\(\$online_exam\[['\"]instruction['\"]\]\)/);
  assert.match(edit, /html_escape\(\$option\[['\"]label['\"]\]\)/);
});
