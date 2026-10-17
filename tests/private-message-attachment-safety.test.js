const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));

function functionBody(source, name) {
  const marker = new RegExp(`function\\s+${name}\\s*\\(`);
  const match = marker.exec(source);
  assert.ok(match, `${name} must exist`);
  const start = match.index;
  const tail = source.slice(start + match[0].length);
  const next = /\n\s*(?:public\s+|private\s+|protected\s+)?function\s+[A-Za-z0-9_]+\s*\(/.exec(tail);
  return source.slice(start, next ? start + match[0].length + next.index : source.length);
}

const crud = read('application/models/Crud_model.php');
const controllers = ['Admin.php','Parents.php','Student.php','Teacher.php']
  .map(f => read(`application/controllers/${f}`)).join('\n');
const messageViews = [
  'application/views/backend/admin/message_read.php',
  'application/views/backend/parent/message_read.php',
  'application/views/backend/student/message_read.php',
  'application/views/backend/teacher/message_read.php',
  'application/views/backend/shared/group_message_read.php',
].map(read).join('\n');

const migration = 'application/migrations/20261017_private_message_attachment_storage.sql';

test('message and group_message schema gain separate private storage keys', () => {
  assert.equal(exists(migration), true, `${migration} must exist`);
  const sql = read(migration);
  assert.match(sql, /ALTER\s+TABLE\s+`?message`?/i);
  assert.match(sql, /attached_file_storage_key/i);
  assert.match(sql, /ALTER\s+TABLE\s+`?group_message`?/i);
});

test('private message upload uses shared private storage and persists display name plus key', () => {
  const upload = functionBody(crud, 'upload_private_message_attachment');
  const helper = functionBody(crud, 'upload_message_attachment_to_private_storage');
  assert.match(upload, /upload_message_attachment_to_private_storage/);
  assert.match(upload, /message_attachments/);
  assert.match(helper, /Private_file_storage/);
  assert.doesNotMatch(helper, /FCPATH|uploads\//);

  for (const name of ['send_new_private_message', 'send_reply_message']) {
    const fn = functionBody(crud, name);
    assert.match(fn, /attached_file_name/);
    assert.match(fn, /attached_file_storage_key/);
    assert.match(fn, /storage_key/);
  }
});

test('group message attachments use private storage and persist storage keys', () => {
  const upload = functionBody(crud, 'upload_group_message_attachment');
  const helper = functionBody(crud, 'upload_message_attachment_to_private_storage');
  assert.match(upload, /upload_message_attachment_to_private_storage/);
  assert.match(upload, /group_message_attachments/);
  assert.match(helper, /Private_file_storage/);
  assert.doesNotMatch(helper, /FCPATH|uploads\//);

  const send = functionBody(crud, 'send_reply_group_message');
  assert.match(send, /attached_file_storage_key/);
  assert.match(send, /storage_key/);
});


test('stored attachments are cleaned up when message authorization or validation fails', () => {
  for (const name of ['send_new_private_message', 'send_reply_message', 'send_reply_group_message']) {
    const fn = functionBody(crud, name);
    assert.match(fn, /storage_key/);
    assert.match(fn, /delete_private_attachment_key\s*\(\s*\$storage_key\s*\)/, `${name} must remove a pre-stored attachment on rejection`);
  }
});

test('thread deletion is participant-scoped and removes private attachment files', () => {
  const privateDelete = functionBody(crud, 'delete_private_message_thread');
  assert.match(privateDelete, /is_message_thread_participant/);
  assert.match(privateDelete, /attached_file_storage_key/);
  assert.match(privateDelete, /delete_private_attachment_key/);
  const deleteHelper = functionBody(crud, 'delete_private_attachment_key');
  assert.match(deleteHelper, /Private_file_storage/);
  assert.match(deleteHelper, /delete\s*\(/);

  const groupDelete = functionBody(crud, 'delete_group_thread');
  assert.match(groupDelete, /is_group_thread_participant/);
  assert.match(groupDelete, /attached_file_storage_key/);
  assert.match(groupDelete, /delete_private_attachment_key/);
});

test('attachment download controller authorizes private and group thread participation', () => {
  const file = 'application/controllers/Message_attachment.php';
  assert.equal(exists(file), true, `${file} must exist`);
  const src = read(file);
  assert.match(src, /function\s+private_message\s*\(/);
  assert.match(src, /is_message_thread_participant/);
  assert.match(src, /function\s+group_message\s*\(/);
  assert.match(src, /is_group_thread_participant/);
  assert.match(src, /attached_file_storage_key/);
  assert.match(src, /Private_file_storage/);
  assert.match(src, /force_download/);
});

test('message views route attachment downloads through authenticated controller', () => {
  assert.match(messageViews, /message_attachment\/private_message/);
  assert.match(messageViews, /message_attachment\/group_message/);
  assert.doesNotMatch(messageViews, /uploads\/(?:private_messaging_attached_file|group_messaging_attached_file)/);
});


test('attachment display names are escaped in every message reader', () => {
  for (const file of [
    'application/views/backend/admin/message_read.php',
    'application/views/backend/parent/message_read.php',
    'application/views/backend/student/message_read.php',
    'application/views/backend/teacher/message_read.php',
    'application/views/backend/shared/group_message_read.php',
  ]) {
    const src = read(file);
    assert.doesNotMatch(src, /echo\s+\$row\['attached_file_name'\]/, `${file} must not render a raw filename`);
  }
});

test('role controllers no longer create or write public message attachment directories', () => {
  assert.doesNotMatch(controllers, /uploads\/(?:private_messaging_attached_file|group_messaging_attached_file)/);
  for (const src of [read('application/controllers/Admin.php'), read('application/controllers/Parents.php'), read('application/controllers/Student.php'), read('application/controllers/Teacher.php')]) {
    const message = functionBody(src, 'message');
    assert.doesNotMatch(message, /mkdir\s*\([^\n]*0777/);
    assert.doesNotMatch(message, /uploads\/(?:private_messaging_attached_file|group_messaging_attached_file)/);
  }
  for (const src of [read('application/controllers/Parents.php'), read('application/controllers/Student.php'), read('application/controllers/Teacher.php')]) {
    const message = functionBody(src, 'message');
    assert.match(message, /is_message_thread_participant/);
    assert.match(message, /delete_private_message_thread/);
  }
});

test('application no longer references public message attachment folders', () => {
  const files = [];
  const stack = [path.join(root, 'application')];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (/\.(php|js|css)$/i.test(ent.name)) files.push(full);
    }
  }
  const bad = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (/uploads\/(?:private_messaging_attached_file|group_messaging_attached_file)/.test(src)) bad.push(path.relative(root, file));
  }
  assert.deepEqual(bad, []);
});

test('dedicated CI workflow enforces the message attachment contract', () => {
  const file = '.github/workflows/private-message-attachment-safety.yml';
  assert.equal(exists(file), true, `${file} must exist`);
  const yml = read(file);
  assert.match(yml, /node --test tests\/private-message-attachment-safety\.test\.js/);
  assert.match(yml, /Message_attachment\.php/);
  assert.match(yml, /private_messaging_attached_file\|group_messaging_attached_file/);
});
