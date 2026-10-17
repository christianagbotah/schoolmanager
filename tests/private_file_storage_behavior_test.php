<?php
$root = realpath(__DIR__ . '/..');
if (!defined('BASEPATH')) define('BASEPATH', $root . '/system/');
if (!defined('FCPATH')) define('FCPATH', $root . DIRECTORY_SEPARATOR);

tmp_cleanup:
$tmp = sys_get_temp_dir() . '/iedupro-private-storage-' . bin2hex(random_bytes(6));
putenv('IEDUPRO_PRIVATE_STORAGE=' . $tmp);
require_once $root . '/application/libraries/Private_file_storage.php';

function check_or_fail($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$storage = new Private_file_storage();
$key = $storage->named_storage_key('syllabus', 'abc123', 'Term One.pdf');
check_or_fail($key === 'private://syllabus/abc123.pdf', 'named syllabus key should be deterministic and private');
check_or_fail($storage->named_storage_key('syllabus', 'abc123', 'payload.php') === '', 'executable extension must be rejected');
check_or_fail($storage->resolve('private://syllabus/../secret.pdf') === null, 'path traversal must be rejected');
check_or_fail($storage->resolve('/etc/passwd') === null, 'non-private absolute paths must be rejected');

$dir = $tmp . '/syllabus';
check_or_fail(mkdir($dir, 0750, true), 'temporary private directory should be created');
$file = $dir . '/abc123.pdf';
file_put_contents($file, 'test');
check_or_fail($storage->resolve($key) === realpath($file), 'valid private key should resolve inside private base');
check_or_fail($storage->delete($key) === true, 'delete should remove resolved private file');
check_or_fail(!file_exists($file), 'private file should be deleted');
@rmdir($dir);
@rmdir($tmp);
putenv('IEDUPRO_PRIVATE_STORAGE');

echo "PASS: private file storage rejects traversal and resolves only private keys\n";
