<?php

define('BASEPATH', __DIR__);
class CI_Controller {}
require __DIR__ . '/../application/controllers/api/Sync.php';

class FakeSyncDb {
    public $existing = [];
    public $updates = [];
    public $inserts = [];
    private $whereKey;
    private $whereValue;

    public function where($key, $value) {
        $this->whereKey = $key;
        $this->whereValue = $value;
        return $this;
    }

    public function count_all_results($table) {
        $key = $table . ':' . (string)$this->whereValue;
        return !empty($this->existing[$key]) ? 1 : 0;
    }

    public function update($table, $data) {
        $this->updates[] = [
            'table' => $table,
            'where_key' => $this->whereKey,
            'where_value' => $this->whereValue,
            'data' => $data,
        ];
        return true;
    }

    public function insert($table, $data) {
        $this->inserts[] = ['table' => $table, 'data' => $data];
        return true;
    }
}

function assert_true($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function invoke_upsert($sync, $table, $data, $recordId) {
    $method = new ReflectionMethod(Sync::class, 'process_batch_record');
    $method->setAccessible(true);
    return $method->invoke($sync, $table, $data, $recordId);
}

$reflection = new ReflectionClass(Sync::class);
$sync = $reflection->newInstanceWithoutConstructor();
$db = new FakeSyncDb();
$sync->db = $db;

// Existing row: update in place and never write the primary key back.
$db->existing['student:7'] = true;
$result = invoke_upsert($sync, 'student', ['student_id' => 7, 'name' => 'Updated'], 7);
assert_true($result['operation'] === 'updated', 'existing row must report updated');
assert_true(count($db->updates) === 1, 'existing row must issue one UPDATE');
assert_true(count($db->inserts) === 0, 'existing row must not INSERT');
assert_true($db->updates[0]['where_key'] === 'student_id' && $db->updates[0]['where_value'] === 7, 'UPDATE must target the primary key');
assert_true(!array_key_exists('student_id', $db->updates[0]['data']), 'UPDATE payload must not mutate the primary key');

// New offline row: insert and retain record_id when data did not carry it.
$result = invoke_upsert($sync, 'student', ['name' => 'Offline Student'], 9);
assert_true($result['operation'] === 'inserted', 'new row must report inserted');
assert_true(count($db->inserts) === 1, 'new row must issue one INSERT');
assert_true($db->inserts[0]['data']['student_id'] === 9, 'INSERT must retain the offline primary key');

// Clients that carry the primary key inside data must also update in place.
$db->existing['student:11'] = true;
$result = invoke_upsert($sync, 'student', ['student_id' => 11, 'name' => 'Embedded ID'], null);
assert_true($result['operation'] === 'updated', 'embedded primary key must find the existing row');
assert_true(count($db->updates) === 2, 'embedded primary key must issue UPDATE');
assert_true($db->updates[1]['where_value'] === 11, 'embedded primary key must be used for lookup');

// Conflicting identities must be rejected instead of inserting under a different key.
$mismatchRejected = false;
try {
    invoke_upsert($sync, 'student', ['student_id' => 12, 'name' => 'Mismatch'], 13);
} catch (InvalidArgumentException $e) {
    $mismatchRejected = true;
}
assert_true($mismatchRejected, 'conflicting record_id and embedded primary key must be rejected');

fwrite(STDOUT, "PASS: FK-safe batch upsert behavior\n");
