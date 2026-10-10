<?php

define('BASEPATH', __DIR__);
class CI_Model {}
require __DIR__ . '/../application/models/Sync_model.php';

class FakeSyncDeleteResult {
    public function row_array() {
        return null;
    }
}

class FakeSyncDeleteDb {
    public $deleteCalls = 0;
    private $whereKey;
    private $whereValue;

    public function where($key, $value = null) {
        if (is_array($key)) {
            return $this;
        }
        $this->whereKey = $key;
        $this->whereValue = $value;
        return $this;
    }

    public function get($table) {
        return new FakeSyncDeleteResult();
    }

    public function delete($table) {
        $this->deleteCalls++;
        return true;
    }
}

function assert_true($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$reflection = new ReflectionClass(Sync_model::class);
$model = $reflection->newInstanceWithoutConstructor();
$db = new FakeSyncDeleteDb();
$model->db = $db;

$item = [
    'id' => 1,
    'table_name' => 'student',
    'operation' => 'DELETE',
    'data' => json_encode([
        'last_modified_at' => '2026-10-10 00:00:00',
    ]),
    'record_id' => 7,
];

$rejected = false;
try {
    $model->process_push_item($item, 'device-test');
} catch (RuntimeException $e) {
    $rejected = stripos($e->getMessage(), 'tombstone') !== false;
}

assert_true($rejected, 'Gen2 DELETE must be rejected with a tombstone-safety RuntimeException');
assert_true($db->deleteCalls === 0, 'Gen2 DELETE must never call the database delete method');

fwrite(STDOUT, "PASS: Gen2 DELETE is fail-closed until tombstone propagation is unified\n");
